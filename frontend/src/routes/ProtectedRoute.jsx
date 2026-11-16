import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore.js';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return null;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
