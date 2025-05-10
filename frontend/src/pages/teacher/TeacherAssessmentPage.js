import React, { useEffect, useState, useRef } from "react";
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
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  ArrowBack,
  PictureAsPdf,
  Add,
  Close as CloseIcon,
  CloudUpload,
} from "@mui/icons-material";
import { StyledTableCell, StyledTableRow } from "../../components/styles";
import PDFViewer from "../../components/PDFViewer";
import StudentResultsTable from "../../components/assessment/StudentResultsTable";
import axios from "axios";

const TeacherAssessmentPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { assessments, loading, error } = useSelector(
    (state) => state.assessment || { assessments: [] }
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const teachSubject = currentUser?.teachSubject?.subName;
  const teachSubjectID = currentUser?.teachSubject?._id;

  const [openStates, setOpenStates] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [solutionUploadDialogOpen, setSolutionUploadDialogOpen] =
    useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [message, setMessage] = useState("");
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

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

  const getScoreColor = (score, total) => {
    if (!score) return "warning";
    const percentage = (score / total) * 100;
    if (percentage >= 75) return "success";
    if (percentage >= 60) return "warning";
    return "error";
  };

  const handleViewPdf = (fileId) => {
    if (!fileId) {
      setMessage("No PDF document available");
      setShowPopup(true);
      return;
    }

    const actualFileId = typeof fileId === "object" && fileId._id ? fileId._id : fileId;

    console.log(`Viewing PDF with ID: ${actualFileId}`);

    const pdfUrl = `${process.env.REACT_APP_BASE_URL}/files/${actualFileId}/view`;
    console.log(`Constructed PDF URL: ${pdfUrl}`);

    setCurrentPdfUrl(pdfUrl);
    setPdfOpen(true);
  };

  const testViewSpecificPdf = () => {
    const knownFileId = "67eace5d7d28757ce6eefb78";
    handleViewPdf(knownFileId);
  };

  const handleClosePdf = () => {
    setPdfOpen(false);
    setCurrentPdfUrl("");
  };

  const handleCreateAssessment = () => {
    if (!teachSubjectID) {
      alert("No subject assigned to you. Please contact administrator.");
      return;
    }
    navigate(`/Teacher/assessment/create/${teachSubjectID}`);
  };

  const handleStatusChange = (assessment) => {
    setSelectedAssessment(assessment);

    if (!assessment.isCompleted) {
      setSolutionUploadDialogOpen(true);
    } else {
      setConfirmDialogOpen(true);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setUploadError(null);

      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      setUploadError(null);

      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    } else {
      setUploadError("Please select a PDF file");
    }
  };

  const handleSolutionUpload = async () => {
    if (!uploadedFile) {
      setUploadError("Please select a file to upload");
      return;
    }

    setStatusChangeLoading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const uploadResponse = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/files/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      if (!uploadResponse.data || !uploadResponse.data.fileId) {
        throw new Error("Server did not return a file ID");
      }

      const fileId = uploadResponse.data.fileId;

      const statusResponse = await dispatch(
        updateAssessmentStatus(selectedAssessment._id, true, fileId)
      );

      dispatch(getSubjectAssessments(teachSubjectID));

      setSolutionUploadDialogOpen(false);
      setUploadedFile(null);
      setPreviewUrl("");
      setUploadProgress(0);
    } catch (error) {
      console.error("Error details:", error);

      let errorMessage = "Failed to upload solution. Please try again.";

      if (error.response) {
        console.error("Error response data:", error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      }

      setUploadError(errorMessage);
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const confirmStatusChange = () => {
    if (!selectedAssessment) return;

    setStatusChangeLoading(true);

    dispatch(updateAssessmentStatus(selectedAssessment._id, false))
      .then(() => {
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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

              {process.env.NODE_ENV === "development" && (
                <Button
                  variant="outlined"
                  color="info"
                  onClick={testViewSpecificPdf}
                  startIcon={<PictureAsPdf />}
                >
                  Test PDF (67eace5d...)
                </Button>
              )}
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
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 1,
                                }}
                              >
                                <Chip
                                  label={
                                    assessment.isCompleted
                                      ? "Completed"
                                      : "Ongoing"
                                  }
                                  color={
                                    assessment.isCompleted
                                      ? "success"
                                      : "warning"
                                  }
                                  size="small"
                                  variant="outlined"
                                />
                                <FormControlLabel
                                  control={
                                    <Switch
                                      size="small"
                                      checked={assessment.isCompleted}
                                      onChange={() =>
                                        handleStatusChange(assessment)
                                      }
                                      color={
                                        assessment.isCompleted
                                          ? "success"
                                          : "warning"
                                      }
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
                                  onClick={() => {
                                    console.log(
                                      "Question PDF URL:",
                                      assessment.questionPdfUrl
                                    );
                                    handleViewPdf(assessment.questionPdfUrl);
                                  }}
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
                                <StudentResultsTable
                                  students={assessment.students}
                                  totalMarks={assessment.totalMarks}
                                  assessmentId={assessment._id}
                                />
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

          <PDFViewer
            open={pdfOpen}
            onClose={handleClosePdf}
            pdfUrl={currentPdfUrl}
            title="Document Viewer"
          />

          <Dialog
            open={confirmDialogOpen}
            onClose={() => setConfirmDialogOpen(false)}
          >
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to change this assessment's status from{" "}
                <strong>Completed</strong> to <strong>Ongoing</strong>?
                <Box sx={{ mt: 2, color: "warning.main" }}>
                  <strong>Warning:</strong> Setting an assessment back to
                  "Ongoing" may allow students to continue submitting solutions.
                </Box>
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
                color="warning"
                variant="contained"
                disabled={statusChangeLoading}
              >
                {statusChangeLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Confirm"
                )}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={solutionUploadDialogOpen}
            onClose={() =>
              !statusChangeLoading && setSolutionUploadDialogOpen(false)
            }
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Upload Solution Document</DialogTitle>
            <IconButton
              onClick={() =>
                !statusChangeLoading && setSolutionUploadDialogOpen(false)
              }
              sx={{ position: "absolute", right: 8, top: 8 }}
              disabled={statusChangeLoading}
            >
              <CloseIcon />
            </IconButton>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                Before marking this assessment as completed, please upload a
                solution document. This will be available to students after the
                assessment is completed.
              </DialogContentText>

              {uploadError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {uploadError}
                </Alert>
              )}

              <Box
                sx={{
                  border: "2px dashed #ccc",
                  borderRadius: 2,
                  p: 3,
                  mb: 3,
                  textAlign: "center",
                  backgroundColor: "#f8f8f8",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "primary.main",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  disabled={statusChangeLoading}
                />

                <CloudUpload fontSize="large" color="primary" />
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {uploadedFile
                    ? uploadedFile.name
                    : "Drag and drop a PDF file here or click to browse"}
                </Typography>
                {uploadedFile && (
                  <Typography variant="body2" color="textSecondary">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                )}
              </Box>

              {statusChangeLoading && (
                <Box sx={{ width: "100%", mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                  />
                  <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                    {uploadProgress}% Uploaded
                  </Typography>
                </Box>
              )}

              {previewUrl && (
                <Box sx={{ height: 300, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Preview:
                  </Typography>
                  <iframe
                    src={previewUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "1px solid #ccc",
                    }}
                    title="PDF Preview"
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setSolutionUploadDialogOpen(false)}
                disabled={statusChangeLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSolutionUpload}
                color="success"
                variant="contained"
                disabled={!uploadedFile || statusChangeLoading}
                startIcon={
                  statusChangeLoading ? <CircularProgress size={20} /> : null
                }
              >
                {statusChangeLoading
                  ? "Uploading..."
                  : "Upload & Mark Completed"}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </>
  );
};

export default TeacherAssessmentPage;
