import axios from 'axios';
import {
    getRequest,
    getSuccess,
    getFailed,
    getError,
    postDone,
    doneSuccess,
    updateStatusRequest,
    updateStatusSuccess,
    updateStatusFailed
} from './teacherSlice';

export const getAllTeachers = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/Teachers/${id}`);
        if (result.data.message) {
            dispatch(getFailed(result.data.message));
        } else {
            dispatch(getSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error));
    }
}

export const getTeacherDetails = (id) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/Teacher/${id}`);
        if (result.data) {
            dispatch(doneSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error));
    }
}

export const updateTeachSubject = (teacherId, teachSubject) => async (dispatch) => {
    dispatch(getRequest());

    try {
        await axios.put(`${process.env.REACT_APP_BASE_URL}/TeacherSubject`, { teacherId, teachSubject }, {
            headers: { 'Content-Type': 'application/json' },
        });
        dispatch(postDone());
    } catch (error) {
        dispatch(getError(error));
    }
}

export const updateAssessmentStatus = (assessmentId, isCompleted) => async (dispatch) => {
    dispatch(updateStatusRequest());

    try {
        const result = await axios.put(`${process.env.REACT_APP_BASE_URL}/assessments/${assessmentId}/status`, 
            { isCompleted }, 
            { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (result.data) {
            dispatch(updateStatusSuccess());
        }
    } catch (error) {
        dispatch(updateStatusFailed(error.message));
    }
}