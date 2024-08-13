import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Typography, Grid, Paper } from '@mui/material';
import { checkOrCreateUser } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../logger';

const LoginPage: React.FC = () => {
 // State for email and name inputs
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
   // State for email validation error
  const [emailError, setEmailError] = useState<string | null>(null);
   // State to control whether to show the name input
  const [showNameInput, setShowNameInput] = useState(false);
  const navigate = useNavigate();
  // Get setUserId and setEmail functions from AuthContext
  const { setUserId, setEmail: setAuthEmail } = useAuth(); // use a different name for setEmail from useAuth to avoid conflicts

   // Function to validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Function to handle email submission
  const handleEmailSubmit = async () => {
    if (!validateEmail(email) || email.length > 50) {
      setEmailError('Invalid email format or length exceeds 50 characters');
      return;
    }
    setEmailError(null);
    try {
      // Check if user exists
      const user = await checkOrCreateUser(email);
      if (user && user.name) {
        // If user exists, set user information and navigate to home page
        setUserId(user.id);
        setAuthEmail(email); // set the email in AuthContext
        navigate('/home');
      } else {
        // If user doesn't exist, show name input for registration
        setShowNameInput(true);
      }
    } catch (error) {
      logger.error('Error checking user', error);
      setEmailError('Error checking user. Please try again.');
      setShowNameInput(true);
    }
  };

  // Function to handle name submission (for new user registration)
  const handleNameSubmit = async () => {
    if (name.length > 50) {
      setEmailError('Name length exceeds 50 characters');
      return;
    }
    try {
      // Create new user
      const newUser = await checkOrCreateUser(email, name);
      if (newUser) {
         // Set user information and navigate to home page
        setUserId(newUser.id);
        setAuthEmail(email); 
        navigate('/home');
      } else {
        throw new Error('Failed to create new user');
      }
    } catch (error) {
      logger.error('Error creating user', error);
      setEmailError('Error creating user. Please try again.');
    }
  };

  // Handle key press for 'Enter'
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (showNameInput) {
        handleNameSubmit();
      } else {
        handleEmailSubmit();
      }
    }
  };
  return (
    <Container>
      <Grid container spacing={3} alignItems="center" justifyContent="center" style={{ minHeight: '100vh' }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={3} style={{ padding: '20px' }}>
            {!showNameInput ? (
              <>
                <Typography variant="h5" gutterBottom>Enter your email</Typography>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}  
                  error={!!emailError}
                  helperText={emailError}
                  margin="normal"
                />
                <Button variant="contained" color="primary" fullWidth onClick={handleEmailSubmit}>
                  Proceed
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h5" gutterBottom>Enter your name</Typography>
                <TextField
                  fullWidth
                  type="text"
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}  
                  margin="normal"
                />
                <Button variant="contained" color="primary" fullWidth onClick={handleNameSubmit}>
                  Create Account
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LoginPage;
