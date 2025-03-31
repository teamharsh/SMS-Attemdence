import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  CircularProgress,
  Typography,
  Button,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

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

  const handleClose = () => {
    onClose();
    // Reset states when dialog is closed
    setLoading(true);
    setError(null);
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
            <Typography variant="h6">Error loading PDF</Typography>
            <Typography variant="body1">{error}</Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => window.open(pdfUrl, "_blank")}
            >
              Open in New Tab
            </Button>
          </Box>
        )}
        <Box sx={{ height: "100%", display: loading ? "none" : "block" }}>
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError("Failed to load the PDF document.");
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
