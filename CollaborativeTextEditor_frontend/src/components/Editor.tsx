import React, { useState, useEffect, useCallback } from 'react';
import CustomQuill from './CustomQuill';
import { Container, Paper, Box, Button, Modal, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, IconButton, Typography } from '@mui/material';
import { Save as SaveIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, People as PeopleIcon, Share as ShareIcon, Close as CloseIcon } from '@mui/icons-material';
import DocumentNameInput from './DocumentNameInput';
import PermissionManager from './PermissionManager';
import { saveDocument, createDocument, fetchDocumentContent, getPermissionsByDocumentId } from '../services/api';
import useDebounce from '../hooks/useDebounce';
import useWebSocket from '../hooks/useWebSocket';
import * as signalR from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom';
import { logger } from '../logger';

// Define the interface for the editor properties
interface EditorProps {
  documentId?: string | null;
  onBack: () => void;
  canWrite: boolean;
  userId: string;
  email: string;
  preview?: boolean;
}

// Editor component definition
const Editor: React.FC<EditorProps> = ({ documentId, onBack, canWrite, userId, email, preview = false }) => {
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
  const navigate = useNavigate();
  const validDocumentId = currentDocumentId || '';

  // Handle permission revoked event
  const handlePermissionRevoked = () => {
    setDialogOpen(true);
  };

  // Close the dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    navigate('/file-list');
  };

  // WebSocket URL from environment variables
  const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL;
  if (!websocketUrl) {
    throw new Error('REACT_APP_WEBSOCKET_URL is not defined in the .env file');
  }

  // WebSocket connection setup using a custom hook
  const connectionRef = useWebSocket(websocketUrl, validDocumentId, (updatedContent: string) => {
    if (updatedContent !== content) {
      setContent(updatedContent);
    }
  }, handlePermissionRevoked, setOnlineUsers);

  // Fetch document content and permissions when the component mounts or updates
  useEffect(() => {
    if (currentDocumentId) {
      (async () => {
        const response = await fetchDocumentContent(currentDocumentId);
        setContent(response.content);
        setDocumentName(response.name);
        if (!preview) {
          const perms = await getPermissionsByDocumentId(currentDocumentId);
          setPermissions(perms.map((perm: { email: string; canWrite: boolean }) => ({
            email: decodeEmail(perm.email),
            canWrite: perm.canWrite,
          })));
        }
      })();
    }
  }, [currentDocumentId, preview]);

  // Handle saving the document
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
      setNotification('Document saved successfully');
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
        setNotification('Document created and saved successfully');
        setSnackbarOpen(true);
      } else {
        logger.error('Failed to create new document');
        alert('Error creating document');
        return;
      }
    }

    // Send document update via WebSocket if connected
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      logger.log('Sending document update via WebSocket');
      connectionRef.current.invoke('SendDocumentUpdate', validDocumentId, content)
        .catch((err) => console.log('Error sending document update:', err));
    }

    setTimeout(() => setNotification(null), 3000);
  }, [canWrite, content, currentDocumentId, documentName, connectionRef, validDocumentId]);

  // Add event listener for saving document with Ctrl+S
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

  // Decode email to its original form
  const decodeEmail = (encodedEmail: string) => encodedEmail.replace(/__/g, '.');

  // Handle content change with debouncing
  const handleContentChange = useDebounce((newContent: string) => {
    console.log('Content changed:', newContent);
    if (newContent !== content) {
      setContent(newContent);
      if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
        connectionRef.current.invoke('SendDocumentUpdate', validDocumentId, newContent)
          .catch((err) => console.log('Error sending document update:', err));
      }
    }
  }, 100);

  // Leave document group when component unmounts
  useEffect(() => {
    return () => {
      if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
        connectionRef.current.invoke('LeaveDocumentGroup', validDocumentId)
          .catch((err) => console.error('Error leaving document group:', err));
      }
    };
  }, [validDocumentId]);

  // Handle sharing document link
  const handleShare = () => {
    const shareLink = `${window.location.origin}/editor/${currentDocumentId}`;
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setNotification('Sharable link is copied to clipboard');
        setSnackbarOpen(true);
      })
      .catch((err) => {
        console.error('Failed to copy share link:', err);
        alert('Failed to copy the link. Please try again.');
      });
  };

  // Handle permission change notification
  const handlePermissionChange = (email: string, canWrite: boolean) => {
    setNotification(`Permission ${canWrite ? 'write' : 'read'} granted to ${email}`);
    setSnackbarOpen(true);
  };

  // Render the component
  return (
    <Container maxWidth="lg" style={{ height: preview ? 'auto' : '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {!preview && (
        <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
          {canWrite && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              style={{ marginRight: '10px' }}
            >
              Save
            </Button>
          )}
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setShowPermissions(!showPermissions)}
            startIcon={showPermissions ? <VisibilityOffIcon /> : <VisibilityIcon />}
            style={{ marginRight: '10px' }}
          >
            {showPermissions ? 'Hide Permissions' : 'Show Permissions'}
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowOnlineUsers(!showOnlineUsers)}
            startIcon={<PeopleIcon />}
            style={{ marginRight: '10px' }}
          >
            {showOnlineUsers ? 'Hide Online Users' : 'Show Online Users'}
          </Button>
          <Button
            variant="contained"
            onClick={handleShare}
            startIcon={<ShareIcon />}
          >
            Share
          </Button>
        </Box>
      )}
      <Paper style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        {!preview && (
          <DocumentNameInput
            documentName={documentName}
            setDocumentName={setDocumentName}
            canWrite={canWrite}
          />
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '20px' }}>
          <CustomQuill
            value={content}
            onChange={handleContentChange}
            readOnly={!canWrite || preview}
          />
        </div>
      </Paper>
      <Modal open={showPermissions} onClose={() => setShowPermissions(false)}>
        <Box component="div" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, backgroundColor: 'white', padding: '20px', boxShadow: '24px' }}>
          <PermissionManager
            documentId={currentDocumentId || ''}
            canWrite={canWrite}
            userId={userId}
            onPermissionChange={handlePermissionChange}
          />
          <IconButton style={{ position: 'absolute', top: '10px', right: '10px' }} onClick={() => setShowPermissions(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Modal>
      <Modal open={showOnlineUsers} onClose={() => setShowOnlineUsers(false)}>
        <Box component="div" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, backgroundColor: 'white', padding: '20px', boxShadow: '24px' }}>
          <Typography variant="h6">Online Users</Typography>
          <ul>
            {onlineUsers.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
          <IconButton style={{ position: 'absolute', top: '10px', right: '10px' }} onClick={() => setShowOnlineUsers(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Modal>
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
      >
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
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
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
