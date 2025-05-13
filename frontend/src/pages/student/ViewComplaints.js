import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Paper, Box, Typography, CircularProgress, Chip } from '@mui/material';
import axios from 'axios';
import TableViewTemplate from '../../components/TableViewTemplate';

const ViewComplaints = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [complainsList, setComplainsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentComplaints = async () => {
      if (!currentUser?._id) return;

      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/StudentComplaints/${currentUser._id}`
        );
        if (response.data.message) {
          setComplainsList([]);
        } else {
          const formattedComplaints = response.data.map((complain) => ({
            ...complain,
            user: complain.user?.name || 'Unknown',
          }));
          setComplainsList(formattedComplaints);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching complaints:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentComplaints();
  }, [currentUser?._id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Solved':
        return 'success';
      case 'Under Process':
        return 'warning';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const complainColumns = [
    { id: 'complaint', label: 'Complaint', minWidth: 300 },
    { id: 'date', label: 'Date', minWidth: 170 },
    { id: 'status', label: 'Status', minWidth: 120 },
    { id: 'visibility', label: 'Teacher Visibility', minWidth: 120 },
  ];

  const complainRows = complainsList.map((complain) => {
    const date = new Date(complain.date);
    const dateString =
      date.toString() !== 'Invalid Date'
        ? date.toISOString().substring(0, 10)
        : 'Invalid Date';

    return {
      complaint: complain.complaint,
      date: dateString,
      status: complain.status || 'Pending',
      visibility: complain.visibleToTeacher
        ? 'Visible to Teachers'
        : 'Hidden from Teachers',
      id: complain._id,
    };
  });

  const customColumnRender = {
    status: (value) => (
      <Chip
        label={value}
        color={getStatusColor(value)}
        size="small"
        variant="outlined"
      />
    ),
    visibility: (value) => (
      <Chip
        label={value}
        color={value.includes('Visible') ? 'success' : 'default'}
        size="small"
        variant="outlined"
      />
    ),
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Typography color="error">Error loading complaints: {error}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          My Complaints
        </Typography>
        {complainsList.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Typography>No complaints submitted yet</Typography>
          </Box>
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableViewTemplate
              columns={complainColumns}
              rows={complainRows}
              customColumnRender={customColumnRender}
            />
          </Paper>
        )}
      </Box>
    </>
  );
};

export default ViewComplaints;
