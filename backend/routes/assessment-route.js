const router = require('express').Router();
const { 
    createAssessment, 
    getSubjectAssessments, 
    getAssessment,
    updateAssessment,
    deleteAssessment,
    submitAssessmentResults,
    completeAssessment
} = require('../controllers/assessment-controller.js');
const upload = require('../middleware/gridfs-config');

// Create a new assessment with file upload
router.post('/create', upload.single('questionFile'), createAssessment);

// Get all assessments for a subject
router.get('/subject/:id', getSubjectAssessments);

// Get a single assessment by ID
router.get('/:id', getAssessment);

// Update assessment with optional file upload
router.put('/:id', upload.single('solutionFile'), updateAssessment);

// Delete assessment
router.delete('/:id', deleteAssessment);

// Submit or update student results for an assessment
router.post('/:id/results', submitAssessmentResults);

// Mark assessment as completed (original route, kept for backward compatibility)
router.put('/:id/complete', completeAssessment);

// Toggle assessment status (new route)
router.put('/:id/status', completeAssessment);

module.exports = router;
