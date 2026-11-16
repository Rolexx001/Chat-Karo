import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';
import PublicRoute from '../routes/PublicRoute.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';

import LoginPage from '../features/auth/pages/LoginPage.jsx';
import SignupPage from '../features/auth/pages/SignupPage.jsx';
import ChatsPage from '../features/chats/pages/ChatsPage.jsx';
import ContactsPage from '../features/contacts/pages/ContactsPage.jsx';
import StatusPage from '../features/status/pages/StatusPage.jsx';
import CallsPage from '../features/calls/pages/CallsPage.jsx';
import SettingsPage from '../features/settings/pages/SettingsPage.jsx';

export const router = createBrowserRouter([
  // Public Routes (redirect to /chats if already logged in)
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },

  // Protected Routes (redirect to /login if unauthenticated)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/chats" replace /> },
          { path: '/chats', element: <ChatsPage /> },
          { path: '/contacts', element: <ContactsPage /> },
          { path: '/status', element: <StatusPage /> },
          { path: '/calls', element: <CallsPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },

  // Fallback Catch-All
  {
    path: '*',
    element: <Navigate to="/chats" replace />,
  },
]);

export default router;
