const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');

// MongoDB connection URI
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolManagement';

// Create storage engine with better error handling
const storage = new GridFsStorage({
    url: mongoURI,
    options: { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
    },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    console.error('Error generating filename:', err);
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads', // IMPORTANT: Must match the collection name in server.js
                    metadata: {
                        originalName: file.originalname,
                        contentType: file.mimetype,
                        uploadDate: new Date()
                    }
                };
                console.log(`Preparing to upload file to GridFS: ${filename}, bucket: uploads`);
                resolve(fileInfo);
            });
        });
    }
});

// Log when storage is ready
storage.on('connection', () => {
    console.log('GridFS Storage connected successfully');
});

// Log any errors
storage.on('connectionFailed', (err) => {
    console.error('GridFS Storage connection failed:', err);
});

// Log file storage events
storage.on('file', (file) => {
    console.log(`File saved to GridFS: ${file.filename}, id: ${file.id}`);
});

// Set up multer middleware with better error handling
const upload = multer({ 
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB max file size
    },
    fileFilter: function (req, file, cb) {
        console.log(`Processing file upload: ${file.originalname}, type: ${file.mimetype}`);
        // Accept only PDFs
        if (file.mimetype !== 'application/pdf') {
            console.error(`Invalid file type for ${file.originalname}: ${file.mimetype}`);
            return cb(new Error('Only PDF files are allowed'), false);
        }
        console.log(`File accepted: ${file.originalname}`);
        cb(null, true);
    }
});

module.exports = upload;
