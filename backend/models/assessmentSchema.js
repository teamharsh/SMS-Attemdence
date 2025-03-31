const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    date: {
        type: Date,
        required: true,
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 1,
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true,
    },
    questionPdfUrl: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    solutionPdfUrl: {
        type: mongoose.Schema.Types.ObjectId,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    students: [
        {
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'student',
            },
            name: {
                type: String,
            },
            marks: {
                type: Number,
                default: null,
            },
            status: {
                type: String,
                enum: ['Pending', 'Submitted', 'Completed'],
                default: 'Pending',
            },
        }
    ],
}, { timestamps: true });

module.exports = mongoose.model("assessment", assessmentSchema);
