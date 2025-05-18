const router = require('express').Router();
const {
  createAssessment,
  getSubjectAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  submitAssessmentResults,
  completeAssessment,
  getStudentAssessments,
} = require('../controllers/assessment-controller.js');
const upload = require('../middleware/gridfs-config');

// Create a new assessment with file upload
router.post('/create', upload.single('questionFile'), createAssessment);

// Get all assessments for a subject
router.get('/subject/:id', getSubjectAssessments);

// Get all assessments for a student
router.get('/student/:id', getStudentAssessments);

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

// Toggle assessment status with optional solution file upload
router.put(
  '/:id/status',
  upload.single('solutionFile'),
  async (req, res, next) => {
    // If a file was uploaded, add its ID to the request body
    if (req.file) {
      req.body.solutionPdfUrl = req.file.id;
    }
    next();
  },
  completeAssessment
);

module.exports = router;
