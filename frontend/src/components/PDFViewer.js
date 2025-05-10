import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  CircularProgress,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { Close as CloseIcon, OpenInNew } from '@mui/icons-material';

/**
 * PDFViewer component for displaying PDF documents in a modal dialog
 * @param {Object} props - Component props
 * @param {boolean} props.open - Controls if the dialog is open
 * @param {function} props.onClose - Function to call when dialog is closed
 * @param {string} props.pdfUrl - URL of the PDF to display
 * @param {string} props.title - Dialog title (optional)
 */
const PDFViewer = ({ open, onClose, pdfUrl, title = "Document Viewer" }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Reset states when the URL changes
    if (pdfUrl) {
      setLoading(true);
      setError(null);
      // Log the URL to help with debugging
      console.log(`Loading PDF from: ${pdfUrl}`);
    }
  }, [pdfUrl]);

  const handleClose = () => {
    onClose();
    // Reset states when dialog is closed
    setLoading(true);
    setError(null);
    setRetryCount(0);
  };

  // Function to handle retry
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { height: "80vh" },
      }}
    >
      <DialogTitle>
        {title}
        <IconButton
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Box sx={{ color: "error.main", textAlign: "center", my: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6">Error loading PDF</Typography>
              <Typography variant="body1">{error}</Typography>
            </Alert>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, mr: 1 }}
              onClick={handleRetry}
            >
              Retry
            </Button>
            <Button
              variant="outlined"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => window.open(pdfUrl, "_blank")}
              startIcon={<OpenInNew />}
            >
              Open in New Tab
            </Button>
          </Box>
        )}
        <Box sx={{ height: "100%", display: loading ? "none" : "block" }}>
          {pdfUrl && (
            <iframe
              src={`${pdfUrl}?v=${retryCount}`}
              style={{ width: "100%", height: "100%", border: "none" }}
              onLoad={() => setLoading(false)}
              onError={(e) => {
                console.error("PDF iframe error:", e);
                setLoading(false);
                setError("Failed to load the PDF document. The file might not exist or there might be a server error.");
              }}
              title="PDF Viewer"
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;
