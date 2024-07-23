import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../logger';

const useWebSocket = (
  url: string,
  documentId: string,
  onUpdate: (content: string) => void,
  onPermissionRevoked: () => void,
  onDocumentDeleted: () => void,
  onOnlineUsersUpdate: (users: string[]) => void,
  onCursorPositionUpdate: (email: string, index: number, length: number) => void
) => {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { email } = useAuth();

  const cleanupPreviousConnection = async () => {
    if (connectionRef.current) {
      logger.log('Cleaning up previous connection for document ID:', documentId);
      setIsCleaningUp(true);
      try {
        if (connectionRef.current.state === signalR.HubConnectionState.Connected) {
          await connectionRef.current.invoke('LeaveDocumentGroup', documentId);
        }
        await connectionRef.current.stop();
        logger.log('Previous connection stopped for document ID:', documentId);
      } catch (err) {
        logger.error('Error stopping previous connection:', err);
      } finally {
        connectionRef.current = null;
        setIsCleaningUp(false);
      }
    }
  };

  const startConnection = async () => {
    if (isCleaningUp) {
      logger.log('Currently cleaning up, skipping start.');
      return;
    }

    try {
      if (connectionRef.current && connectionRef.current.state !== signalR.HubConnectionState.Disconnected) {
        logger.log('Connection state is not disconnected. Skipping start.');
        return;
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(url, { skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets })
        .build();

      connectionRef.current = connection;

      connection.on('ReceiveDocumentUpdate', (updatedContent: string) => {
        logger.log('Received document update:', updatedContent);
        onUpdate(updatedContent);
      });

      connection.on('ReceivePermissionRevoked', (revokedEmail: string) => {
        logger.log('Received permission revoked for email:', revokedEmail);
        if (revokedEmail === email) {
          onPermissionRevoked();
        }
      });

      connection.on('ReceiveDocumentDeleted', (deletedDocumentId: string) => {
        logger.log('Received document deleted for document ID:', deletedDocumentId);
        if (deletedDocumentId === documentId) {
          onDocumentDeleted();
        }
      });

      connection.on('UpdateOnlineUsers', (users: string[]) => {
        onOnlineUsersUpdate(users);
      });

      connection.on('ReceiveCursorPositionUpdate', (userEmail: string, index: number, length: number) => {
        onCursorPositionUpdate(userEmail, index, length);
      });

      connection.onclose(async () => {
        logger.log('WebSocket connection closed.');
        await cleanupPreviousConnection();
      });

      await connection.start();
      logger.log('WebSocket connected to', url);
      await connection.invoke('JoinDocumentGroup', documentId, email);
    } catch (err) {
      logger.error('Error connecting to WebSocket:', err);
    }
  };

  useEffect(() => {
    if (!documentId) return;

    cleanupPreviousConnection().then(startConnection);

    return () => {
      cleanupPreviousConnection();
    };
  }, [url, documentId, email]);

  return connectionRef;
};

export default useWebSocket;