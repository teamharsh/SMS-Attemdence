import axios from "axios";
import {
  getRequest,
  getSuccess,
  getFailed,
  getError,
  postDone,
  doneSuccess,
  updateStatusRequest,
  updateStatusSuccess,
  updateStatusFailed,
} from "./teacherSlice";

export const getAllTeachers = (id) => async (dispatch) => {
  dispatch(getRequest());

  try {
    const result = await axios.get(
      `${process.env.REACT_APP_BASE_URL}/Teachers/${id}`
    );
    if (result.data.message) {
      dispatch(getFailed(result.data.message));
    } else {
      dispatch(getSuccess(result.data));
    }
  } catch (error) {
    dispatch(getError(error));
  }
};

export const getTeacherDetails = (id) => async (dispatch) => {
  dispatch(getRequest());

  try {
    const result = await axios.get(
      `${process.env.REACT_APP_BASE_URL}/Teacher/${id}`
    );
    if (result.data) {
      dispatch(doneSuccess(result.data));
    }
  } catch (error) {
    dispatch(getError(error));
  }
};

export const updateTeachSubject =
  (teacherId, teachSubject) => async (dispatch) => {
    dispatch(getRequest());

    try {
      await axios.put(
        `${process.env.REACT_APP_BASE_URL}/TeacherSubject`,
        { teacherId, teachSubject },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      dispatch(postDone());
    } catch (error) {
      dispatch(getError(error));
    }
  };

export const updateAssessmentStatus =
  (assessmentId, isCompleted, solutionFileId) => async (dispatch) => {
    try {
      dispatch({ type: "UPDATE_TEACHER_REQUEST" });

      // Always set isCompleted to true regardless of parameter
      const requestData = { isCompleted: true };

      // Include solutionFileId if provided
      if (solutionFileId) {
        requestData.solutionPdfUrl = solutionFileId;
      }

      // Ensure the URL has proper formatting with a trailing slash to prevent concatenation issues
      const url = `${process.env.REACT_APP_BASE_URL}/assessments/${assessmentId}/status/`;

      const { data } = await axios.put(url, requestData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      dispatch({ type: "UPDATE_TEACHER_SUCCESS", payload: data });
      return data;
    } catch (error) {
      console.error("Error updating assessment status:", error);

      let errorMessage = "Failed to update assessment status";

      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        console.error("No response received from server");
        errorMessage = "Server did not respond";
      } else {
        console.error("Error setting up request:", error.message);
        errorMessage = error.message;
      }

      dispatch({
        type: "UPDATE_TEACHER_FAIL",
        payload: errorMessage,
      });

      throw new Error(errorMessage);
    }
  };
