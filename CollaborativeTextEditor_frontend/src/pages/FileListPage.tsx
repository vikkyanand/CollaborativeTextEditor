import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import FileList from '../components/FileList';
import { getPermissionsByDocumentId } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../logger';

// FileListPage component definition
const FileListPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId, email } = useAuth();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [canWrite, setCanWrite] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<string>('fileList');

  // Redirect to home if userId or email is missing
  useEffect(() => {
    if (!userId || !email) {
      navigate('/');
    }
  }, [userId, email, navigate]);

  // Handle selecting a document and checking permissions
  const handleSelectDocument = async (documentId: string) => {
    if (userId) {
      try {
        logger.log('Checking permissions for userId:', userId, 'and documentId:', documentId);
        const permissions = await getPermissionsByDocumentId(documentId);
        logger.log('Permissions:', permissions);
        const userPermission = permissions.find((perm: { userId: string; canWrite: boolean }) => perm.userId === userId);
        if (userPermission) {
          logger.log('User has permission:', userPermission);
          setSelectedDocumentId(documentId);
          setCanWrite(userPermission.canWrite);
          setCurrentView('create');
          navigate(`/editor/${documentId}`, { state: { userId, email, canWrite: userPermission.canWrite } });
        } else {
          alert('You do not have permission to access this document.');
        }
      } catch (error) {
        logger.error('Error fetching permissions', error);
        alert('Error checking permissions. Please try again.');
      }
    } else {
      alert('User ID not found');
    }
  };

  // Handle permission denied action
  const handlePermissionDenied = (message: string) => {
    alert(message);
  };

  // Render the component
  return (
    <div>
      <IconButton
        color="primary"
        onClick={() => navigate('/home')}
        style={{ position: 'absolute', top: '10px', left: '10px' }}
      >
        <ArrowBackIcon />
      </IconButton>
      {userId && (
        <FileList
          onSelectDocument={handleSelectDocument}
          onPermissionDenied={handlePermissionDenied}
          userId={userId}
        />
      )}
    </div>
  );
};

export default FileListPage;
