import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createAssessment } from "../../redux/assessmentRelated/assessmentHandle";
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  useTheme,
  Divider,
} from "@mui/material";
import { ArrowBack, Upload, Save } from "@mui/icons-material";

const TeacherCreateAssessmentPage = () => {
  const { subjectID } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  
  const { status, loading, error } = useSelector((state) => state.assessment);
  const { currentUser } = useSelector((state) => state.user);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD for input type="date"
    totalMarks: 100,
    subjectId: subjectID,
    teacherId: currentUser?._id || "",
  });
  
  const [questionFile, setQuestionFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  // Update formData if user or subjectID changes
  useEffect(() => {
    if (currentUser?._id && subjectID) {
      setFormData(prevState => ({
        ...prevState,
        subjectId: subjectID,
        teacherId: currentUser._id
      }));
    }
  }, [currentUser, subjectID]);

  // Check for success state from Redux
  useEffect(() => {
    if (status === 'added') {
      setSuccess(true);
      // Redirect after short delay
      const timer = setTimeout(() => {
        navigate(`/Teacher/assessment`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setFileError("Please upload only PDF files");
        setQuestionFile(null);
      } else {
        setFileError("");
        setQuestionFile(file);
      }
    }
  };

  const validateForm = () => {
    if (!formData.title || !formData.totalMarks || !questionFile) {
      setFormError("Please fill in all required fields and upload a question PDF");
      return false;
    }
    if (formData.totalMarks <= 0) {
      setFormError("Total marks must be greater than 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    
    if (!validateForm()) {
      return;
    }
    
    if (!formData.subjectId || formData.subjectId === "undefined") {
      setFormError("Subject ID is missing. Please check the URL or contact support.");
      return;
    }


    // Create FormData object for file upload
    const assessmentFormData = new FormData();
    assessmentFormData.append("title", formData.title);
    assessmentFormData.append("description", formData.description);
    assessmentFormData.append("date", formData.date); // Already in YYYY-MM-DD format
    assessmentFormData.append("totalMarks", formData.totalMarks);
    assessmentFormData.append("subjectId", formData.subjectId);
    assessmentFormData.append("teacherId", formData.teacherId);
    assessmentFormData.append("questionFile", questionFile);

    dispatch(createAssessment(assessmentFormData));
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: 2, bgcolor: "#f5f5f5", minHeight: "90vh" }}>
      <Button
        startIcon={<ArrowBack />}
        variant="outlined"
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Typography variant="h5" gutterBottom sx={{ fontWeight: "medium", color: theme.palette.primary.main }}>
        Create New Assessment
      </Typography>

      {success && (
        <Alert severity="success" sx={{ my: 2 }}>
          Assessment created successfully! Redirecting...
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {formError && (
        <Alert severity="warning" sx={{ my: 2 }}>
          {formError}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mt: 2, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Assessment Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Assessment Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Total Marks"
                name="totalMarks"
                type="number"
                value={formData.totalMarks}
                onChange={handleInputChange}
                variant="outlined"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>Upload Files</Divider>
              <Box sx={{ border: '1px dashed grey', borderRadius: 1, p: 3, textAlign: 'center' }}>
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  id="question-file"
                  onChange={handleFileChange}
                />
                <label htmlFor="question-file">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<Upload />}
                  >
                    Upload Question PDF
                  </Button>
                </label>
                
                {fileError && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {fileError}
                  </Typography>
                )}
                
                {questionFile && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    File selected: {questionFile.name}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  disabled={loading}
                  sx={{ minWidth: 150 }}
                >
                  {loading ? <CircularProgress size={24} /> : "Create Assessment"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default TeacherCreateAssessmentPage;
