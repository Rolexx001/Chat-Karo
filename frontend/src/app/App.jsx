import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router.jsx';
import AuthProvider from './providers/AuthProvider.jsx';
import SocketProvider from './providers/SocketProvider.jsx';

export const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
