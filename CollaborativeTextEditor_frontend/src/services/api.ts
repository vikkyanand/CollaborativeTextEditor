import axios from 'axios';
import { logger } from '../logger';

const API_URL = process.env.REACT_APP_API_URL;

// Create a new document by sending a POST request to the backend
export const createDocument = async (name: string) => {
  try {
    logger.log('Creating document:', name);
    const response = await axios.post(`${API_URL}/documents/CreateDocument`, { name });
    return response.data;
  } catch (error) {
    logger.error('Error creating document:', error);
    return null;
  }
};

// Save the document content and title by sending a PUT request to the backend
export const saveDocument = async (id: string, content: string, name: string) => {
  try {
    logger.log('Saving document:', id);
    await axios.put(`${API_URL}/documents/UpdateDocumentContent?id=${id}`, { content, name });
  } catch (error) {
    logger.error('Error saving document:', error);
  }
};

// Fetch all documents by sending a GET request to the backend with pagination and search
export const getDocuments = async (search = '') => {
  try {
    logger.log('Fetching documents:', { search });
    const response = await axios.get(`${API_URL}/documents/GetDocuments`, {
      params: { search }
    });
    return response.data;
  } catch (error) {
    logger.error('Error fetching documents:', error);
    return [];
  }
};

// Fetch the content of a specific document by sending a GET request to the backend
export const fetchDocumentContent = async (id: string) => {
  try {
    logger.log('Fetching document content:', id);
    const response = await axios.get(`${API_URL}/documents/GetDocumentContent?id=${id}`);
    return response.data;
  } catch (error) {
    logger.error('Error fetching document content:', error);
  }
};
// Delete a document by sending a DELETE request to the backend
export const deleteDocument = async (id: string) => {
  try {
    logger.log('Deleting document:', id);
    await axios.delete(`${API_URL}/documents/DeleteDocument?id=${id}`);
  } catch (error) {
    logger.error('Error deleting document:', error);
    throw error;
  }
};
// Fetch permissions for a specific document by sending a GET request to the backend
export const getPermissionsByDocumentId = async (documentId: string) => {
  try {
    logger.log('Fetching permissions for document:', documentId);
    const response = await axios.get(`${API_URL}/permissions/GetPermissionsByDocumentId?documentId=${documentId}`);
    return response.data;
  } catch (error) {
    logger.error('Error fetching permissions:', error);
    return [];
  }
};

// Grant permission to a user by sending a POST request to the backend
export const grantPermission = async (documentId: string, email: string, canWrite: boolean) => {
  try {
    logger.log('Granting permission:', { documentId, email, canWrite });
    const response = await axios.post(`${API_URL}/permissions/GrantPermission?documentId=${documentId}`, {
      email,
      canWrite,
    });
    return response.data;
  } catch (error) {
    logger.error('Error granting permission:', error);
    throw error;
  }
};

// Revoke permission from a user by sending a DELETE request to the backend
export const revokePermission = async (documentId: string, email: string) => {
  try {
    logger.log('Revoking permission:', { documentId, email });
    await axios.delete(`${API_URL}/permissions/RevokePermission?documentId=${documentId}`, {
      data: { email }
    });
  } catch (error) {
    logger.error('Error revoking permission:', error);
    throw error;
  }
};

// Check if user exists and create if not
export const checkOrCreateUser = async (email: string, name = '') => {
  try {
    logger.log('Checking or creating user:', { email, name });
    const response = await axios.post(`${API_URL}/users/CheckOrCreateUser`, { email, name });
    return response.data;
  } catch (error) {
    logger.error('Error checking or creating user:', error);
    throw error;
  }
};

// Fetch documents with user permissions by sending a GET request to the backend
export const getDocumentsWithUserPermission = async (userId: string, skip = 0, limit = 10, search = '') => {
  try {
    logger.log('Fetching documents with user permission:', { userId, skip, limit, search });
    const response = await axios.get(`${API_URL}/documents/GetDocumentsWithUserPermission`, {
      params: {
        userId,
        skip,
        take: limit,
        search
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Error fetching documents with user permission:', error);
    return [];
  }
};