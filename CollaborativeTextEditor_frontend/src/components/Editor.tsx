import React, { useState, useEffect, useCallback, useRef } from 'react';
import CustomQuill from './CustomQuill';
import {
  Container,
  Paper,
  Box,
  Button,
  Modal,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Grid,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  People as PeopleIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import DocumentNameInput from './DocumentNameInput';
import PermissionManager from './PermissionManager';
import {
  saveDocument,
  createDocument,
  fetchDocumentContent,
  getPermissionsByDocumentId,
} from '../services/api';
import useDebounce from '../hooks/useDebounce';
import useWebSocket from '../hooks/useWebSocket';
import * as signalR from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom';
import { logger } from '../logger';
import { Document, Packer, Paragraph } from 'docx';
import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';

interface EditorProps {
  documentId?: string | null;
  onBack: () => void;
  canWrite: boolean;
  userId: string;
  email: string;
  preview?: boolean;
}

const Editor: React.FC<EditorProps> = ({
  documentId,
  onBack,
  canWrite,
  userId,
  email,
  preview = false,
}) => {
  const [content, setContent] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [permissions, setPermissions] = useState<{ email: string; canWrite: boolean }[]>([]);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null | undefined>(documentId);
  const [showPermissions, setShowPermissions] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cursorPositions, setCursorPositions] = useState<{ email: string; index: number; length: number }[]>([]);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(null);
  const [uploadAnchorEl, setUploadAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const validDocumentId = currentDocumentId || '';
  const quillRef = useRef<any>(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const handlePermissionRevoked = () => {
    setDialogOpen(true);
  };

  const handleDocumentDeleted = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    navigate('/file-list');
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    navigate('/file-list');
  };

  const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL;
  if (!websocketUrl) {
    throw new Error('REACT_APP_WEBSOCKET_URL is not defined in the .env file');
  }

  const connectionRef = useWebSocket(
    websocketUrl,
    validDocumentId,
    (updatedContent: string) => {
      setContent(updatedContent);
    },
    handlePermissionRevoked,
    handleDocumentDeleted,
    (users: string[]) => setOnlineUsers(users),
    (email: string, index: number, length: number) => {
      setCursorPositions((prev) => {
        const newPositions = prev.filter((p) => p.email !== email);
        return [...newPositions, { email, index, length }];
      });
    }
  );

  useEffect(() => {
    if (currentDocumentId) {
      (async () => {
        const response = await fetchDocumentContent(currentDocumentId);
        setContent(response.content);
        setDocumentName(response.name);
        if (!preview) {
          const perms = await getPermissionsByDocumentId(currentDocumentId);
          setPermissions(
            perms.map((perm: { email: string; canWrite: boolean }) => ({
              email: decodeEmail(perm.email),
              canWrite: perm.canWrite,
            }))
          );
        }
      })();
    }
  }, [currentDocumentId, preview]);

  const handleSave = useCallback(async () => {
    if (!canWrite) {
      logger.warn('User does not have permission to edit this document.');
      alert('You do not have permission to edit this document.');
      return;
    }
    let docId = currentDocumentId;
    if (docId) {
      logger.log('Saving existing document:', docId);
      await saveDocument(docId, content, documentName);
      setNotification('Document saved successfully.');
      setSnackbarOpen(true);
    } else {
      if (documentName.trim() === '') {
        logger.warn('Attempted to save document with empty name');
        alert('Please enter a document name.');
        return;
      }

      logger.log('Creating new document:', documentName);
      const newDocument = await createDocument(documentName);
      if (newDocument && newDocument.id) {
        docId = newDocument.id;
        setCurrentDocumentId(docId);
        if (docId) await saveDocument(docId, content, documentName);
        setNotification('Document created and saved successfully.');
        setSnackbarOpen(true);
      } else {
        logger.error('Failed to create new document');
        alert('Error creating document');
        return;
      }
    }

    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      logger.log('Sending document update via WebSocket');
      connectionRef.current
        .invoke('SendDocumentUpdate', validDocumentId, content)
        .catch((err) => console.log('Error sending document update:', err));
    }
  }, [canWrite, content, currentDocumentId, documentName, connectionRef, validDocumentId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  const decodeEmail = (encodedEmail: string) => encodedEmail.replace(/__/g, '.');

  const handleContentChange = useDebounce((newContent: string) => {
    console.log('Content changed:', newContent);
    setContent(newContent);
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      connectionRef.current
        .invoke('SendDocumentUpdate', validDocumentId, newContent)
        .catch((err) => console.log('Error sending document update:', err));
    }
  }, 100);

  const handleCursorPositionChange = useDebounce((range: { index: number; length: number } | null) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      if (range) {
        connectionRef.current
          .invoke('UpdateCursorPosition', validDocumentId, range.index, range.length)
          .catch((err) => console.log('Error sending cursor position:', err));
      } else {
        connectionRef.current
          .invoke('HideCursor', validDocumentId)
          .catch((err) => console.log('Error hiding cursor:', err));
      }
    }
  }, 100);

  useEffect(() => {
    return () => {
      if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
        connectionRef.current
          .invoke('LeaveDocumentGroup', validDocumentId)
          .catch((err) => console.error('Error leaving document group:', err));
      }
    };
  }, [validDocumentId]);

  const handleShare = () => {
    const shareLink = `${window.location.origin}/editor/${currentDocumentId}`;
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setNotification('Sharable link is copied to clipboard.');
        setSnackbarOpen(true);
      })
      .catch((err) => {
        console.error('Failed to copy share link:', err);
        alert('Failed to copy the link. Please try again.');
      });
  };

  const handlePermissionChange = (email: string, canWrite: boolean, action: 'granted' | 'revoked') => {
    const actionText = action === 'granted' ? 'granted to' : 'revoked from';
    const permissionType = canWrite ? 'Write' : 'Read';
    setNotification(`${permissionType} permission ${actionText} ${email}`);
    setSnackbarOpen(true);
  };

  const handleDownloadMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleUploadMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUploadAnchorEl(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleUploadMenuClose = () => {
    setUploadAnchorEl(null);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentName || 'document'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification('Document downloaded successfully.');
    setSnackbarOpen(true);
  };

  const handleDownloadDoc = async () => {
    const doc = new Document({
      sections: [
        {
          children: [new Paragraph(content)],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentName || 'document'}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification('Document downloaded successfully.');
    setSnackbarOpen(true);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.text(content, 10, 10);
    doc.save(`${documentName || 'document'}.pdf`);
    setNotification('Document downloaded successfully.');
    setSnackbarOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileType = file.name.split('.').pop();
        if (fileType === 'txt') {
          setContent(reader.result as string);
          setNotification('TXT Document uploaded successfully.');
        } else if (fileType === 'doc' || fileType === 'docx') {
          const arrayBuffer = reader.result as ArrayBuffer;
          const { value: text } = await mammoth.extractRawText({ arrayBuffer });
          setContent(text);
          setNotification('DOC Document uploaded successfully.');
        } else {
          setNotification('Unsupported file format.');
        }
        setSnackbarOpen(true);
      };
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    }
  };

  return (
    <Container
      maxWidth="lg"
      style={{
        height: preview ? 'auto' : '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: '0 24px',
      }}
    >
      {!preview && (
        <Box mt={7} mb={2}>
          <Grid container spacing={1} justifyContent="flex-end">
            {canWrite && (
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  fullWidth
                  style={{ minWidth: '120px' }}
                >
                  Save
                </Button>
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowPermissions(!showPermissions)}
                startIcon={showPermissions ? <VisibilityOffIcon /> : <VisibilityIcon />}
                fullWidth
                style={{ minWidth: '120px' }}
              >
                {showPermissions ? 'Hide Permissions' : 'Show Permissions'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                startIcon={<PeopleIcon />}
                fullWidth
                style={{ minWidth: '120px' }}
              >
                {showOnlineUsers ? 'Hide Online Users' : 'Show Online Users'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                onClick={handleShare}
                startIcon={<ShareIcon />}
                fullWidth
                style={{ minWidth: '120px' }}
              >
                Share
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                onClick={handleDownloadMenuOpen}
                startIcon={<FileDownloadIcon />}
                fullWidth
                style={{ minWidth: '120px' }}
              >
                Download
              </Button>
              <Menu
                anchorEl={downloadAnchorEl}
                open={Boolean(downloadAnchorEl)}
                onClose={handleDownloadMenuClose}
              >
<MenuItem onClick={() => { handleDownloadTxt(); handleDownloadMenuClose(); }}>
                  <FileDownloadIcon /> Download as TXT
                </MenuItem>
                <MenuItem onClick={() => { handleDownloadDoc(); handleDownloadMenuClose(); }}>
                  <FileDownloadIcon /> Download as DOC
                </MenuItem>
                <MenuItem onClick={() => { handleDownloadPdf(); handleDownloadMenuClose(); }}>
                  <FileDownloadIcon /> Download as PDF
                </MenuItem>
              </Menu>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                onClick={handleUploadMenuOpen}
                startIcon={<FileUploadIcon />}
                fullWidth
                style={{ minWidth: '120px' }}
              >
                Upload
              </Button>
              <Menu
                anchorEl={uploadAnchorEl}
                open={Boolean(uploadAnchorEl)}
                onClose={handleUploadMenuClose}
              >
                <MenuItem>
                  <input
                    type="file"
                    accept=".txt"
                    style={{ display: 'none' }}
                    id="txt-upload"
                    onChange={(e) => { handleFileUpload(e); handleUploadMenuClose(); }}
                  />
                  <label htmlFor="txt-upload">
                    <FileUploadIcon /> Upload TXT
                  </label>
                </MenuItem>
                <MenuItem>
                  <input
                    type="file"
                    accept=".doc,.docx"
                    style={{ display: 'none' }}
                    id="doc-upload"
                    onChange={(e) => { handleFileUpload(e); handleUploadMenuClose(); }}
                  />
                  <label htmlFor="doc-upload">
                    <FileUploadIcon /> Upload DOC/DOCX
                  </label>
                </MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </Box>
      )}
      <Paper
        style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!preview && (
          <DocumentNameInput
            documentName={documentName}
            setDocumentName={setDocumentName}
            canWrite={canWrite}
          />
        )}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '20px',
            position: 'relative',
          }}
        >
          <CustomQuill
            ref={quillRef}
            value={content}
            onChange={handleContentChange}
            readOnly={!canWrite || preview}
            onCursorPositionChange={handleCursorPositionChange}
            cursorPositions={cursorPositions}
            isEditorFocused={isEditorFocused}
            setIsEditorFocused={setIsEditorFocused}
          />
        </div>
      </Paper>
      <Modal open={showPermissions} onClose={() => setShowPermissions(false)}>
        <Box
          component="div"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            backgroundColor: 'white',
            padding: '20px',
            boxShadow: '24px',
          }}
        >
          <PermissionManager
            documentId={currentDocumentId || ''}
            canWrite={canWrite}
            userId={userId}
            onPermissionChange={handlePermissionChange}
          />
          <IconButton
            style={{ position: 'absolute', top: '10px', right: '10px' }}
            onClick={() => setShowPermissions(false)}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Modal>
      <Modal open={showOnlineUsers} onClose={() => setShowOnlineUsers(false)}>
        <Box
          component="div"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            backgroundColor: 'white',
            padding: '20px',
            boxShadow: '24px',
          }}
        >
          <Typography variant="h6">Online Users</Typography>
          <ul>
            {onlineUsers.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
          <IconButton
            style={{ position: 'absolute', top: '10px', right: '10px' }}
            onClick={() => setShowOnlineUsers(false)}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Modal>
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Permission Revoked</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your permission to access this document has been revoked.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Document Deleted</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This document has been deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        message={notification}
        ContentProps={{
          style: {
            backgroundColor: 'white',
            color: 'black',
          },
        }}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={() => setSnackbarOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Container>
  );
};

export default Editor;