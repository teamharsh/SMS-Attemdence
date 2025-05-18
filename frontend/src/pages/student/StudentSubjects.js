import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSubjectList } from "../../redux/sclassRelated/sclassHandle";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Container,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableHead,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Grid,
} from "@mui/material";
import { getUserDetails } from "../../redux/userRelated/userHandle";
import CustomBarChart from "../../components/CustomBarChart";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import InsertChartIcon from "@mui/icons-material/InsertChart";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import TableChartIcon from "@mui/icons-material/TableChart";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import QuizIcon from "@mui/icons-material/Quiz";
import { StyledTableCell, StyledTableRow } from "../../components/styles";

const StudentSubjects = ({ assessmentMode = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { subjectsList, sclassDetails } = useSelector((state) => state.sclass);
  const { userDetails, currentUser, loading, response, error } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    dispatch(getUserDetails(currentUser._id, "Student"));
  }, [dispatch, currentUser._id]);

  if (response) {
    console.log(response);
  } else if (error) {
    console.log(error);
  }

  const [subjectMarks, setSubjectMarks] = useState([]);
  const [selectedSection, setSelectedSection] = useState("table");
  const [assessments, setAssessments] = useState([]);
  const [subjectCompletionData, setSubjectCompletionData] = useState({});
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  useEffect(() => {
    if (userDetails) {
      setSubjectMarks(userDetails.examResult || []);
    }
  }, [userDetails]);

  useEffect(() => {
    if (subjectMarks.length === 0) {
      dispatch(getSubjectList(currentUser.sclassName._id, "ClassSubjects"));
    }
  }, [subjectMarks, dispatch, currentUser.sclassName._id]);

  // Fetch student assessments
  useEffect(() => {
    if (currentUser && currentUser._id) {
      fetchStudentAssessments();
    }
  }, [currentUser]);

  const fetchStudentAssessments = async () => {
    try {
      setAssessmentsLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/assessments/student/${currentUser._id}`
      );
      
      setAssessments(response.data);
      calculateSubjectCompletion(response.data);
      setAssessmentsLoading(false);
    } catch (err) {
      console.error("Error fetching student assessments:", err);
      setAssessmentsLoading(false);
    }
  };

  // Calculate completion percentage for each subject
  const calculateSubjectCompletion = (assessmentsData) => {
    if (!assessmentsData || !Array.isArray(assessmentsData)) return;
    
    const subjectData = {};
    
    assessmentsData.forEach(assessment => {
      if (assessment.subjectId && typeof assessment.subjectId === 'object') {
        const subjectId = assessment.subjectId._id;
        const subjectName = assessment.subjectId.subName;
        
        if (!subjectData[subjectId]) {
          subjectData[subjectId] = {
            id: subjectId,
            name: subjectName,
            total: 0,
            completed: 0
          };
        }
        
        // Get student's status for this assessment
        const studentResult = assessment.students?.find(
          student => student.studentId === currentUser._id
        );
        
        subjectData[subjectId].total++;
        
        if (studentResult && studentResult.status === 'Completed') {
          subjectData[subjectId].completed++;
        }
      }
    });
    
    // Calculate percentages
    Object.keys(subjectData).forEach(key => {
      const subject = subjectData[key];
      subject.completionPercentage = Math.round((subject.completed / subject.total) * 100) || 0;
    });
    
    setSubjectCompletionData(subjectData);
  };

  // Get completion percentage for a subject
  const getSubjectCompletionPercentage = (subjectId) => {
    return subjectCompletionData[subjectId]?.completionPercentage || 0;
  };

  const handleSectionChange = (event, newSection) => {
    setSelectedSection(newSection);
  };

  // Navigate to assessment page for the selected subject
  const handleViewAssessments = (subjectId) => {
    navigate(`/Student/assessments/${subjectId}`);
  };

  const renderTableSection = () => {
    return (
      <>
        <Typography variant="h4" align="center" gutterBottom>
          Subject Marks
        </Typography>
        <Table>
          <TableHead>
            <StyledTableRow>
              <StyledTableCell>Subject</StyledTableCell>
              <StyledTableCell>Marks</StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {subjectMarks.map((result, index) => {
              if (!result.subName || !result.marksObtained) {
                return null;
              }
              return (
                <StyledTableRow key={index}>
                  <StyledTableCell>{result.subName.subName}</StyledTableCell>
                  <StyledTableCell>{result.marksObtained}</StyledTableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </>
    );
  };

  const renderChartSection = () => {
    return <CustomBarChart chartData={subjectMarks} dataKey="marksObtained" />;
  };

  const renderClassDetailsSection = () => {
    return (
      <Container>
        <Typography variant="h4" align="center" gutterBottom>
          {assessmentMode ? "Select Subject for Assessments" : "Class Details"}
        </Typography>

        {!assessmentMode && (
          <Typography variant="h5" gutterBottom>
            You are currently in Class{" "}
            {sclassDetails && sclassDetails.sclassName}
          </Typography>
        )}

        {assessmentMode ? (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {subjectsList &&
              subjectsList.map((subject, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ height: "100%" }}>
                    <CardActionArea
                      sx={{ height: "100%" }}
                      onClick={() => handleViewAssessments(subject._id)}
                    >
                      <CardContent>
                        <Typography
                          variant="h6"
                          component="div"
                          gutterBottom
                          sx={{ color: "black" }}
                        >
                          {subject.subName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "black" }}>
                          Subject Code: {subject.subCode}
                        </Typography>
                        <br />
                        <Box sx={{ width: "100%", mb: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              mb: 0.5,
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>Completion Progress</span>
                            <span>{getSubjectCompletionPercentage(subject._id)}%</span>
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={getSubjectCompletionPercentage(subject._id)}
                            sx={{
                              height: 8,
                              borderRadius: 5,
                              backgroundColor: "rgba(0, 0, 0, 0.1)",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 5,
                                backgroundColor: "primary.main",
                              },
                            }}
                          />
                        </Box>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<QuizIcon />}
                          sx={{ mt: 2 }}
                        >
                          View Assessments
                        </Button>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
          </Grid>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              And these are the subjects:
            </Typography>
            {subjectsList &&
              subjectsList.map((subject, index) => (
                <div key={index}>
                  <Typography variant="subtitle1">
                    {subject.subName} ({subject.subCode})
                  </Typography>
                </div>
              ))}
          </>
        )}
      </Container>
    );
  };

  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {assessmentMode ? (
            renderClassDetailsSection()
          ) : (
            <>
              {subjectMarks &&
              Array.isArray(subjectMarks) &&
              subjectMarks.length > 0 ? (
                <>
                  {selectedSection === "table" && renderTableSection()}
                  {selectedSection === "chart" && renderChartSection()}

                  <Paper
                    sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
                    elevation={3}
                  >
                    <BottomNavigation
                      value={selectedSection}
                      onChange={handleSectionChange}
                      showLabels
                    >
                      <BottomNavigationAction
                        label="Table"
                        value="table"
                        icon={
                          selectedSection === "table" ? (
                            <TableChartIcon />
                          ) : (
                            <TableChartOutlinedIcon />
                          )
                        }
                      />
                      <BottomNavigationAction
                        label="Chart"
                        value="chart"
                        icon={
                          selectedSection === "chart" ? (
                            <InsertChartIcon />
                          ) : (
                            <InsertChartOutlinedIcon />
                          )
                        }
                      />
                    </BottomNavigation>
                  </Paper>
                </>
              ) : (
                <>{renderClassDetailsSection()}</>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default StudentSubjects;
