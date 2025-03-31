const Assessment = require('../models/assessmentSchema.js');
const Subject = require('../models/subjectSchema.js');
const Student = require('../models/studentSchema.js');
const mongoose = require('mongoose');

const createAssessment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'Question PDF file is required' });
        }

        // Validate required fields
        if (!req.body.subjectId) {
            return res.status(400).send({ message: 'Subject ID is required' });
        }
        if (!req.body.teacherId) {
            return res.status(400).send({ message: 'Teacher ID is required' });
        }
        

        const assessment = new Assessment({
            title: req.body.title,
            description: req.body.description,
            date: req.body.date,
            totalMarks: req.body.totalMarks,
            subjectId: req.body.subjectId,
            teacherId: req.body.teacherId,
            questionPdfUrl: req.file.id // Store the GridFS file ID
        });

        // Save assessment
        const result = await assessment.save();

        // Update file metadata with the assessment ID
        const gfs = req.app.get('gridfs');
        await gfs.files.updateOne(
            { _id: req.file.id },
            { $set: { "metadata.assessmentId": result._id } }
        );

        // Get students in the class associated with the subject
        const subject = await Subject.findById(req.body.subjectId);
        if (subject && subject.sclassName) {
            const students = await Student.find({ sclassName: subject.sclassName });
            
            // Add students to assessment with initial pending status
            const studentEntries = students.map(student => ({
                studentId: student._id,
                name: student.name,
                marks: null,
                status: 'Pending'
            }));

            result.students = studentEntries;
            await result.save();
        }

        res.status(201).send({
            ...result.toObject(),
            file: req.file
        });
    } catch (err) {
        console.error('Error creating assessment:', err);
        res.status(500).json({ message: err.message });
    }
};

// Get all assessments for a subject
const getSubjectAssessments = async (req, res) => {
    try {
        const subjectId = req.params.id;
        const assessments = await Assessment.find({ subjectId })
            .populate('teacherId', 'name')
            .populate('subjectId', 'subName');

        if (assessments.length > 0) {
            res.send(assessments);
        } else {
            res.send({ message: "No assessments found for this subject" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single assessment by ID
const getAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id)
            .populate('teacherId', 'name')
            .populate('subjectId', 'subName')
            .populate('students.studentId', 'name');

        if (assessment) {
            res.send(assessment);
        } else {
            res.status(404).send({ message: "Assessment not found" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update assessment
const updateAssessment = async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // Handle solution file upload if provided
        if (req.file) {
            updateData.solutionPdfUrl = req.file.id;
            
            // Update file metadata with the assessment ID
            const gfs = req.app.get('gridfs');
            await gfs.files.updateOne(
                { _id: req.file.id },
                { $set: { "metadata.assessmentId": req.params.id } }
            );
        }

        const result = await Assessment.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (result) {
            res.send(result);
        } else {
            res.status(404).send({ message: "Assessment not found" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete assessment
const deleteAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        
        if (!assessment) {
            return res.status(404).send({ message: "Assessment not found" });
        }

        // Delete associated files from GridFS
        const gfs = req.app.get('gridfs');
        
        // Delete question PDF if exists
        if (assessment.questionPdfUrl) {
            try {
                await gfs.remove({ 
                    _id: new mongoose.Types.ObjectId(assessment.questionPdfUrl), 
                    root: 'uploads' 
                });
            } catch (error) {
                console.error('Error deleting question PDF:', error);
            }
        }

        // Delete solution PDF if exists
        if (assessment.solutionPdfUrl) {
            try {
                await gfs.remove({ 
                    _id: new mongoose.Types.ObjectId(assessment.solutionPdfUrl), 
                    root: 'uploads' 
                });
            } catch (error) {
                console.error('Error deleting solution PDF:', error);
            }
        }

        // Delete assessment from database
        await Assessment.findByIdAndDelete(req.params.id);
        
        res.send({ success: true, message: "Assessment deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Submit/update student results
const submitAssessmentResults = async (req, res) => {
    try {
        const { studentId, marks, status } = req.body;
        const assessmentId = req.params.id;

        const assessment = await Assessment.findById(assessmentId);
        
        if (!assessment) {
            return res.status(404).send({ message: "Assessment not found" });
        }

        // Find the student in the assessment
        const studentIndex = assessment.students.findIndex(s => 
            s.studentId.toString() === studentId.toString()
        );

        if (studentIndex === -1) {
            return res.status(404).send({ message: "Student not found in this assessment" });
        }

        // Update student marks and status
        assessment.students[studentIndex].marks = marks;
        assessment.students[studentIndex].status = status;

        // Check if all students are completed to update assessment status
        const allCompleted = assessment.students.every(student => 
            student.status === 'Completed'
        );

        if (allCompleted) {
            assessment.isCompleted = true;
        }

        const result = await assessment.save();
        res.send(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Mark assessment as completed or toggle status
const completeAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        
        if (!assessment) {
            return res.status(404).send({ message: "Assessment not found" });
        }

        // Update fields from request body
        if (req.body) {
            // Update isCompleted status if provided
            if (req.body.hasOwnProperty('isCompleted')) {
                assessment.isCompleted = req.body.isCompleted;
            } else {
                assessment.isCompleted = true; // Default for backward compatibility
            }
            
            // Update solution PDF URL if provided
            if (req.body.solutionPdfUrl) {
                assessment.solutionPdfUrl = req.body.solutionPdfUrl;
                
                // Add metadata to the file in GridFS if gridfs is available
                try {
                    const gfs = req.app.get('gridfs');
                    if (gfs) {
                        await gfs.files.updateOne(
                            { _id: new mongoose.Types.ObjectId(req.body.solutionPdfUrl) },
                            { $set: { "metadata.assessmentId": assessment._id, "metadata.type": "solution" } }
                        );
                    }
                } catch (error) {
                    console.error('Error updating solution file metadata:', error);
                    // Continue with assessment update even if metadata update fails
                }
            }
        }
        
        const result = await assessment.save();
        res.send(result);
    } catch (err) {
        console.error('Error updating assessment status:', err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createAssessment,
    getSubjectAssessments,
    getAssessment,
    updateAssessment,
    deleteAssessment,
    submitAssessmentResults,
    completeAssessment
};
