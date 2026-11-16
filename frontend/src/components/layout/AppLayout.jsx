import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarNav from './SidebarNav.jsx';
import MobileNav from './MobileNav.jsx';
import IncomingCallModal from '../../features/calls/components/IncomingCallModal.jsx';
import ActiveCallModal from '../../features/calls/components/ActiveCallModal.jsx';
import { Toaster } from 'sonner';

export const AppLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0E14] text-[#F8FAFC]">
      {/* Desktop Navigation Sidebar */}
      <SidebarNav />

      {/* Main Feature Viewport */}
      <main className="flex-1 flex overflow-hidden relative pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Call Modals (WebRTC) */}
      <IncomingCallModal />
      <ActiveCallModal />

      {/* Global Sonner Toast Notifications */}
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#151922',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#F8FAFC',
            borderRadius: '16px',
          },
        }}
      />
    </div>
  );
};

export default AppLayout;
