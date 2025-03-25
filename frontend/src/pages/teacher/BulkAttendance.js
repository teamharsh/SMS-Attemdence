import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getClassStudents } from '../../redux/sclassRelated/sclassHandle';
import { updateStudentFields } from '../../redux/studentRelated/studentHandle';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, FormControl,
    Select, MenuItem, TextField, CircularProgress, Button,
    IconButton, Snackbar, Alert, Card, CardHeader, CardContent,
    Divider, Grid, Chip, Badge
} from '@mui/material';
import { PurpleButton } from '../../components/buttonStyles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import FilterListIcon from '@mui/icons-material/FilterList';

const BulkAttendance = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { classID, subjectID } = useParams();
    
    const { sclassStudents, loading } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector((state) => state.user);
    const { response, error } = useSelector((state) => state.student);

    const [attendanceData, setAttendanceData] = useState([]);
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [submitting, setSubmitting] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('success');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Stats for summary
    const [attendanceSummary, setAttendanceSummary] = useState({
        present: 0,
        absent: 0,
        total: 0
    });
    
    useEffect(() => {
        dispatch(getClassStudents(classID));
    }, [dispatch, classID]);

    useEffect(() => {
        if (sclassStudents && sclassStudents.length > 0) {
            // Initialize attendance data for all students
            const initialData = sclassStudents.map(student => ({
                studentId: student._id,
                name: student.name,
                rollNum: student.rollNum,
                status: 'Present' // Default status
            }));
            setAttendanceData(initialData);
            
            // Update summary
            setAttendanceSummary({
                present: initialData.length,
                absent: 0,
                total: initialData.length
            });
        }
    }, [sclassStudents]);

    useEffect(() => {
        if (response) {
            setAlertMessage('Attendance submitted successfully!');
            setAlertSeverity('success');
            setAlertOpen(true);
            setSubmitting(false);
        } else if (error) {
            setAlertMessage('Error submitting attendance: ' + error);
            setAlertSeverity('error');
            setAlertOpen(true);
            setSubmitting(false);
        }
    }, [response, error]);

    const handleStatusChange = (studentId, newStatus) => {
        setAttendanceData(prevData => 
            prevData.map(student => 
                student.studentId === studentId ? 
                { ...student, status: newStatus } : 
                student
            )
        );
        
        // Update summary
        const updatedData = attendanceData.map(student => 
            student.studentId === studentId ? 
            { ...student, status: newStatus } : 
            student
        );
        
        const present = updatedData.filter(student => student.status === 'Present').length;
        setAttendanceSummary({
            present,
            absent: updatedData.length - present,
            total: updatedData.length
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            // Process each student's attendance one by one
            const promises = attendanceData.map(student => {
                const fields = { 
                    subName: subjectID, 
                    status: student.status, 
                    date 
                };
                return dispatch(updateStudentFields(student.studentId, fields, "StudentAttendance"));
            });
            
            await Promise.all(promises);
            
            setAlertMessage('Attendance submitted successfully for all students!');
            setAlertSeverity('success');
            setAlertOpen(true);
        } catch (err) {
            setAlertMessage('Error submitting attendance');
            setAlertSeverity('error');
            setAlertOpen(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetAllStatus = (status) => {
        const updatedData = attendanceData.map(student => ({ ...student, status }));
        setAttendanceData(updatedData);
        
        // Update summary
        setAttendanceSummary({
            present: status === 'Present' ? updatedData.length : 0,
            absent: status === 'Absent' ? updatedData.length : 0,
            total: updatedData.length
        });
    };
    
    const filteredAttendanceData = attendanceData.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        student.rollNum.toString().includes(searchQuery)
    );

    return (
        <Box sx={{ p: 3 }}>
            <IconButton 
                onClick={() => navigate(-1)} 
                sx={{ mb: 2 }}
            >
                <ArrowBackIcon /> Back
            </IconButton>

            <Card sx={{ mb: 4 }}>
                <CardHeader 
                    title="Bulk Attendance" 
                    subheader={`${currentUser.teachSclass?.sclassName} - ${currentUser.teachSubject?.subName}`}
                    action={
                        <Chip 
                            color="primary" 
                            label={`${attendanceSummary.present}/${attendanceSummary.total} Present`}
                        />
                    }
                    titleTypographyProps={{ align: 'center', variant: 'h4' }}
                    subheaderTypographyProps={{ align: 'center' }}
                />
                <Divider />
                <CardContent>
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                label="Date"
                                type="date"
                                fullWidth
                                value={today}
                                disabled
                                InputLabelProps={{ shrink: true }}
                                helperText="Attendance can only be taken for today"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                label="Search Students"
                                fullWidth
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    endAdornment: <FilterListIcon />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={4}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button 
                                    variant="contained" 
                                    color="success"
                                    fullWidth
                                    startIcon={<CheckCircleOutlineIcon />}
                                    onClick={() => handleSetAllStatus('Present')}
                                >
                                    All Present
                                </Button>
                                <Button 
                                    variant="contained"
                                    color="error"
                                    fullWidth
                                    startIcon={<HighlightOffIcon />}
                                    onClick={() => handleSetAllStatus('Absent')}
                                >
                                    All Absent
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <form onSubmit={handleSubmit}>
                    <TableContainer component={Paper} sx={{ mb: 4, maxHeight: 440, overflow: 'auto' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Roll Number</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Attendance Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredAttendanceData.length > 0 ? (
                                    filteredAttendanceData.map((student) => (
                                        <TableRow 
                                            key={student.studentId}
                                            sx={{ 
                                                bgcolor: student.status === 'Absent' ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 255, 0, 0.05)'
                                            }}
                                        >
                                            <TableCell>{student.rollNum}</TableCell>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell>
                                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                                    <Select
                                                        value={student.status}
                                                        onChange={(e) => handleStatusChange(student.studentId, e.target.value)}
                                                    >
                                                        <MenuItem value="Present">Present</MenuItem>
                                                        <MenuItem value="Absent">Absent</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">
                                            {searchQuery ? "No matching students found" : "No students in this class"}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <PurpleButton
                            type="submit"
                            variant="contained"
                            disabled={submitting || attendanceData.length === 0}
                            sx={{ minWidth: 200 }}
                            startIcon={submitting && <CircularProgress size={20} color="inherit" />}
                        >
                            {submitting ? "Submitting..." : `Submit Attendance (${attendanceSummary.total})`}
                        </PurpleButton>
                    </Box>
                </form>
            )}

            <Snackbar 
                open={alertOpen} 
                autoHideDuration={6000} 
                onClose={() => setAlertOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setAlertOpen(false)} 
                    severity={alertSeverity}
                    sx={{ width: '100%' }}
                >
                    {alertMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BulkAttendance;
