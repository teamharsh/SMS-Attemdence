import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  Box,
  Checkbox,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  Chip,
} from '@mui/material';
import { getAllComplains } from '../../../redux/complainRelated/complainHandle';
import TableTemplate from '../../../components/TableTemplate';
import axios from 'axios';

const SeeComplains = () => {
  const dispatch = useDispatch();
  const { complainsList, loading, error, response } = useSelector(
    (state) => state.complain
  );
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(getAllComplains(currentUser._id, 'Complain'));
  }, [currentUser._id, dispatch]);

  const handleVisibilityToggle = async (complainId, currentVisibility) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_BASE_URL}/ComplainUpdate/${complainId}`,
        {
          visibleToTeacher: !currentVisibility,
        }
      );
      dispatch(getAllComplains(currentUser._id, 'Complain'));
    } catch (error) {
      console.error('Error updating complaint visibility:', error);
    }
  };

  const handleStatusChange = async (complainId, newStatus) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_BASE_URL}/ComplainStatus/${complainId}`,
        { status: newStatus }
      );
      dispatch(getAllComplains(currentUser._id, 'Complain'));
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

  if (error) {
    console.log(error);
  }

  const complainColumns = [
    { id: 'user', label: 'User', minWidth: 170 },
    { id: 'complaint', label: 'Complaint', minWidth: 200 },
    { id: 'date', label: 'Date', minWidth: 170 },
    { id: 'status', label: 'Status', minWidth: 120 },
    { id: 'visibility', label: 'Teacher Visibility', minWidth: 120 },
  ];

  // Format the complaints data
  const formattedComplaints =
    complainsList && complainsList.length > 0
      ? complainsList.map((complain) => {
          const date = new Date(complain.date);
          const dateString =
            date.toString() !== 'Invalid Date'
              ? date.toISOString().substring(0, 10)
              : 'Invalid Date';

          return {
            user: complain.user?.name || 'Unknown',
            complaint: complain.complaint,
            date: dateString,
            status: complain.status || 'Pending',
            visibility: complain.visibleToTeacher ? 'Visible' : 'Hidden',
            id: complain._id,
            visibleToTeacher: complain.visibleToTeacher,
          };
        })
      : [];

  const ComplainButtonHaver = ({ row }) => {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
        <Tooltip
          title={
            row.visibleToTeacher ? 'Hide from teachers' : 'Show to teachers'
          }>
          <IconButton
            onClick={() => handleVisibilityToggle(row.id, row.visibleToTeacher)}
            color={row.visibleToTeacher ? 'primary' : 'default'}>
            <Checkbox
              checked={row.visibleToTeacher}
              onChange={() =>
                handleVisibilityToggle(row.id, row.visibleToTeacher)
              }
            />
          </IconButton>
        </Tooltip>
      </Box>
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
    visibility: (value) => (
      <Chip
        label={value}
        color={value === 'Visible' ? 'success' : 'default'}
        size="small"
        variant="outlined"
      />
    ),
  };

  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {response ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '16px',
              }}>
              No Complains Right Now
            </Box>
          ) : (
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              {Array.isArray(formattedComplaints) &&
                formattedComplaints.length > 0 && (
                  <TableTemplate
                    buttonHaver={ComplainButtonHaver}
                    columns={complainColumns}
                    rows={formattedComplaints}
                    customColumnRender={customColumnRender}
                  />
                )}
            </Paper>
          )}
        </>
      )}
    </>
  );
};

export default SeeComplains;
