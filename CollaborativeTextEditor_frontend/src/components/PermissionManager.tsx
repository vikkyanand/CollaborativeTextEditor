import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Button, Typography, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { grantPermission, revokePermission, getPermissionsByDocumentId } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Adjust this import based on your actual auth context path
import { logger } from '../logger';

interface PermissionManagerProps {
  documentId: string;
  canWrite: boolean;
  userId: string;
}

interface Permission {
  email: string;
  canWrite: boolean;
}

// PermissionManager component
const PermissionManager: React.FC<PermissionManagerProps> = ({ documentId, canWrite, userId }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, email: '' });
  const navigate = useNavigate();
  const { email: currentUserEmail } = useAuth(); // Get the current user's email from your auth context

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    try {
      const response = await getPermissionsByDocumentId(documentId);
      setPermissions(response);
    } catch (error) {
      logger.error('Error fetching permissions:', error);
    }
  }, [documentId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Grant permission
  const handleGrantPermission = async () => {
    if (!email) return;
    const canWritePermission = permission === 'write';
    try {
      await grantPermission(documentId, email, canWritePermission);
      await fetchPermissions();
      setEmail('');
    } catch (error) {
      logger.error('Error granting permission', error);
    }
  };

  // Revoke permission
  const handleRevokePermission = async (email: string) => {
    try {
      await revokePermission(documentId, email);
      await fetchPermissions();
      setConfirmDialog({ open: false, email: '' });
      
      // If the current user's permission was revoked, navigate back
      if (email === currentUserEmail) {
        alert('Your permission has been revoked.');
        navigate(-1);
      }
    } catch (error) {
      logger.error('Error revoking permission', error);
    }
  };

  // Open confirmation dialog
  const openConfirmDialog = (email: string) => {
    setConfirmDialog({ open: true, email });
  };

  // Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, email: '' });
  };

  return (
    <Box>
      <Typography variant="h6">Manage Permissions</Typography>
      {permissions.map((perm, index) => (
        <Box key={index} display="flex" alignItems="center" justifyContent="space-between" mt={1}>
          <Typography>
            {perm.email} - {perm.canWrite ? 'Write' : 'Read'}
          </Typography>
          {canWrite && perm.email !== currentUserEmail && (
            <Button variant="contained" color="secondary" onClick={() => openConfirmDialog(perm.email)}>
              Revoke
            </Button>
          )}
        </Box>
      ))}
      {canWrite && (
        <Box mt={2}>
          <TextField
            label="User Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            select
            label="Permission"
            value={permission}
            onChange={(e) => setPermission(e.target.value as 'read' | 'write')}
            SelectProps={{ native: true }}
            fullWidth
            margin="normal"
          >
            <option value="read">Read</option>
            <option value="write">Write</option>
          </TextField>
          <Button variant="contained" color="primary" onClick={handleGrantPermission} fullWidth>
            Grant Permission
          </Button>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Revoke Permission"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to revoke permission for {confirmDialog.email}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={() => handleRevokePermission(confirmDialog.email)} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermissionManager;