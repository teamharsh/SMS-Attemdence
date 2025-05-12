const mongoose = require('mongoose');

// Helper function to get GridFS instance
const getGridFS = (req) => {
    // Try to get the gridfs instance from the request app or global
    const gfs = req.app.get('gridfs') || global.gfs;
    
    if (!gfs) {
        throw new Error('GridFS not initialized');
    }
    
    return gfs;
};

// Helper function to get GridFSBucket
const getGridFSBucket = (req) => {
    const conn = mongoose.connection;
    
    if (global.gridFSBucket) {
        return global.gridFSBucket;
    }
    
    if (!mongoose.mongo.GridFSBucket) {
        throw new Error('GridFSBucket not available');
    }
    
    // Create a new bucket instance
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
    });
    
    // Store it for future use
    global.gridFSBucket = bucket;
    req.app.set('gridFSBucket', bucket);
    
    return bucket;
};

// Get all files
const getFiles = async (req, res) => {
    try {
        const gfs = getGridFS(req);
        
        // Check if the files collection exists
        const conn = mongoose.connection;
        const collections = await conn.db.listCollections({ name: 'uploads.files' }).toArray();
        
        if (collections.length === 0) {
            return res.status(404).json({ 
                message: 'No files found - GridFS collections not initialized',
                error: 'Collection not found'
            });
        }
        
        const files = await gfs.files.find().toArray();
        
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'No files found' });
        }
        
        res.json(files);
    } catch (err) {
        console.error('Error retrieving files:', err);
        res.status(500).json({ 
            message: 'Error retrieving files',
            error: err.message
        });
    }
};

// Get file by ID
const getFile = async (req, res) => {
    try {
        const gfs = getGridFS(req);
        const file = await gfs.files.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        res.json(file);
    } catch (err) {
        console.error('Error retrieving file:', err);
        res.status(500).json({ 
            message: 'Error retrieving file',
            error: err.message
        });
    }
};

// Stream file for download
const streamFile = async (req, res) => {
    try {
        const gfs = getGridFS(req);
        const bucket = getGridFSBucket(req);
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        
        // Get file metadata
        const file = await gfs.files.findOne({ _id: fileId });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Set headers based on file type
        res.set('Content-Type', file.contentType || 'application/octet-stream');
        res.set('Content-Disposition', `inline; filename="${file.filename}"`);
        
        // Create a download stream using GridFSBucket
        const downloadStream = bucket.openDownloadStream(fileId);
        
        // Handle errors
        downloadStream.on('error', (err) => {
            console.error('Stream error:', err);
            if (!res.headersSent) {
                return res.status(500).json({ message: 'Error streaming file', error: err.message });
            }
        });
        
        // Pipe to response
        downloadStream.pipe(res);
    } catch (err) {
        console.error('Error streaming file:', err);
        res.status(500).json({ 
            message: 'Error streaming file',
            error: err.message
        });
    }
};

// Delete file
const deleteFile = async (req, res) => {
    try {
        const gfs = getGridFS(req);
        const bucket = getGridFSBucket(req);
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        
        // Ensure the file exists before attempting to delete
        const file = await gfs.files.findOne({ _id: fileId });
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Delete using GridFSBucket (more reliable)
        await bucket.delete(fileId);
        
        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error('Error deleting file:', err);
        res.status(500).json({ 
            message: 'Error deleting file',
            error: err.message
        });
    }
};

// Get files associated with an assessment
const getFilesByAssessment = async (req, res) => {
    try {
        const gfs = getGridFS(req);
        const files = await gfs.files.find({
            'metadata.assessmentId': req.params.assessmentId
        }).toArray();
        
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'No files found for this assessment' });
        }
        
        res.json(files);
    } catch (err) {
        console.error('Error retrieving assessment files:', err);
        res.status(500).json({ 
            message: 'Error retrieving assessment files',
            error: err.message
        });
    }
};

module.exports = {
    getFiles,
    getFile,
    streamFile,
    deleteFile,
    getFilesByAssessment
};
