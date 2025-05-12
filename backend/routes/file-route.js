const router = require('express').Router();
const mongoose = require('mongoose');
const { fileUpload, ensureGridFSReady } = require('../middleware/file-upload-middleware');
const { 
    getFiles,
    getFile,
    streamFile,
    deleteFile,
    getFilesByAssessment
} = require('../controllers/file-controller.js');

// Add a simple test route
router.get('/test', (req, res) => {
    res.json({
        message: 'File route is working',
        timestamp: new Date().toISOString()
    });
});

// Get all files
router.get('/', ensureGridFSReady, getFiles);

// Get file by ID
router.get('/:id', ensureGridFSReady, getFile);

// Debug endpoint to check GridFS status
router.get('/status/check', async (req, res) => {
    try {
        const gfs = req.app.get('gridfs') || global.gfs;
        
        if (!gfs) {
            return res.status(500).json({ 
                error: 'GridFS not initialized',
                mongooseConnected: mongoose.connection.readyState === 1
            });
        }
        
        // Check if GridFS collections exist
        const collections = await mongoose.connection.db.listCollections({ name: /uploads/ }).toArray();
        
        // Get files
        const files = await gfs.files.find().toArray();
        
        res.json({
            status: 'GridFS check',
            collections: collections.map(c => c.name),
            fileCount: files.length,
            files: files.map(f => ({
                id: f._id,
                filename: f.filename,
                contentType: f.contentType,
                size: f.length,
                uploadDate: f.uploadDate
            })),
            mongoConnection: {
                readyState: mongoose.connection.readyState,
                host: mongoose.connection.host,
                name: mongoose.connection.name
            }
        });
    } catch (err) {
        console.error('Error in GridFS status check:', err);
        res.status(500).json({ 
            error: err.message,
            stack: err.stack 
        });
    }
});

// Stream file (for viewing)
router.get('/:id/view', ensureGridFSReady, async (req, res) => {
    try {
        // Get MongoDB connection
        const conn = mongoose.connection;
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        console.log(`Attempting to stream file with ID: ${fileId}`);
        
        // Get the file metadata from GridFS files collection
        const gfs = req.app.get('gridfs') || global.gfs;
        if (!gfs) {
            console.error('GridFS not initialized when accessing file');
            return res.status(500).json({ message: 'GridFS not initialized' });
        }
        
        // Find the file in GridFS
        const file = await gfs.files.findOne({ _id: fileId });
        if (!file) {
            console.error(`File not found: ${req.params.id}`);
            return res.status(404).json({ message: 'File not found' });
        }
        
        console.log(`Found file: ${file.filename}, type: ${file.contentType}`);
        
        // Set appropriate headers for PDF
        res.set('Content-Type', file.contentType || 'application/pdf');
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);
        res.set('Cache-Control', 'public, max-age=3600'); // Cache for better performance
        
        // Create GridFSBucket for streaming (modern approach)
        const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
            bucketName: 'uploads'
        });
        
        // Create download stream
        const downloadStream = bucket.openDownloadStream(fileId);
        
        // Handle stream errors
        downloadStream.on('error', error => {
            console.error(`Error streaming file ${fileId}:`, error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error streaming file' });
            }
        });
        
        // Pipe the file to the response
        downloadStream.pipe(res)
            .on('error', err => {
                console.error(`Pipe error for file ${fileId}:`, err);
                if (!res.headersSent) {
                    res.status(500).send('An error occurred while streaming the file');
                }
            });
    } catch (err) {
        console.error(`Error retrieving file ${req.params.id}:`, err);
        res.status(500).json({ message: 'Error retrieving file: ' + err.message });
    }
});

// Delete file
router.delete('/:id', ensureGridFSReady, deleteFile);

// Get files by assessment ID
router.get('/assessment/:assessmentId', ensureGridFSReady, getFilesByAssessment);

// File upload endpoint with more robust GridFS checking
router.post('/upload', fileUpload('file'), async (req, res) => {
    try {
        if (!req.file) {
            console.error('No file uploaded in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        console.log(`File uploaded successfully: ${req.file.filename}, id: ${req.file.id}`);
        
        // Return the file ID for frontend to use
        res.status(200).json({ 
            fileId: req.file.id,
            filename: req.file.filename,
            message: 'File uploaded successfully',
            details: {
                contentType: req.file.contentType,
                size: req.file.size,
                uploadDate: req.file.uploadDate
            } 
        });
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ 
            message: 'Error uploading file: ' + err.message,
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
        });
    }
});

// Add a route to reinitialize GridFS collections
router.post('/initialize-gridfs', async (req, res) => {
    try {
        const conn = mongoose.connection;
        
        // Check if GridFS collections exist
        const collections = await conn.db.listCollections({ name: /uploads/ }).toArray();
        const collectionsFound = collections.map(c => c.name);
        
        // If GridFS is already initialized
        if (collectionsFound.includes('uploads.files') && collectionsFound.includes('uploads.chunks')) {
            return res.json({ 
                message: 'GridFS collections already exist',
                collections: collectionsFound
            });
        }
        
        // Initialize GridFS collections by creating a temporary file
        if (!global.gridFSBucket) {
            // If gridFSBucket doesn't exist, create it
            if (!mongoose.mongo.GridFSBucket) {
                return res.status(500).json({
                    error: 'GridFSBucket not available',
                    mongooseReadyState: mongoose.connection.readyState
                });
            }
            
            const { GridFSBucket } = mongoose.mongo;
            global.gridFSBucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });
        }
        
        const bucket = global.gridFSBucket;
        
        // Create a simple buffer to store
        const buffer = Buffer.from('GridFS initialization file - ' + new Date().toISOString());
        
        // Create a unique filename
        const filename = `gridfs-init-${Date.now()}.txt`;
        
        // Upload the buffer to GridFS
        const uploadStream = bucket.openUploadStream(filename, {
            metadata: { purpose: 'initialization' }
        });
        
        uploadStream.end(buffer);
        
        // Wait for upload to complete
        await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
        });
        
        // Verify collections were created
        const newCollections = await conn.db.listCollections({ name: /uploads/ }).toArray();
        const newCollectionsFound = newCollections.map(c => c.name);
        
        // Make sure the global GridFS instances are available
        if (!global.gfs && newCollectionsFound.includes('uploads.files')) {
            // If GridFS instance doesn't exist, create it
            const Grid = require('gridfs-stream');
            global.gfs = Grid(conn.db, mongoose.mongo);
            global.gfs.collection('uploads');
            
            // Also set on app
            req.app.set('gridfs', global.gfs);
        }
        
        res.json({
            message: 'GridFS collections initialized successfully',
            before: collectionsFound,
            after: newCollectionsFound,
            filename: filename
        });
    } catch (err) {
        console.error('Error in GridFS initialization route:', err);
        res.status(500).json({ 
            error: err.message,
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
        });
    }
});

module.exports = router;
