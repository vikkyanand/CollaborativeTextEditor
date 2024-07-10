import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Typography, Grid, Paper, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { createDocument, grantPermission } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../logger';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  // Get user information from AuthContext
  const { userId, email } = useAuth();
  // Redirect unauthenticated users to the login page

  if (!userId || !email) {
    navigate('/');
    return null;
  }
  // Function to handle creating a new document

const handleCreateNewDocument = async () => {
  try {
      // Create a new document
    const newDocument = await createDocument('New Document');
    if (newDocument && newDocument.id) {
      logger.log('New Document ID:', newDocument.id);
        // Grant write permission to the current user
      // Use userId as the identifier for granting permissions
      await grantPermission(newDocument.id, email, true);
      logger.log('Write permission granted successfully');
       // Navigate to the editor page for the new document
      navigate(`/editor/${newDocument.id}`, { state: { userId, email, canWrite: true } });
    } else {
      alert('Error creating document');
    }
  } catch (error) {
    logger.error('Error in handleCreateNewDocument:', error);
    alert('Failed to create document. Please try again.');
  }
};

  return (
    <Container>
        {/* Back button to navigate to the login page */}
      <IconButton
        color="primary"
        onClick={() => navigate('/')}
        style={{ position: 'absolute', top: '10px', left: '10px' }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Grid container spacing={3} alignItems="center" justifyContent="center" style={{ minHeight: '100vh' }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={3} style={{ padding: '20px' }}>
            <Typography variant="h5" gutterBottom>What would you like to do?</Typography>
            {/* Button to create a new document */}
            <Button variant="contained" color="primary" fullWidth onClick={handleCreateNewDocument} style={{ marginBottom: '10px' }}>
              Create New Document
            </Button>
            <Button variant="contained" color="secondary" fullWidth onClick={() => navigate('/file-list')}>
              Edit Existing Document
            </Button>
                  {/* Button to navigate to the file list page */}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;
