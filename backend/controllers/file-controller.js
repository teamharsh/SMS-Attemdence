const mongoose = require('mongoose');

// Check if GridFS is available
const isGridFSAvailable = () => {
    try {
        require('gridfs-stream');
        return true;
    } catch (err) {
        return false;
    }
};

// Helper function to get GridFSBucket
const getGridFSBucket = (db) => {
    if (!db) {
        throw new Error('Database connection required');
    }
    return new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
};

// Get all files
const getFiles = async (req, res) => {
    if (!isGridFSAvailable()) {
        return res.status(501).json({ message: 'GridFS functionality not available. Please install required packages.' });
    }
    
    try {
        const gfs = req.app.get('gridfs');
        if (!gfs) {
            return res.status(500).json({ message: 'GridFS not initialized' });
        }
        
        const files = await gfs.files.find().toArray();
        
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'No files found' });
        }
        
        return res.json(files);
    } catch (error) {
        console.error('Error getting files:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get file by ID
const getFile = async (req, res) => {
    if (!isGridFSAvailable()) {
        return res.status(501).json({ message: 'GridFS functionality not available. Please install required packages.' });
    }
    
    try {
        const gfs = req.app.get('gridfs');
        if (!gfs) {
            return res.status(500).json({ message: 'GridFS not initialized' });
        }
        
        const file = await gfs.files.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        
        if (!file) {
            return res.status(404).json({ message: 'No file found' });
        }
        
        return res.json(file);
    } catch (error) {
        console.error('Error getting file:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Stream file by ID
const streamFile = async (req, res) => {
    if (!isGridFSAvailable()) {
        return res.status(501).json({ message: 'GridFS functionality not available. Please install required packages.' });
    }
    
    try {
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        const db = mongoose.connection.db;
        
        // Find the file metadata first
        const gfs = req.app.get('gridfs');
        const file = await gfs.files.findOne({ _id: fileId });
        
        if (!file) {
            return res.status(404).json({ message: 'No file found' });
        }
        
        // Set correct content type for PDF
        if (file.contentType === 'application/pdf' || file.filename.endsWith('.pdf')) {
            res.set('Content-Type', 'application/pdf');
        } else {
            res.set('Content-Type', file.contentType);
        }
        
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);
        
        // Use GridFSBucket for streaming instead of the older API
        const bucket = getGridFSBucket(db);
        const downloadStream = bucket.openDownloadStream(fileId);
        
        downloadStream.on('error', (err) => {
            console.error('Error in download stream:', err);
            if (!res.headersSent) {
                return res.status(500).json({ message: 'Error reading file stream', error: err.message });
            }
        });
        
        downloadStream.pipe(res);
    } catch (error) {
        console.error('Error streaming file:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete file by ID
const deleteFile = async (req, res) => {
    if (!isGridFSAvailable()) {
        return res.status(501).json({ message: 'GridFS functionality not available. Please install required packages.' });
    }
    
    try {
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        const db = mongoose.connection.db;
        const bucket = getGridFSBucket(db);
        
        await bucket.delete(fileId);
        
        return res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get files by assessment ID
const getFilesByAssessment = async (req, res) => {
    if (!isGridFSAvailable()) {
        return res.status(501).json({ message: 'GridFS functionality not available. Please install required packages.' });
    }
    
    try {
        const gfs = req.app.get('gridfs');
        if (!gfs) {
            return res.status(500).json({ message: 'GridFS not initialized' });
        }
        
        const files = await gfs.files.find({
            "metadata.assessmentId": req.params.assessmentId
        }).toArray();
        
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'No files found for this assessment' });
        }
        
        return res.json(files);
    } catch (error) {
        console.error('Error getting files by assessment:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getFiles,
    getFile,
    streamFile,
    deleteFile,
    getFilesByAssessment
};
