import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconButton, CircularProgress, Typography, Box } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Editor from '../components/Editor';
import { useAuth } from '../contexts/AuthContext';
import { getPermissionsByDocumentId } from '../services/api';
import { logger } from '../logger';

const EditorPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { userId, email } = useAuth();
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        if (documentId && email) {
          // Fetch permissions for the current document
          const permissions = await getPermissionsByDocumentId(documentId);
          logger.log('Fetched permissions:', JSON.stringify(permissions, null, 2));
          
          // Find the user's permission by matching the email
          const userPermission = permissions.find((perm: any) => perm.email === email);
          logger.log('User permission:', JSON.stringify(userPermission, null, 2));
          
          if (userPermission) {
            // User has access to the document
            setHasAccess(true);
            // Set the canWrite state based on the user's permission
            setCanWrite(userPermission.canWrite || false);
            logger.log('User can write:', userPermission.canWrite);
          } else {
            // User doesn't have access to the document
            setHasAccess(false);
            logger.log('User does not have access to the document');
          }
        }
      } catch (error) {
        logger.error('Failed to fetch permissions', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [documentId, email]);

  // Redirect to login if user is not authenticated
  if (!userId || !email) {
    navigate('/login', { replace: true });
    return null;
  }

  // Show loading state while fetching permissions
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Show error if user doesn't have access
  if (!hasAccess) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h5" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1">
          You don't have permission to access this document.
        </Typography>
        <IconButton
          color="primary"
          onClick={() => navigate(-1)}
          style={{ marginTop: '20px' }}
        >
          <ArrowBackIcon /> Go Back
        </IconButton>
      </Box>
    );
  }

  return (
    <div>
      {/* Back button to navigate to the previous page */}
      <IconButton
        color="primary"
        onClick={() => navigate(-1)}
        style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000 }}
      >
        <ArrowBackIcon />
      </IconButton>
      {/* Render the Editor component with necessary props */}
      <Editor
        documentId={documentId}
        onBack={() => navigate(-1)}
        canWrite={canWrite}
        userId={userId}
        email={email}
      />
    </div>
  );
};

export default EditorPage;