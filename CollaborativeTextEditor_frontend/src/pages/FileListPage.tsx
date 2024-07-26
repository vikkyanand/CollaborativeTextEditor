import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileList from '../components/FileList';
import { getPermissionsByDocumentId } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../logger';

const FileListPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId, email } = useAuth();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [canWrite, setCanWrite] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<string>('fileList');

  useEffect(() => {
    if (!userId || !email) {
      navigate('/');
    }
  }, [userId, email, navigate]);

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

  const handlePermissionDenied = (message: string) => {
    alert(message);
  };

  return (
    <div>
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
