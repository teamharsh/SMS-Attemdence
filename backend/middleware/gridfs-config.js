const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');
const mongoose = require('mongoose');

// MongoDB connection URI from environment or default
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/schoolManagement';

// Helper function to generate random filename
const generateFilename = (file) => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
            if (err) {
                console.error('Error generating filename:', err);
                return reject(err);
            }
            const filename = buf.toString('hex') + path.extname(file.originalname);
            resolve(filename);
        });
    });
};

// Create storage engine with improved error handling
const storage = new GridFsStorage({
    url: mongoURI,
    options: { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
    },
    file: async (req, file) => {
        try {
            // Generate a random filename
            const filename = await generateFilename(file);
            
            // Log the upload attempt
            console.log(`Preparing to upload file to GridFS: ${filename}, original: ${file.originalname}`);
            
            // Create fileInfo with metadata
            const fileInfo = {
                filename: filename,
                bucketName: 'uploads',
                metadata: {
                    originalName: file.originalname,
                    contentType: file.mimetype,
                    uploadDate: new Date(),
                    // If assessment ID is provided in the request, add it to metadata
                    ...(req.body && req.body.assessmentId && { assessmentId: req.body.assessmentId })
                }
            };
            
            return fileInfo;
        } catch (err) {
            console.error('Error in GridFS file config:', err);
            throw err;
        }
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

// Create a special middleware that ensures GridFS is ready before uploading
const ensureGridFSReady = (req, res, next) => {
    if (!global.gfs || !global.gridFSBucket) {
        console.error('GridFS not initialized in upload middleware');
        return res.status(500).json({ 
            message: 'File upload system not ready. Please try again in a moment.',
            error: 'GridFS not initialized'
        });
    }
    next();
};

// Set up multer middleware with better error handling
const upload = multer({ 
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB max file size
    },
    fileFilter: function (req, file, cb) {
        console.log(`Processing file upload: ${file.originalname}, type: ${file.mimetype}`);
        // Accept PDFs and common document types
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!allowedMimeTypes.includes(file.mimetype)) {
            console.error(`Invalid file type for ${file.originalname}: ${file.mimetype}`);
            return cb(new Error('Only PDF and document files are allowed'), false);
        }
        console.log(`File accepted: ${file.originalname}`);
        cb(null, true);
    }
});

// Create a wrapped upload middleware that first checks if GridFS is initialized
const safeUpload = {
    single: (fieldName) => {
        return [
            ensureGridFSReady,
            upload.single(fieldName)
        ];
    },
    array: (fieldName, maxCount) => {
        return [
            ensureGridFSReady,
            upload.array(fieldName, maxCount)
        ];
    },
    fields: (fields) => {
        return [
            ensureGridFSReady,
            upload.fields(fields)
        ];
    }
};

module.exports = safeUpload;
