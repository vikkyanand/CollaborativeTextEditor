import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getDocumentsWithUserPermission,
  deleteDocument,
  getPermissionsByDocumentId,
} from '../services/api';
import {
  Container,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Divider,
  Box,
  TextField,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Snackbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import debounce from 'lodash/debounce';
import Editor from './Editor';
import { logger } from '../logger';

interface FileListProps {
  onSelectDocument: (id: string) => void;
  onPermissionDenied: (message: string) => void;
  userId: string;
}

interface Document {
  id: string;
  name: string;
  dateCreated: string;
  lastEditedDate: string;
}

const FileList: React.FC<FileListProps> = ({ onSelectDocument, onPermissionDenied, userId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const loadDocuments = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const newSkip = reset ? 0 : skip;
        logger.log('Loading documents:', { skip: newSkip, take: 10, search });

        const docs = await getDocumentsWithUserPermission(userId, newSkip, 10, search);
        setDocuments((prevDocs) => (reset ? docs : [...prevDocs, ...docs]));
        setSkip(newSkip + 10);
        setHasMore(docs.length === 10);

        if (containerRef.current && containerRef.current.clientHeight > containerRef.current.scrollHeight) {
          loadDocuments();
        }
      } catch (error) {
        logger.error('Error fetching documents:', error);
        setSnackbarMessage('Failed to load documents. Please try again.');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    },
    [skip, search, loading, userId]
  );

  const handleScroll = useMemo(
    () =>
      debounce(() => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        logger.log('Scroll event triggered:', { scrollTop, scrollHeight, clientHeight });
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
          loadDocuments();
        }
      }, 100),
    [loadDocuments, loading, hasMore]
  );

  useEffect(() => {
    loadDocuments(true);
  }, [search]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      handleScroll.cancel();
    };
  }, [handleScroll]);

  const handleSearchChange = useMemo(
    () =>
      debounce((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setSkip(0);
        setHasMore(true);
        setDocuments([]);
      }, 300),
    []
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, docId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocId(docId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDocumentClick = async (docId: string) => {
    try {
      const permissions = await getPermissionsByDocumentId(docId);
      const userPermission = permissions.find((perm: { userId: string; canWrite: boolean }) => perm.userId === userId);

      if (userPermission) {
        onSelectDocument(docId);
      } else {
        setSnackbarMessage("You don't have permission to open this document.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      logger.error('Error checking document permissions:', error);
      setSnackbarMessage('Failed to check document permissions. Please try again.');
      setSnackbarOpen(true);
    }
  };

  const handleViewDocument = async () => {
    if (!selectedDocId) {
      setSnackbarMessage('No document selected for viewing');
      setSnackbarOpen(true);
      handleMenuClose();
      return;
    }

    try {
      const permissions = await getPermissionsByDocumentId(selectedDocId);
      const userPermission = permissions.find((perm: { userId: string; canWrite: boolean }) => perm.userId === userId);

      if (userPermission) {
        setPreviewDocId(selectedDocId);
        setPreviewOpen(true);
      } else {
        setSnackbarMessage("You don't have permission to view this document.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      logger.error('Error checking document permissions:', error);
      setSnackbarMessage('Failed to check document permissions. Please try again.');
      setSnackbarOpen(true);
    }
    handleMenuClose();
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewDocId(null);
  };

  const handleOpenDeleteDialog = async () => {
    if (!selectedDocId) {
      setSnackbarMessage('No document selected for deletion');
      setSnackbarOpen(true);
      return;
    }

    try {
      const permissions = await getPermissionsByDocumentId(selectedDocId);
      const userPermission = permissions.find((perm: { userId: string; canWrite: boolean }) => perm.userId === userId);

      if (userPermission && userPermission.canWrite) {
        setDeleteDialogOpen(true);
      } else {
        setSnackbarMessage("You don't have permission to delete this document.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      logger.error('Error checking document permissions:', error);
      setSnackbarMessage('Failed to check document permissions. Please try again.');
      setSnackbarOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocId || isDeleting) return;

    setIsDeleting(true);
    try {
      logger.log('Deleting document:', selectedDocId);
      await deleteDocument(selectedDocId);
      setDocuments((prevDocuments) => prevDocuments.filter((doc) => doc.id !== selectedDocId));
      setDeleteDialogOpen(false);
      setSnackbarMessage('Document successfully deleted');
      setSnackbarOpen(true);
    } catch (error) {
      logger.error('Error deleting document:', error);
      setSnackbarMessage('Failed to delete document. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsDeleting(false);
      setSelectedDocId(null);
    }
  };

  return (
    <Container ref={containerRef} style={{ height: '100vh', overflow: 'auto', padding: isSmallScreen ? '0 16px' : '0 24px' }}>
      <Paper elevation={3} style={{ padding: '20px' }}>
        <Typography variant="h5" gutterBottom>
          Select a document to edit
        </Typography>
        <TextField
          fullWidth
          label="Search Documents"
          onChange={handleSearchChange}
          placeholder="Search by document name"
          margin="normal"
        />
        <List>
          {documents.map((doc) => (
            <Box key={doc.id}>
              <ListItem button onClick={() => handleDocumentClick(doc.id)}>
                <ListItemText
                  primary={
                    <Typography variant="h6" style={{ fontWeight: 'bold' }}>
                      {doc.name}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Created: {new Date(doc.dateCreated).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Last Edited: {new Date(doc.lastEditedDate).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();
                    handleMenuClick(event, doc.id);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </ListItem>
              <Divider component="li" />
            </Box>
          ))}
        </List>
        {loading && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        )}
        {!hasMore && <Typography align="center" my={2}>No more documents to load</Typography>}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleViewDocument}>View</MenuItem>
          <MenuItem onClick={handleOpenDeleteDialog}>Delete</MenuItem>
        </Menu>
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{'Confirm Delete'}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
              No
            </Button>
            <Button onClick={handleDeleteDocument} color="primary" autoFocus disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Yes'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>
          <DialogTitle>Document Preview</DialogTitle>
          <DialogContent>
            {previewDocId && (
              <Editor
                documentId={previewDocId}
                onBack={handleClosePreview}
                canWrite={false}
                userId={userId}
                email=""
                preview={true}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePreview}>Close</Button>
            <Button
              onClick={() => {
                handleClosePreview();
                if (previewDocId) onSelectDocument(previewDocId);
              }}
              color="primary"
            >
              Open in Editor
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
      </Paper>
    </Container>
  );
};

export default FileList;
