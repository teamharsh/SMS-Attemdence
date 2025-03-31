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

// Stream file (for viewing)
router.get('/:id/view', async (req, res) => {
    try {
        const gfs = req.app.get('gridfs');
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        
        const file = await gfs.files.findOne({ _id: fileId });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Set appropriate headers for PDF
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);
        
        // Create a download stream
        const downloadStream = gfs.createReadStream({ _id: fileId });
        downloadStream.on('error', error => {
            console.error('Error streaming file:', error);
            res.status(500).json({ message: 'Error streaming file' });
        });
        
        // Pipe the file to the response
        downloadStream.pipe(res);
    } catch (err) {
        console.error('Error retrieving file:', err);
        res.status(500).json({ message: 'Error retrieving file' });
    }
});

// Delete file
router.delete('/:id', deleteFile);

// Get files by assessment ID
router.get('/assessment/:assessmentId', getFilesByAssessment);

// File upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        
        // Return the file ID for frontend to use
        res.status(200).json({ 
            fileId: req.file.id,
            filename: req.file.filename,
            message: 'File uploaded successfully' 
        });
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ message: 'Error uploading file: ' + err.message });
    }
});

module.exports = router;
