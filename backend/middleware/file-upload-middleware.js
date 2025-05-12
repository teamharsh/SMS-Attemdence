const path = require('path');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const mongoose = require('mongoose');

// MongoDB connection URI from environment
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/schoolManagement';

// Create storage engine with improved error handling
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
                    bucketName: 'uploads',
                    metadata: {
                        originalName: file.originalname,
                        contentType: file.mimetype,
                        uploadDate: new Date(),
                        ...(req.body && req.body.assessmentId && { assessmentId: req.body.assessmentId })
                    }
                };
                
                console.log(`Preparing to upload file to GridFS: ${filename}`);
                resolve(fileInfo);
            });
        });
    }
});

// Log connection events
storage.on('connection', () => {
    console.log('GridFS Storage connected successfully');
});

storage.on('connectionFailed', (err) => {
    console.error('GridFS Storage connection failed:', err);
});

// Set up multer middleware
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
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        
        if (!allowedMimeTypes.includes(file.mimetype)) {
            console.error(`Invalid file type for ${file.originalname}: ${file.mimetype}`);
            return cb(new Error('Only PDF, document files, and common image formats are allowed'), false);
        }
        
        console.log(`File accepted: ${file.originalname}`);
        cb(null, true);
    }
});

// Create a middleware that first checks if GridFS is ready
const ensureGridFSReady = (req, res, next) => {
    try {
        // Check if mongoose is connected
        if (mongoose.connection.readyState !== 1) {
            console.error('Mongoose not connected when trying to upload');
            return res.status(500).json({ 
                message: 'Database connection not ready', 
                mongooseState: mongoose.connection.readyState 
            });
        }
        
        // Check if GridFS has been initialized
        if (!global.gfs) {
            console.warn('GridFS not initialized, attempting to initialize now');
            
            // Try to initialize GridFS on demand
            const conn = mongoose.connection;
            const Grid = require('gridfs-stream');
            global.gfs = Grid(conn.db, mongoose.mongo);
            global.gfs.collection('uploads');
            
            // Set GridFS on app
            req.app.set('gridfs', global.gfs);
        }
        
        // Check if GridFSBucket is available
        if (!global.gridFSBucket) {
            console.warn('GridFSBucket not initialized, creating it now');
            
            // Create bucket
            const conn = mongoose.connection;
            global.gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
            
            // Set on app
            req.app.set('gridFSBucket', global.gridFSBucket);
        }
        
        // Proceed to next middleware
        next();
    } catch (error) {
        console.error('Error ensuring GridFS ready:', error);
        res.status(500).json({ 
            message: 'Error preparing file upload system',
            error: error.message
        });
    }
};

// Exported middleware
module.exports = {
    upload,
    ensureGridFSReady,
    fileUpload: (fieldName) => [ensureGridFSReady, upload.single(fieldName)]
}; 