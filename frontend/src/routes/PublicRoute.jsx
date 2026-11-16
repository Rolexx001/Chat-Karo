import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore.js';

export const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;

  return !isAuthenticated ? <Outlet /> : <Navigate to="/chats" replace />;
};

export default PublicRoute;
