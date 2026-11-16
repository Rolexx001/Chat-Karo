import React, { useEffect, useRef } from 'react';
import { Bell, CheckCheck, MessageSquare, Phone, Info, X, Trash2 } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore.js';
import { useChatStore } from '../../chats/store/chatStore.js';
import { useNavigate } from 'react-router-dom';
import { formatChatTime } from '../../../utils/formatDate.js';

export const NotificationCenter = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const { setActiveChatId } = useChatStore();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    if (notif.data?.chatId) {
      setActiveChatId(notif.data.chatId);
      navigate('/chats');
      onClose();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageSquare className="w-4 h-4 text-[#7C3AED]" />;
      case 'CALL':
        return <Phone className="w-4 h-4 text-[#06B6D4]" />;
      default:
        return <Info className="w-4 h-4 text-[#F59E0B]" />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute left-16 bottom-6 md:left-20 w-80 md:w-96 bg-[#131720] border border-white/10 rounded-2xl shadow-glass z-50 overflow-hidden flex flex-col max-h-[500px] animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0F131C]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#7C3AED]" />
          <h3 className="text-sm font-bold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA] font-bold">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              title="Mark all as read"
              className="text-xs text-[#94A3B8] hover:text-white flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Read all</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-[#64748B] hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#64748B]">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-[#64748B]/30 mx-auto mb-2" />
            <p className="text-xs text-[#94A3B8] font-medium">No notifications yet</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">We'll alert you when messages or calls arrive</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative group ${
                notif.isRead ? 'hover:bg-white/[0.02]' : 'bg-[#7C3AED]/[0.06] hover:bg-[#7C3AED]/[0.1]'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="text-xs font-semibold text-white truncate">{notif.title}</h4>
                  <span className="text-[10px] text-[#64748B] shrink-0">
                    {formatChatTime(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">{notif.body}</p>
              </div>

              {!notif.isRead && (
                <span className="w-2 h-2 rounded-full bg-[#7C3AED] shrink-0 self-center" />
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notif._id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-[#64748B] hover:text-[#F43F5E] transition-opacity shrink-0"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
