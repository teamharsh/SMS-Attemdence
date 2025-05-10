import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';
import { StyledTableCell, StyledTableRow } from '../styles';

/**
 * StudentResultsTable component for displaying student assessment results
 * @param {Object} props
 * @param {Array} props.students - Array of student objects with results
 * @param {Number} props.totalMarks - Total possible marks for the assessment
 * @param {String} props.assessmentId - ID of the assessment
 * @param {Function} props.onUpdate - Callback function to refresh assessment data
 */
const StudentResultsTable = ({ students, totalMarks, assessmentId, onUpdate }) => {
  const [editingStudent, setEditingStudent] = useState(null);
  const [editedMarks, setEditedMarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Function to handle editing a student's marks
  const handleEdit = (studentId, currentMarks) => {
    setEditingStudent(studentId);
    setEditedMarks(currentMarks !== null ? currentMarks.toString() : "");
  };

  // Function to cancel editing
  const handleCancel = () => {
    setEditingStudent(null);
    setEditedMarks("");
  };

  // Function to save the edited marks
  const handleSave = async (studentId, studentName) => {
    // Validate marks
    const marksValue = parseFloat(editedMarks);
    if (isNaN(marksValue) || marksValue < 0 || marksValue > totalMarks) {
      setSnackbar({
        open: true,
        message: `Marks must be a number between 0 and ${totalMarks}`,
        severity: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // Always set status to 'Completed' when marks are entered
      // This ensures students can see their marks and status is properly updated
      const status = 'Completed';

      await axios.post(`${process.env.REACT_APP_BASE_URL}/assessments/${assessmentId}/results`, {
        studentId,
        marks: marksValue,
        status
      });

      setSnackbar({
        open: true,
        message: `Marks updated for ${studentName}`,
        severity: 'success'
      });
      setEditingStudent(null);
      
      // Call the onUpdate callback to refresh assessment data
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate();
      }
      
    } catch (error) {
      console.error('Error updating marks:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update marks. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to render the marks cell
  const renderMarksCell = (student) => {
    if (editingStudent === student.studentId) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            value={editedMarks}
            onChange={(e) => setEditedMarks(e.target.value)}
            type="number"
            size="small"
            sx={{ width: '80px' }}
            inputProps={{ min: 0, max: totalMarks }}
          />
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <IconButton
                color="primary"
                onClick={() => handleSave(student.studentId, student.name)}
                size="small"
              >
                <CheckCircleIcon />
              </IconButton>
              <IconButton
                color="error"
                onClick={handleCancel}
                size="small"
              >
                <CancelIcon />
              </IconButton>
            </>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {student.marks !== null ? (
          <>
            <Typography>{student.marks}</Typography>
            <IconButton
              size="small"
              onClick={() => handleEdit(student.studentId, student.marks)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(student.studentId, null)}
          >
            Enter Marks
          </Button>
        )}
      </Box>
    );
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get count of graded students
  const gradedCount = students?.filter(s => s.marks !== null).length || 0;
  
  // Calculate average mark (only for students who have marks)
  const totalPoints = students?.reduce((sum, student) => 
    student.marks !== null ? sum + student.marks : sum, 0);
  const average = gradedCount > 0 ? (totalPoints / gradedCount).toFixed(1) : '-';

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        Student Results ({gradedCount}/{students?.length || 0} graded, Average: {average})
      </Typography>
      
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <StyledTableRow>
              <StyledTableCell>Student Name</StyledTableCell>
              <StyledTableCell align="center">Marks (/{totalMarks})</StyledTableCell>
              <StyledTableCell align="center">Status</StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {students?.length > 0 ? (
              students.map((student) => (
                <StyledTableRow key={student.studentId}>
                  <StyledTableCell>{student.name}</StyledTableCell>
                  <StyledTableCell align="center">{renderMarksCell(student)}</StyledTableCell>
                  <StyledTableCell align="center">
                    <Chip
                      label={student.status}
                      color={
                        student.status === 'Completed'
                          ? 'success'
                          : student.status === 'Submitted'
                          ? 'info'
                          : 'warning'
                      }
                      size="small"
                    />
                  </StyledTableCell>
                </StyledTableRow>
              ))
            ) : (
              <StyledTableRow>
                <StyledTableCell colSpan={3} align="center">
                  No students found
                </StyledTableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentResultsTable;
