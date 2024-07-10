import React from 'react';
import { Navigate, RouteProps, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute: React.FC<RouteProps> = () => {
  const { userId } = useAuth();

  return userId ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;
