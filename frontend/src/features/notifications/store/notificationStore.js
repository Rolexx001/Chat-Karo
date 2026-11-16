import { create } from 'zustand';
import { notificationService } from '../services/notificationService.js';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await notificationService.getAll();
      const countData = await notificationService.getUnreadCount();
      set({
        notifications: data.notifications || [],
        unreadCount: countData.unreadCount || 0,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  },

  deleteNotification: async (id) => {
    try {
      await notificationService.delete(id);
      set((state) => {
        const deleted = state.notifications.find((n) => n._id === id);
        return {
          notifications: state.notifications.filter((n) => n._id !== id),
          unreadCount: deleted && !deleted.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  },
}));
