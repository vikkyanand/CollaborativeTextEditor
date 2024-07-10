import React from 'react';
import { TextField } from '@mui/material';

interface DocumentNameInputProps {
  documentName: string;
  setDocumentName: (name: string) => void;
  canWrite: boolean;
}

// DocumentNameInput component
const DocumentNameInput: React.FC<DocumentNameInputProps> = ({ documentName, setDocumentName, canWrite }) => {
  return (
    <TextField
      fullWidth
      label="Document Name"
      value={documentName}
      onChange={(e) => {
        if (e.target.value.length <= 100) {
          setDocumentName(e.target.value);
        }
      }}
      placeholder="Enter document name"
      margin="normal"
      disabled={!canWrite} 
    />
  );
};

export default DocumentNameInput;
