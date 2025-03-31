import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    assessments: [],
    currentAssessment: null,
    loading: false,
    error: null,
    response: null,
    status: 'idle',
};

const assessmentSlice = createSlice({
    name: 'assessment',
    initialState,
    reducers: {
        assessmentRequest: (state) => {
            state.status = 'loading';
            state.loading = true;
        },
        underControl: (state) => {
            state.status = 'idle';
            state.response = null;
        },
        assessmentSuccess: (state, action) => {
            state.status = 'succeeded';
            state.assessments = action.payload;
            state.loading = false;
            state.error = null;
            state.response = null;
        },
        singleAssessmentSuccess: (state, action) => {
            state.status = 'succeeded';
            state.currentAssessment = action.payload;
            state.loading = false;
            state.error = null;
            state.response = null;
        },
        addAssessmentSuccess: (state, action) => {
            state.status = 'added';
            state.assessments.push(action.payload);
            state.loading = false;
            state.error = null;
            state.response = null;
        },
        updateAssessmentSuccess: (state, action) => {
            state.status = 'updated';
            const index = state.assessments.findIndex(assessment => assessment._id === action.payload._id);
            if (index !== -1) {
                state.assessments[index] = action.payload;
            }
            state.loading = false;
            state.error = null;
            state.response = null;
        },
        deleteAssessmentSuccess: (state, action) => {
            state.status = 'deleted';
            state.assessments = state.assessments.filter(assessment => assessment._id !== action.payload);
            state.loading = false;
            state.error = null;
        },
        assessmentFailed: (state, action) => {
            state.status = 'failed';
            state.response = action.payload;
            state.loading = false;
        },
        assessmentError: (state, action) => {
            state.status = 'error';
            state.error = action.payload;
            state.loading = false;
        },
        clearCurrentAssessment: (state) => {
            state.currentAssessment = null;
        }
    },
});

export const {
    assessmentRequest,
    underControl,
    assessmentSuccess,
    singleAssessmentSuccess,
    addAssessmentSuccess,
    updateAssessmentSuccess,
    deleteAssessmentSuccess,
    assessmentFailed,
    assessmentError,
    clearCurrentAssessment
} = assessmentSlice.actions;

export const assessmentReducer = assessmentSlice.reducer;
