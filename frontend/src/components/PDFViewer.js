import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

/**
 * PDFViewer component for displaying PDF documents in a modal dialog
 * @param {Object} props - Component props
 * @param {boolean} props.open - Controls if the dialog is open
 * @param {function} props.handleClose - Function to call when dialog is closed
 * @param {string} props.pdfUrl - URL of the PDF to display
 * @param {string} props.title - Dialog title (optional)
 */
const PDFViewer = ({ open, handleClose, pdfUrl, title }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Log for debugging
    console.log('PDFViewer state:', { open, pdfUrl });
  }, [open, pdfUrl]);

  const handleDialogClose = () => {
    console.log('PDF Dialog closing');
    setLoading(true);
    setError(null);
    handleClose();
  };

  const handleIframeLoad = () => {
    console.log('PDF iframe loaded successfully');
    setLoading(false);
  };

  const handleIframeError = () => {
    console.error('Failed to load PDF in iframe');
    setError('Failed to load the PDF document.');
    setLoading(false);
  };

  const openInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const downloadPdf = () => {
    // Create a temporary anchor element to download the file
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'document.pdf'; // Default name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
        }}
      >
        <Typography variant="h6">
          {title || 'View Document'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<OpenInNewIcon />}
            onClick={openInNewTab}
            size="small"
          >
            Open
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={downloadPdf}
            size="small"
          >
            Download
          </Button>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleDialogClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ flexGrow: 1, p: 0, position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              bgcolor: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }}
          >
            {error}
            <Button sx={{ ml: 2 }} variant="outlined" size="small" onClick={openInNewTab}>
              Try Open in New Tab
            </Button>
          </Alert>
        )}
        
        <iframe
          src={pdfUrl}
          title="PDF Document"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;
