import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableHead,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TableContainer,
} from "@mui/material";
import {
  ArrowBack,
  PictureAsPdf,
  AssignmentTurnedIn,
} from "@mui/icons-material";
import { StyledTableCell, StyledTableRow } from "../../components/styles";
import PDFViewer from "../../components/PDFViewer";
import axios from "axios";

const StudentAssessmentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { currentUser } = useSelector((state) => state.user);
  
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const [currentTab, setCurrentTab] = useState(0);
  const [pageTitle, setPageTitle] = useState("Subject Assessments");

  useEffect(() => {
    if (subjectId) {
      fetchSubjectAssessments();
    } else if (currentUser && currentUser._id) {
      fetchAllStudentAssessments();
      setPageTitle("All Assessments");
    }
  }, [subjectId, currentUser]);

  const fetchSubjectAssessments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/assessments/subject/${subjectId}`
      );
      
      setAssessments(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching subject assessments:", err);
      setError("Failed to load assessments. Please try again later.");
      setLoading(false);
    }
  };

  const fetchAllStudentAssessments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/assessments/student/${currentUser._id}`
      );
      
      setAssessments(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching student assessments:", err);
      setError("Failed to load assessments. Please try again later.");
      setLoading(false);
    }
  };

  const handleViewPdf = (fileId) => {
    if (!fileId) {
      setError("No PDF document available");
      return;
    }

    const actualFileId = typeof fileId === "object" && fileId._id ? fileId._id : fileId;
    const pdfUrl = `${process.env.REACT_APP_BASE_URL}/files/${actualFileId}/view`;
    
    setCurrentPdfUrl(pdfUrl);
    setPdfOpen(true);
  };

  const handleClosePdf = () => {
    setPdfOpen(false);
    setCurrentPdfUrl("");
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Filter assessments based on status
  const ongoingAssessments = assessments?.filter(assessment => !assessment.isCompleted) || [];
  const completedAssessments = assessments?.filter(assessment => assessment.isCompleted) || [];

  // Find student's result in each assessment
  const getStudentResult = (assessment) => {
    if (!assessment || !assessment.students) return null;
    return assessment.students.find(
      student => student.studentId === currentUser._id
    );
  };

  const renderAssessmentTable = (assessmentList) => {
    if (assessmentList.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No assessments found in this category.
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2, overflowX: "auto" }}>
        <Table>
          <TableHead>
            <StyledTableRow>
              <StyledTableCell>Title</StyledTableCell>
              <StyledTableCell>Subject</StyledTableCell>
              <StyledTableCell>Date</StyledTableCell>
              <StyledTableCell>Total Marks</StyledTableCell>
              <StyledTableCell align="center">Your Marks</StyledTableCell>
              <StyledTableCell align="center">Status</StyledTableCell>
              <StyledTableCell align="center">Actions</StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {assessmentList.map((assessment) => {
              const studentResult = getStudentResult(assessment);
              
              return (
                <StyledTableRow key={assessment._id}>
                  <StyledTableCell>{assessment.title}</StyledTableCell>
                  <StyledTableCell>
                    {assessment.subjectId && typeof assessment.subjectId === 'object' 
                      ? assessment.subjectId.subName 
                      : 'Unknown Subject'}
                  </StyledTableCell>
                  <StyledTableCell>
                    {new Date(assessment.date).toLocaleDateString()}
                  </StyledTableCell>
                  <StyledTableCell>{assessment.totalMarks}</StyledTableCell>
                  <StyledTableCell align="center">
                    {studentResult?.marks !== null && studentResult?.marks !== undefined
                      ? studentResult.marks
                      : "Not graded yet"}
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Chip
                      label={studentResult?.status || "Pending"}
                      color={
                        studentResult?.status === "Completed"
                          ? "success"
                          : studentResult?.status === "Submitted"
                          ? "info"
                          : "warning"
                      }
                      size="small"
                    />
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                      <Button
                        variant="contained"
                        color="info"
                        size="small"
                        onClick={() => handleViewPdf(assessment.questionPdfUrl)}
                        startIcon={<PictureAsPdf />}
                      >
                        Questions
                      </Button>
                      
                      {assessment.isCompleted && assessment.solutionPdfUrl && (
                        <Button
                          variant="contained"
                          color="secondary"
                          size="small"
                          onClick={() => handleViewPdf(assessment.solutionPdfUrl)}
                          startIcon={<PictureAsPdf />}
                        >
                          Solution
                        </Button>
                      )}
                    </Box>
                  </StyledTableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Button
        startIcon={<ArrowBack />}
        variant="outlined"
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Typography variant="h5" gutterBottom fontWeight="medium" color="primary">
        {pageTitle}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Ongoing Assessments" />
            <Tab label="Completed Assessments" />
          </Tabs>

          {currentTab === 0 && renderAssessmentTable(ongoingAssessments)}
          {currentTab === 1 && renderAssessmentTable(completedAssessments)}
        </>
      )}

      {/* PDF Viewer Dialog */}
      {pdfOpen && (
        <PDFViewer
          open={pdfOpen}
          handleClose={handleClosePdf}
          pdfUrl={currentPdfUrl}
        />
      )}
    </Box>
  );
};

export default StudentAssessmentPage;
