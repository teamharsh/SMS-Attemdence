const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

// Try to load multer and GridFsStorage, but provide fallbacks
let multer, GridFsStorage;
try {
    multer = require('multer');
    GridFsStorage = require('multer-gridfs-storage').GridFsStorage;
} catch (err) {
    console.warn('GridFS dependencies not available. Using local file storage as fallback.');
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create uploads/assessments directory if it doesn't exist
const assessmentsDir = path.join(uploadsDir, 'assessments');
if (!fs.existsSync(assessmentsDir)) {
    fs.mkdirSync(assessmentsDir, { recursive: true });
}

let storage;

// If GridFsStorage is available, use it for MongoDB storage
if (GridFsStorage) {
    storage = new GridFsStorage({
        url: process.env.MONGO_URL,
        options: { useNewUrlParser: true, useUnifiedTopology: true },
        file: (req, file) => {
            return new Promise((resolve, reject) => {
                // Check file type
                if (file.mimetype !== 'application/pdf') {
                    return reject({
                        error: 'Only PDF files are allowed',
                        code: 'INVALID_FILE_TYPE'
                    });
                }

                // Generate a unique filename
                crypto.randomBytes(16, (err, buf) => {
                    if (err) {
                        return reject(err);
                    }
                    const filename = buf.toString('hex') + path.extname(file.originalname);
                    const fileInfo = {
                        filename: filename,
                        originalname: file.originalname,
                        bucketName: 'uploads',
                        metadata: {
                            type: file.fieldname, // 'questionFile' or 'solutionFile'
                            assessmentId: req.body.assessmentId || null,
                            uploadDate: new Date(),
                            uploader: req.body.teacherId || null
                        }
                    };
                    resolve(fileInfo);
                });
            });
        }
    });
}
// Otherwise, use local disk storage
else {
    const diskStorage = {
        destination: function (req, file, cb) {
            cb(null, assessmentsDir);
        },
        filename: function (req, file, cb) {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return cb(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                cb(null, filename);
            });
        }
    };
    
    storage = diskStorage;
}

// Create multer middleware or a fallback
const upload = multer ? multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
}) : {
    // Fallback implementation if multer is not available
    single: () => (req, res, next) => {
        console.warn('Multer not available. File upload will not work.');
        req.file = null;
        next();
    }
};

module.exports = upload;
