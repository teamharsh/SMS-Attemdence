const router = require('express').Router();
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
router.get('/:id/view', streamFile);

// Delete file
router.delete('/:id', deleteFile);

// Get files by assessment ID
router.get('/assessment/:assessmentId', getFilesByAssessment);

module.exports = router;
