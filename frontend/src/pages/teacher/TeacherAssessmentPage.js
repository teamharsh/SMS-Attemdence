import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSubjectAssessments } from "../../redux/assessmentRelated/assessmentHandle";
import { updateAssessmentStatus } from "../../redux/teacherRelated/teacherHandle";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Collapse,
  Table,
  TableBody,
  TableHead,
  Typography,
  useTheme,
  useMediaQuery,
  Chip,
  Paper,
  CircularProgress,
  FormControlLabel,
  Switch,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  ArrowBack,
  PictureAsPdf,
  Add,
  Close as CloseIcon,
} from "@mui/icons-material";
import { StyledTableCell, StyledTableRow } from "../../components/styles";

const TeacherAssessmentPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { assessments, loading, error } = useSelector(
    (state) => state.assessment
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const teachSubject = currentUser?.teachSubject?.subName;
  const teachSubjectID = currentUser?.teachSubject?._id;

  const [openStates, setOpenStates] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [message, setMessage] = useState("");
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  useEffect(() => {
    if (teachSubjectID) {
      dispatch(getSubjectAssessments(teachSubjectID));
    }
  }, [dispatch, teachSubjectID]);

  const handleOpen = (assessmentId) => {
    setOpenStates((prevState) => ({
      ...prevState,
      [assessmentId]: !prevState[assessmentId],
    }));
  };

  // Helper function to determine color based on score
  const getScoreColor = (score, total) => {
    if (!score) return "warning";
    const percentage = (score / total) * 100;
    if (percentage >= 75) return "success";
    if (percentage >= 60) return "warning";
    return "error";
  };

  // Handle viewing PDF documents
  const handleViewPdf = (fileId) => {
    if (!fileId) {
      setMessage("No PDF document available");
      setShowPopup(true);
      return;
    }
    
    // Construct a proper URL to fetch the PDF file from the server
    const pdfUrl = `${process.env.REACT_APP_BASE_URL}/files/${fileId}/view`;
    
    // Set the current PDF URL and open the modal
    setCurrentPdfUrl(pdfUrl);
    setPdfLoading(true);
    setPdfError(null);
    setPdfOpen(true);
  };

  const handleClosePdf = () => {
    setPdfOpen(false);
    setCurrentPdfUrl("");
  };

  // Navigate to create assessment page
  const handleCreateAssessment = () => {
    if (!teachSubjectID) {
      alert("No subject assigned to you. Please contact administrator.");
      return;
    }
    console.log("Navigating to create assessment with subject ID:", teachSubjectID);
    navigate(`/Teacher/assessment/create/${teachSubjectID}`);
  };

  // Handle assessment status toggle
  const handleStatusChange = (assessment) => {
    setSelectedAssessment(assessment);
    setConfirmDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (!selectedAssessment) return;

    setStatusChangeLoading(true);
    const newStatus = !selectedAssessment.isCompleted;
    
    dispatch(updateAssessmentStatus(selectedAssessment._id, newStatus))
      .then(() => {
        // Refresh assessments list after status update
        dispatch(getSubjectAssessments(teachSubjectID));
        setConfirmDialogOpen(false);
        setStatusChangeLoading(false);
      })
      .catch((error) => {
        console.error("Error updating status:", error);
        setConfirmDialogOpen(false);
        setStatusChangeLoading(false);
      });
  };

  return (
    <>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: 2, bgcolor: "#f5f5f5" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              mb: 3,
              gap: 2,
            }}
          >
            <Button
              startIcon={<ArrowBack />}
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{ mb: isMobile ? 1 : 0 }}
            >
              Back
            </Button>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Add />}
                onClick={handleCreateAssessment}
              >
                New Assessment
              </Button>
            </Box>
          </Box>

          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: "medium",
              color: theme.palette.primary.main,
              mb: 3,
            }}
          >
            Subject: {teachSubject || "Not Assigned"}
          </Typography>

          {error && (
            <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: "#fdeded" }}>
              <Typography color="error">{error}</Typography>
            </Paper>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "medium" }}>
              Assessments
            </Typography>

            {assessments && assessments.length > 0 ? (
              <>
                <Paper
                  elevation={3}
                  sx={{ overflowX: "auto", mb: 4, borderRadius: 2 }}
                >
                  <Table sx={{ minWidth: isMobile ? 500 : 650 }}>
                    <TableHead>
                      <StyledTableRow>
                        <StyledTableCell>Title</StyledTableCell>
                        {!isMobile && <StyledTableCell>Date</StyledTableCell>}
                        <StyledTableCell>Total Marks</StyledTableCell>
                        <StyledTableCell align="center">Status</StyledTableCell>
                        <StyledTableCell align="center">
                          Actions
                        </StyledTableCell>
                      </StyledTableRow>
                    </TableHead>
                    <TableBody>
                      {assessments.map((assessment) => (
                        <React.Fragment key={assessment._id}>
                          <StyledTableRow
                            sx={{
                              "&:hover": {
                                backgroundColor: theme.palette.action.hover,
                              },
                              transition: "background-color 0.3s",
                            }}
                          >
                            <StyledTableCell>
                              <strong>{assessment.title}</strong>
                            </StyledTableCell>

                            {!isMobile && (
                              <StyledTableCell>
                                {new Date(assessment.date).toLocaleDateString()}
                              </StyledTableCell>
                            )}
                            <StyledTableCell>
                              {assessment.totalMarks}
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <Chip
                                  label={
                                    assessment.isCompleted
                                      ? "Completed"
                                      : "Ongoing"
                                  }
                                  color={
                                    assessment.isCompleted ? "success" : "warning"
                                  }
                                  size="small"
                                  variant="outlined"
                                />
                                <FormControlLabel
                                  control={
                                    <Switch
                                      size="small"
                                      checked={assessment.isCompleted}
                                      onChange={() => handleStatusChange(assessment)}
                                      color={assessment.isCompleted ? "success" : "warning"}
                                    />
                                  }
                                  label=""
                                />
                              </Box>
                            </StyledTableCell>

                            <StyledTableCell align="center">
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  justifyContent: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleOpen(assessment._id)}
                                  endIcon={
                                    openStates[assessment._id] ? (
                                      <KeyboardArrowUp />
                                    ) : (
                                      <KeyboardArrowDown />
                                    )
                                  }
                                  sx={{ minWidth: "100px" }}
                                >
                                  Details
                                </Button>
                                <Button
                                  variant="contained"
                                  color="info"
                                  size="small"
                                  onClick={() =>
                                    handleViewPdf(assessment.questionPdfUrl)
                                  }
                                  startIcon={<PictureAsPdf />}
                                  sx={{ minWidth: "100px" }}
                                >
                                  Questions
                                </Button>
                                {assessment.isCompleted && (
                                  <Button
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                    onClick={() =>
                                      handleViewPdf(assessment.solutionPdfUrl)
                                    }
                                    startIcon={<PictureAsPdf />}
                                    sx={{ minWidth: "100px" }}
                                    disabled={!assessment.solutionPdfUrl}
                                  >
                                    Solutions
                                  </Button>
                                )}
                              </Box>
                            </StyledTableCell>
                          </StyledTableRow>
                          <StyledTableRow>
                            <StyledTableCell
                              style={{ paddingBottom: 0, paddingTop: 0 }}
                              colSpan={isMobile ? 5 : 6}
                            >
                              <Collapse
                                in={openStates[assessment._id]}
                                timeout="auto"
                                unmountOnExit
                              >
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
                                      label={`${
                                        assessment.students?.length || 0
                                      } students`}
                                      size="small"
                                      color="secondary"
                                    />
                                  </Typography>
                                  {assessment.students &&
                                  assessment.students.length > 0 ? (
                                    <Box sx={{ overflowX: "auto" }}>
                                      <Table
                                        size="small"
                                        aria-label="student results"
                                      >
                                        <TableHead>
                                          <StyledTableRow>
                                            <StyledTableCell>
                                              Student Name
                                            </StyledTableCell>
                                            <StyledTableCell align="right">
                                              Marks
                                            </StyledTableCell>
                                            <StyledTableCell align="right">
                                              Status
                                            </StyledTableCell>
                                          </StyledTableRow>
                                        </TableHead>
                                        <TableBody>
                                          {assessment.students.map(
                                            (student) => (
                                              <StyledTableRow
                                                key={student._id || student.id}
                                              >
                                                <StyledTableCell
                                                  component="th"
                                                  scope="row"
                                                >
                                                  {student.name}
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                  <Chip
                                                    label={
                                                      student.marks !== null
                                                        ? `${student.marks}/${assessment.totalMarks}`
                                                        : "Pending"
                                                    }
                                                    color={getScoreColor(
                                                      student.marks,
                                                      assessment.totalMarks
                                                    )}
                                                    size="small"
                                                  />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                  <Chip
                                                    label={student.status}
                                                    color={
                                                      student.status ===
                                                      "Completed"
                                                        ? "success"
                                                        : "warning"
                                                    }
                                                    size="small"
                                                    variant="outlined"
                                                  />
                                                </StyledTableCell>
                                              </StyledTableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    </Box>
                                  ) : (
                                    <Typography>
                                      No student results available
                                    </Typography>
                                  )}
                                </Box>
                              </Collapse>
                            </StyledTableCell>
                          </StyledTableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </>
            ) : (
              <Paper
                elevation={2}
                sx={{ p: 3, borderRadius: 2, textAlign: "center" }}
              >
                <Typography variant="body1">
                  No assessments found for this subject.
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  startIcon={<Add />}
                  onClick={handleCreateAssessment}
                >
                  Create your first assessment
                </Button>
              </Paper>
            )}
          </Box>

          {/* PDF Viewer Dialog */}
          <Dialog
            open={pdfOpen}
            onClose={handleClosePdf}
            fullWidth
            maxWidth="md"
            PaperProps={{
              sx: { height: "80vh" },
            }}
          >
            <DialogTitle>
              Document Viewer
              <IconButton
                onClick={handleClosePdf}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {pdfLoading && (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                  <CircularProgress />
                </Box>
              )}
              {pdfError && (
                <Box sx={{ color: "error.main", textAlign: "center", my: 4 }}>
                  <Typography variant="h6">Error loading PDF</Typography>
                  <Typography variant="body1">{pdfError}</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => window.open(currentPdfUrl, "_blank")}
                  >
                    Open in New Tab
                  </Button>
                </Box>
              )}
              <Box sx={{ height: "100%", display: pdfLoading ? "none" : "block" }}>
                <iframe
                  src={currentPdfUrl}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  onLoad={() => setPdfLoading(false)}
                  onError={() => {
                    setPdfLoading(false);
                    setPdfError("Failed to load the PDF document.");
                  }}
                  title="PDF Viewer"
                />
              </Box>
            </DialogContent>
          </Dialog>

          {/* Confirmation Dialog */}
          <Dialog
            open={confirmDialogOpen}
            onClose={() => setConfirmDialogOpen(false)}
          >
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to change this assessment's status from{" "}
                <strong>
                  {selectedAssessment?.isCompleted ? "Completed" : "Ongoing"}
                </strong>{" "}
                to{" "}
                <strong>
                  {selectedAssessment?.isCompleted ? "Ongoing" : "Completed"}
                </strong>
                ?
                {selectedAssessment?.isCompleted && (
                  <Box sx={{ mt: 2, color: "warning.main" }}>
                    <strong>Warning:</strong> Setting an assessment back to "Ongoing" may allow 
                    students to continue submitting solutions.
                  </Box>
                )}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setConfirmDialogOpen(false)}
                disabled={statusChangeLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmStatusChange}
                color={selectedAssessment?.isCompleted ? "warning" : "success"}
                variant="contained"
                disabled={statusChangeLoading}
              >
                {statusChangeLoading ? <CircularProgress size={24} /> : "Confirm"}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </>
  );
};

export default TeacherAssessmentPage;
