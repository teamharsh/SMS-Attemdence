import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Tooltip,
} from '@mui/material';
import axios from 'axios';
import TableTemplate from '../../components/TableTemplate';

const TeacherComplain = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const [complainsList, setComplainsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeacherComplaints = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/TeacherComplainList/${currentUser.school._id}`
        );
        if (response.data.message) {
          setComplainsList([]);
        } else {
          // Format the complaints data
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
      }
      setLoading(false);
    };

    fetchTeacherComplaints();
  }, [currentUser.school._id]);

  const handleStatusChange = async (complainId, newStatus) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_BASE_URL}/ComplainStatus/${complainId}`,
        { status: newStatus }
      );
      // Refresh the complaints list
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/TeacherComplainList/${currentUser.school._id}`
      );
      if (!response.data.message) {
        const formattedComplaints = response.data.map((complain) => ({
          ...complain,
          user: complain.user?.name || 'Unknown',
        }));
        setComplainsList(formattedComplaints);
      }
    } catch (error) {
      console.error('Error updating complaint status:', error);
    }
  };

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
    { id: 'user', label: 'Student Name', minWidth: 170 },
    { id: 'complaint', label: 'Complaint', minWidth: 200 },
    { id: 'date', label: 'Date', minWidth: 170 },
    { id: 'status', label: 'Status', minWidth: 120 },
  ];

  const formattedComplaints = complainsList.map((complain) => {
    const date = new Date(complain.date);
    const dateString =
      date.toString() !== 'Invalid Date'
        ? date.toISOString().substring(0, 10)
        : 'Invalid Date';

    return {
      user: complain.user,
      complaint: complain.complaint,
      date: dateString,
      status: complain.status || 'Pending',
      id: complain._id,
    };
  });

  const ComplainButtonHaver = ({ row }) => {
    return (
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          size="small">
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Under Process">Under Process</MenuItem>
          <MenuItem value="Solved">Solved</MenuItem>
          <MenuItem value="Rejected">Rejected</MenuItem>
        </Select>
      </FormControl>
    );
  };

  const StatusCell = ({ value }) => (
    <Chip
      label={value}
      color={getStatusColor(value)}
      size="small"
      variant="outlined"
    />
  );

  const customColumnRender = {
    status: (value) => <StatusCell value={value} />,
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
          Student Complaints
        </Typography>
        {complainsList.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Typography>No complaints available</Typography>
          </Box>
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableTemplate
              buttonHaver={ComplainButtonHaver}
              columns={complainColumns}
              rows={formattedComplaints}
              customColumnRender={customColumnRender}
            />
          </Paper>
        )}
      </Box>
    </>
  );
};

export default TeacherComplain;
