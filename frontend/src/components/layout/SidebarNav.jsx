import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  CircleDot,
  Phone,
  Sparkles,
  Settings,
  LogOut,
  Bell,
  Star,
} from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/authStore.js';
import { useNotificationStore } from '../../features/notifications/store/notificationStore.js';
import { authService } from '../../features/auth/services/authService.js';
import NotificationCenter from '../../features/notifications/components/NotificationCenter.jsx';
import StarredMessagesModal from '../../features/messages/components/StarredMessagesModal.jsx';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import { toast } from 'sonner';

export const SidebarNav = () => {
  const { user, logout } = useAuthStore();
  const unreadNotifications = useNotificationStore((s) => s.unreadCount);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isStarredModalOpen, setIsStarredModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore
    } finally {
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const navLinks = [
    { to: '/chats', icon: MessageSquare, label: 'Chats' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/status', icon: CircleDot, label: 'Stories' },
    { to: '/calls', icon: Phone, label: 'Calls' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col items-center justify-between w-[72px] h-screen bg-[#0B0E14] border-r border-white/5 py-5 shrink-0 z-30 select-none">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6">
        <NavLink
          to="/chats"
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-glow-primary hover:opacity-90 transition-opacity"
          title="Chat Karo"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </NavLink>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-2">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                `relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 ${
                  isActive
                    ? 'bg-[#7C3AED] text-white shadow-glow-primary'
                    : 'text-[#64748B] hover:text-[#E2E8F0] hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-5 h-5" />
            </NavLink>
          ))}

          {/* Starred Messages Global Trigger */}
          <button
            onClick={() => setIsStarredModalOpen(true)}
            title="Starred Messages"
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#64748B] hover:text-[#F59E0B] hover:bg-white/5 transition-all duration-150"
          >
            <Star className="w-5 h-5" />
          </button>
        </nav>
      </div>

      {/* Bottom Profile & Actions */}
      <div className="flex flex-col items-center gap-4 relative">
        {/* Notifications Icon with Unread Badge */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            title="Notifications"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isNotificationOpen
                ? 'bg-[#7C3AED] text-white'
                : 'text-[#64748B] hover:text-[#E2E8F0] hover:bg-white/5'
            }`}
          >
            <Bell className="w-5 h-5" />
          </button>
          {unreadNotifications > 0 && (
            <Badge
              variant="danger"
              size="count"
              className="absolute -top-1 -right-1 pointer-events-none"
            >
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </Badge>
          )}

          {/* Floating Notification Center Drawer */}
          <NotificationCenter
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        {/* User Profile Avatar */}
        <NavLink to="/settings" title="My Profile" className="relative group">
          <Avatar
            src={user?.avatar}
            name={user?.name || 'User'}
            size="sm"
            isOnline={true}
            showStatus={true}
            className="ring-2 ring-transparent group-hover:ring-[#7C3AED] transition-all"
          />
        </NavLink>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Starred Messages Modal */}
      <StarredMessagesModal
        isOpen={isStarredModalOpen}
        onClose={() => setIsStarredModalOpen(false)}
        chatId={null}
      />
    </aside>
  );
};

export default SidebarNav;
