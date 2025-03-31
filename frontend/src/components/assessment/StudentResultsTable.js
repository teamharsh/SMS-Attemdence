import React from 'react';
import {
  Box,
  Table,
  TableHead,
  TableBody,
  Typography,
  Chip,
} from '@mui/material';
import { StyledTableCell, StyledTableRow } from '../../components/styles';

/**
 * StudentResultsTable component for displaying student assessment results
 * @param {Object} props
 * @param {Array} props.students - Array of student objects with results
 * @param {Number} props.totalMarks - Total possible marks for the assessment
 */
const StudentResultsTable = ({ students, totalMarks }) => {
  // Helper function to determine color based on score
  const getScoreColor = (score, total) => {
    if (!score) return "warning";
    const percentage = (score / total) * 100;
    if (percentage >= 75) return "success";
    if (percentage >= 60) return "warning";
    return "error";
  };

  return (
    <Box sx={{ m: 2 }}>
      <Typography
        variant="h6"
        gutterBottom
        component="div"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        Student Results
        <Chip
          label={`${students?.length || 0} students`}
          size="small"
          color="secondary"
        />
      </Typography>
      
      {students && students.length > 0 ? (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" aria-label="student results">
            <TableHead>
              <StyledTableRow>
                <StyledTableCell>Student Name</StyledTableCell>
                <StyledTableCell align="right">Marks</StyledTableCell>
                <StyledTableCell align="right">Status</StyledTableCell>
              </StyledTableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <StyledTableRow key={student._id || student.id}>
                  <StyledTableCell component="th" scope="row">
                    {student.name}
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <Chip
                      label={
                        student.marks !== null
                          ? `${student.marks}/${totalMarks}`
                          : "Pending"
                      }
                      color={getScoreColor(student.marks, totalMarks)}
                      size="small"
                    />
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    <Chip
                      label={student.status}
                      color={
                        student.status === "Completed" ? "success" : "warning"
                      }
                      size="small"
                      variant="outlined"
                    />
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Typography>No student results available</Typography>
      )}
    </Box>
  );
};

export default StudentResultsTable;
