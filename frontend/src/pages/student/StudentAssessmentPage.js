import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
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
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  PictureAsPdf,
  AssignmentTurnedIn,
} from '@mui/icons-material';
import { StyledTableCell, StyledTableRow } from '../../components/styles';
import PDFViewer from '../../components/PDFViewer';
import axios from 'axios';

const StudentAssessmentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { currentUser } = useSelector((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [pageTitle, setPageTitle] = useState('Subject Assessments');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    averageScore: 0,
  });

  const [assessmentStats, setAssessmentStats] = useState({
    totalStudents: 0,
    submittedCount: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    yourScore: 0,
    yourRank: 0,
    totalMarks: 0,
    dueDate: null,
    status: 'Pending',
  });

  useEffect(() => {
    if (subjectId) {
      fetchSubjectAssessments();
    } else if (currentUser && currentUser._id) {
      fetchAllStudentAssessments();
      setPageTitle('All Assessments');
    }
  }, [subjectId, currentUser]);

  const fetchSubjectAssessments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/assessments/subject/${subjectId}`
      );

      const assessmentData = Array.isArray(response.data) ? response.data : [];
      setAssessments(assessmentData);
      calculateAssessmentStats(assessmentData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subject assessments:', err);
      setError('Failed to load assessments. Please try again later.');
      setAssessments([]);
      setLoading(false);
    }
  };

  const fetchAllStudentAssessments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/StudentAssessments/${currentUser._id}`
      );

      const assessmentData = Array.isArray(response.data) ? response.data : [];
      setAssessments(assessmentData);
      calculateStats(assessmentData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching student assessments:', err);
      setError('Failed to load assessments. Please try again later.');
      setAssessments([]);
      setLoading(false);
    }
  };

  const calculateStats = (assessmentData) => {
    if (!Array.isArray(assessmentData)) {
      setStats({
        total: 0,
        completed: 0,
        pending: 0,
        averageScore: 0,
      });
      return;
    }

    const total = assessmentData.length;
    const completed = assessmentData.filter(
      (a) => a.status === 'Completed'
    ).length;
    const pending = total - completed;
    const averageScore =
      assessmentData.reduce((acc, curr) => {
        return acc + (curr.score || 0);
      }, 0) / completed || 0;

    setStats({
      total,
      completed,
      pending,
      averageScore: averageScore.toFixed(2),
    });
  };

  const calculateAssessmentStats = (assessmentData) => {
    if (!Array.isArray(assessmentData) || assessmentData.length === 0) {
      setAssessmentStats({
        totalStudents: 0,
        submittedCount: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        yourScore: 0,
        yourRank: 0,
        totalMarks: 0,
        dueDate: null,
        status: 'Pending',
      });
      return;
    }

    // For single assessment view
    if (subjectId && assessmentData.length === 1) {
      const assessment = assessmentData[0];
      const students = assessment.students || [];
      const submittedStudents = students.filter(
        (s) => s.status === 'Completed'
      );
      const scores = submittedStudents.map((s) => s.marks || 0);

      // Calculate your score and rank
      const yourResult = students.find((s) => s.studentId === currentUser._id);
      const yourScore = yourResult?.marks || 0;
      const yourRank = scores.filter((s) => s > yourScore).length + 1;

      setAssessmentStats({
        totalStudents: students.length,
        submittedCount: submittedStudents.length,
        averageScore: scores.length
          ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
          : 0,
        highestScore: Math.max(...scores, 0),
        lowestScore: scores.length ? Math.min(...scores) : 0,
        yourScore: yourScore,
        yourRank: yourRank,
        totalMarks: assessment.totalMarks || 0,
        dueDate: assessment.dueDate || assessment.date,
        status: yourResult?.status || 'Pending',
      });
    } else {
      // For all assessments view, use the existing stats calculation
      calculateStats(assessmentData);
    }
  };

  const handleViewPdf = (fileId) => {
    if (!fileId) {
      setError('No PDF document available');
      return;
    }

    const actualFileId =
      typeof fileId === 'object' && fileId._id ? fileId._id : fileId;
    const pdfUrl = `${process.env.REACT_APP_BASE_URL}/files/${actualFileId}/view`;

    setCurrentPdfUrl(pdfUrl);
    setPdfOpen(true);
  };

  const handleClosePdf = () => {
    setPdfOpen(false);
    setCurrentPdfUrl('');
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Filter assessments based on status
<<<<<<< HEAD
  const ongoingAssessments = Array.isArray(assessments) 
    ? assessments.filter(assessment => !assessment.isCompleted) 
    : [];
  const completedAssessments = Array.isArray(assessments) 
    ? assessments.filter(assessment => assessment.isCompleted) 
=======
  const ongoingAssessments = Array.isArray(assessments)
    ? assessments.filter((assessment) => !assessment.isCompleted)
    : [];
  const completedAssessments = Array.isArray(assessments)
    ? assessments.filter((assessment) => assessment.isCompleted)
>>>>>>> debfe8d07a703e2118f4de7b30f3c963092f8db2
    : [];

  // Find student's result in each assessment
  const getStudentResult = (assessment) => {
    if (!assessment || !Array.isArray(assessment.students)) return null;
    return assessment.students.find(
      (student) => student.studentId === currentUser._id
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getGradeColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'info';
    if (score >= 50) return 'warning';
    return 'error';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderAssessmentTable = (assessmentList) => {
    if (!Array.isArray(assessmentList) || assessmentList.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No assessments found in this category.
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
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
              if (!assessment) return null;
              const studentResult = getStudentResult(assessment);

              return (
                <StyledTableRow key={assessment._id || Math.random()}>
                  <StyledTableCell>{assessment.title}</StyledTableCell>
                  <StyledTableCell>
                    {assessment.subjectId &&
                    typeof assessment.subjectId === 'object'
                      ? assessment.subjectId.subName
                      : 'Unknown Subject'}
                  </StyledTableCell>
                  <StyledTableCell>
                    {new Date(assessment.date).toLocaleDateString()}
                  </StyledTableCell>
                  <StyledTableCell>{assessment.totalMarks}</StyledTableCell>
                  <StyledTableCell align="center">
                    {studentResult?.marks !== null &&
                    studentResult?.marks !== undefined ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                        }}>
                        <Typography
                          fontWeight="bold"
                          color={
                            studentResult.marks > assessment.totalMarks * 0.6
                              ? 'success.main'
                              : 'warning.main'
                          }>
                          {studentResult.marks}
                        </Typography>
                        {studentResult.status === 'Completed' && (
                          <Chip
                            label="Graded"
                            color="success"
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    ) : (
                      'Not graded yet'
                    )}
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Chip
                      label={studentResult?.status || 'Pending'}
                      color={
                        studentResult?.status === 'Completed'
                          ? 'success'
                          : studentResult?.status === 'Submitted'
                          ? 'info'
                          : 'warning'
                      }
                      size="small"
                    />
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 1,
                      }}>
                      <Button
                        variant="contained"
                        color="info"
                        size="small"
                        onClick={() => handleViewPdf(assessment.questionPdfUrl)}
                        startIcon={<PictureAsPdf />}>
                        Questions
                      </Button>

                      {assessment.isCompleted && assessment.solutionPdfUrl && (
                        <Button
                          variant="contained"
                          color="secondary"
                          size="small"
                          onClick={() =>
                            handleViewPdf(assessment.solutionPdfUrl)
                          }
                          startIcon={<PictureAsPdf />}>
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

  const renderStatisticsCards = () => {
    if (subjectId) {
      // Single Assessment View Cards
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Your Score
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {assessmentStats.yourScore}/{assessmentStats.totalMarks}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Rank: {assessmentStats.yourRank} of{' '}
                  {assessmentStats.totalStudents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Class Performance
                </Typography>
                <Typography variant="h6" color="success.main">
                  Highest: {assessmentStats.highestScore}
                </Typography>
                <Typography variant="h6" color="error.main">
                  Lowest: {assessmentStats.lowestScore}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Average: {assessmentStats.averageScore}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Submission Status
                </Typography>
                <Typography variant="h4" color="info.main">
                  {assessmentStats.submittedCount}/
                  {assessmentStats.totalStudents}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Students Submitted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Assessment Status
                </Typography>
                <Typography
                  variant="h6"
                  color={getStatusColor(assessmentStats.status)}>
                  {assessmentStats.status}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Due: {formatDate(assessmentStats.dueDate)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    } else {
      // All Assessments View Cards (existing cards)
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Assessments
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.completed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Score
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.averageScore}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading assessments: {error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Button
        startIcon={<ArrowBack />}
        variant="outlined"
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}>
        Back
      </Button>

      <Typography variant="h5" gutterBottom fontWeight="medium" color="primary">
        {pageTitle}
      </Typography>

      {renderStatisticsCards()}

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Ongoing Assessments" />
        <Tab label="Completed Assessments" />
      </Tabs>

      {currentTab === 0 && renderAssessmentTable(ongoingAssessments)}
      {currentTab === 1 && renderAssessmentTable(completedAssessments)}

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
