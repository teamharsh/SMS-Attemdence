const router = require('express').Router();
const mongoose = require('mongoose');
const upload = require('../middleware/gridfs-config');
const { 
    getFiles,
    getFile,
    streamFile,
    deleteFile,
    getFilesByAssessment
} = require('../controllers/file-controller.js');

// Get all files
router.get('/', getFiles);

// Get file by ID
router.get('/:id', getFile);

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
router.get('/:id/view', async (req, res) => {
    try {
        // Get gfs from the app settings or global
        const gfs = req.app.get('gridfs') || global.gfs;
        
        if (!gfs) {
            console.error('GridFS not initialized when accessing file');
            return res.status(500).json({ message: 'GridFS not initialized' });
        }
        
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        console.log(`Attempting to stream file with ID: ${fileId}`);
        
        // Find the file in GridFS
        const file = await gfs.files.findOne({ _id: fileId });
        if (!file) {
            console.error(`File not found: ${req.params.id}`);
            return res.status(404).json({ message: 'File not found' });
        }
        
        console.log(`Found file: ${file.filename}, type: ${file.contentType}`);
        
        // Set appropriate headers for PDF
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);
        res.set('Cache-Control', 'public, max-age=3600'); // Cache for better performance
        
        // Create a download stream with error handling
        const downloadStream = gfs.createReadStream({ _id: fileId });
        
        downloadStream.on('error', error => {
            console.error(`Error streaming file ${fileId}:`, error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error streaming file' });
            }
        });
        
        // Pipe the file to the response with error handling
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

// Quick direct access route to test with the specific file ID
router.get('/specific/67eace5d7d28757ce6eefb78', async (req, res) => {
    try {
        const gfs = req.app.get('gridfs') || global.gfs;
        if (!gfs) {
            return res.status(500).json({ message: 'GridFS not initialized' });
        }
        
        const fileId = new mongoose.Types.ObjectId('67eace5d7d28757ce6eefb78');
        const file = await gfs.files.findOne({ _id: fileId });
        
        if (!file) {
            return res.status(404).json({ message: 'Specific test file not found' });
        }
        
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);
        
        const downloadStream = gfs.createReadStream({ _id: fileId });
        downloadStream.on('error', error => {
            console.error('Error streaming specific test file:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error streaming file' });
            }
        });
        
        downloadStream.pipe(res);
    } catch (err) {
        console.error('Error with specific file test route:', err);
        res.status(500).json({ message: 'Error: ' + err.message });
    }
});

// Delete file
router.delete('/:id', deleteFile);

// Get files by assessment ID
router.get('/assessment/:assessmentId', getFilesByAssessment);

// File upload endpoint with detailed logging
router.post('/upload', upload.single('file'), async (req, res) => {
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

module.exports = router;
