import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextProps {
  userId: string | null;
  email: string | null;
  setUserId: (userId: string | null) => void;
  setEmail: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(sessionStorage.getItem('userId'));
  const [email, setEmail] = useState<string | null>(sessionStorage.getItem('email'));

  useEffect(() => {
    if (userId) {
      sessionStorage.setItem('userId', userId);
    } else {
      sessionStorage.removeItem('userId');
    }
  }, [userId]);

  useEffect(() => {
    if (email) {
      sessionStorage.setItem('email', email);
    } else {
      sessionStorage.removeItem('email');
    }
  }, [email]);

  return (
    <AuthContext.Provider value={{ userId, email, setUserId, setEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
