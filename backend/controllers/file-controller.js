const mongoose = require('mongoose');

// Get all files
const getFiles = async (req, res) => {
    try {
        const gfs = req.app.get('gridfs');
        const files = await gfs.files.find().toArray();
        
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'No files found' });
        }
        
        res.json(files);
    } catch (err) {
        console.error('Error retrieving files:', err);
        res.status(500).json({ message: 'Error retrieving files' });
    }
};

// Get file by ID
const getFile = async (req, res) => {
    try {
        const gfs = req.app.get('gridfs');
        const file = await gfs.files.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        res.json(file);
    } catch (err) {
        console.error('Error retrieving file:', err);
        res.status(500).json({ message: 'Error retrieving file' });
    }
};

// Stream file for download
const streamFile = async (req, res) => {
    try {
        const gfs = req.app.get('gridfs');
        const file = await gfs.files.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Set headers based on file type
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);
        
        // Create a read stream
        const readstream = gfs.createReadStream({ _id: file._id });
        
        // Handle errors
        readstream.on('error', (err) => {
            console.error('Stream error:', err);
            return res.status(500).json({ message: 'Error streaming file' });
        });
        
        // Pipe to response
        readstream.pipe(res);
    } catch (err) {
        console.error('Error streaming file:', err);
        res.status(500).json({ message: 'Error streaming file' });
    }
};

// Delete file
const deleteFile = async (req, res) => {
    try {
        const gfs = req.app.get('gridfs');
        await gfs.files.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error('Error deleting file:', err);
        res.status(500).json({ message: 'Error deleting file' });
    }
};

// Get files associated with an assessment
const getFilesByAssessment = async (req, res) => {
    try {
        const gfs = req.app.get('gridfs');
        const files = await gfs.files.find({
            'metadata.assessmentId': req.params.assessmentId
        }).toArray();
        
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'No files found for this assessment' });
        }
        
        res.json(files);
    } catch (err) {
        console.error('Error retrieving assessment files:', err);
        res.status(500).json({ message: 'Error retrieving assessment files' });
    }
};

module.exports = {
    getFiles,
    getFile,
    streamFile,
    deleteFile,
    getFilesByAssessment
};
