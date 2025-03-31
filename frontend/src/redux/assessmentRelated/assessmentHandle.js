import axios from 'axios';
import {
    assessmentRequest,
    assessmentSuccess,
    singleAssessmentSuccess,
    addAssessmentSuccess,
    updateAssessmentSuccess,
    deleteAssessmentSuccess,
    assessmentFailed,
    assessmentError,
} from './assessmentSlice';

// Get all assessments for a subject
export const getSubjectAssessments = (subjectId) => async (dispatch) => {
    dispatch(assessmentRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/assessments/subject/${subjectId}`);
        if (result.data) {
            dispatch(assessmentSuccess(result.data));
        } else {
            dispatch(assessmentFailed("No assessments found"));
        }
    } catch (error) {
        dispatch(assessmentError(error.message));
    }
};

// Get a single assessment by ID
export const getAssessmentById = (assessmentId) => async (dispatch) => {
    dispatch(assessmentRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/assessments/${assessmentId}`);
        if (result.data) {
            dispatch(singleAssessmentSuccess(result.data));
        } else {
            dispatch(assessmentFailed("Assessment not found"));
        }
    } catch (error) {
        dispatch(assessmentError(error.message));
    }
};

// Create a new assessment
export const createAssessment = (assessmentData) => async (dispatch) => {
    dispatch(assessmentRequest());

    try {
        // Using FormData, so don't set Content-Type header (browser will set it with boundary)
        const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/assessments/create`, assessmentData);
        
        if (result.data) {
            dispatch(addAssessmentSuccess(result.data));
        } else {
            dispatch(assessmentFailed("Failed to create assessment"));
        }
    } catch (error) {
        dispatch(assessmentError(error.response?.data?.message || error.message));
    }
};

// Update an assessment
export const updateAssessment = (assessmentId, assessmentData) => async (dispatch) => {
    dispatch(assessmentRequest());

    try {
        const result = await axios.put(`${process.env.REACT_APP_BASE_URL}/assessments/${assessmentId}`, assessmentData, {
            headers: { 'Content-Type': 'application/json' },
        });
        
        if (result.data) {
            dispatch(updateAssessmentSuccess(result.data));
        } else {
            dispatch(assessmentFailed("Failed to update assessment"));
        }
    } catch (error) {
        dispatch(assessmentError(error.message));
    }
};

// Delete an assessment
export const deleteAssessment = (assessmentId) => async (dispatch) => {
    dispatch(assessmentRequest());

    try {
        const result = await axios.delete(`${process.env.REACT_APP_BASE_URL}/assessments/${assessmentId}`);
        
        if (result.data && result.data.success) {
            dispatch(deleteAssessmentSuccess(assessmentId));
        } else {
            dispatch(assessmentFailed(result.data?.message || "Failed to delete assessment"));
        }
    } catch (error) {
        dispatch(assessmentError(error.message));
    }
};

// Submit assessment results
export const submitAssessmentResults = (assessmentId, resultsData) => async (dispatch) => {
    dispatch(assessmentRequest());

    try {
        const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/assessments/${assessmentId}/results`, resultsData, {
            headers: { 'Content-Type': 'application/json' },
        });
        
        if (result.data) {
            dispatch(updateAssessmentSuccess(result.data));
        } else {
            dispatch(assessmentFailed("Failed to submit results"));
        }
    } catch (error) {
        dispatch(assessmentError(error.message));
    }
};
