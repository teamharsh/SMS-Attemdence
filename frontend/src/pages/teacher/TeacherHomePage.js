import { Container, Grid, Paper, Typography } from '@mui/material';
import SeeNotice from '../../components/SeeNotice';
import CountUp from 'react-countup';
import styled from 'styled-components';
import Students from '../../assets/img1.png';
import Lessons from '../../assets/subjects.svg';
import Tests from '../../assets/assignment.svg';
import Time from '../../assets/time.svg';
import {
  getClassStudents,
  getSubjectDetails,
} from '../../redux/sclassRelated/sclassHandle';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import axios from 'axios';

const TeacherHomePage = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [totalAssessments, setTotalAssessments] = useState(0);

  const { currentUser } = useSelector((state) => state.user);
  const { subjectDetails, sclassStudents } = useSelector(
    (state) => state.sclass
  );

  const classID = currentUser.teachSclass?._id;
  const subjectID = currentUser.teachSubject?._id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch subject details and class students
        await Promise.all([
          dispatch(getSubjectDetails(subjectID, 'Subject')),
          dispatch(getClassStudents(classID)),
        ]);

        // Fetch complaints count
        const complaintsResponse = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/TeacherComplainList/${currentUser.school._id}`
        );
        const complaintsCount = Array.isArray(complaintsResponse.data)
          ? complaintsResponse.data.length
          : 0;
        setTotalComplaints(complaintsCount);

        // Fetch assessments count
        const assessmentsResponse = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/assessments/subject/${subjectID}`
        );
        const assessmentsCount = Array.isArray(assessmentsResponse.data)
          ? assessmentsResponse.data.length
          : 0;
        setTotalAssessments(assessmentsCount);

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load some data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    if (subjectID && classID && currentUser.school?._id) {
      fetchData();
    }
  }, [dispatch, subjectID, classID, currentUser.school?._id]);

  const numberOfStudents = sclassStudents && sclassStudents.length;
  const numberOfSessions = subjectDetails && subjectDetails.sessions;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} lg={3}>
            <StyledPaper>
              <img src={Students} alt="Students" />
              <Title>Class Students</Title>
              <Data start={0} end={numberOfStudents} duration={2.5} />
            </StyledPaper>
          </Grid>
          <Grid item xs={12} md={3} lg={3}>
            <StyledPaper>
              <img src={Lessons} alt="Lessons" />
              <Title>Total Lessons</Title>
              <Data start={0} end={numberOfSessions} duration={5} />
            </StyledPaper>
          </Grid>
          <Grid item xs={12} md={3} lg={3}>
            <StyledPaper>
              <img src={Tests} alt="Tests" />
              <Title>Total Assignments</Title>
              <Data start={0} end={totalAssessments} duration={2.5} />
            </StyledPaper>
          </Grid>
          <Grid item xs={12} md={3} lg={3}>
            <StyledPaper>
              <img src={Time} alt="Time" />
              <Title>Total Complaints</Title>
              <Data start={0} end={totalComplaints} duration={2.5} />
            </StyledPaper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <SeeNotice />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

const StyledPaper = styled(Paper)`
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 200px;
  justify-content: space-between;
  align-items: center;
  text-align: center;
`;

const Title = styled.p`
  font-size: 1.25rem;
`;

const Data = styled(CountUp)`
  font-size: calc(1.3rem + 0.6vw);
  color: green;
`;

export default TeacherHomePage;
