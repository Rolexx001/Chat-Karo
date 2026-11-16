import axiosClient from '../../../services/api/axiosClient.js';
import { ENDPOINTS } from '../../../services/api/endpoints.js';

export const notificationService = {
  getAll: async () => {
    const res = await axiosClient.get(ENDPOINTS.NOTIFICATION.BASE);
    return res.data;
  },

  getUnread: async () => {
    const res = await axiosClient.get(ENDPOINTS.NOTIFICATION.UNREAD);
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await axiosClient.get(ENDPOINTS.NOTIFICATION.UNREAD_COUNT);
    return res.data;
  },

  markAsRead: async (id) => {
    const res = await axiosClient.patch(ENDPOINTS.NOTIFICATION.MARK_READ(id));
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await axiosClient.patch(ENDPOINTS.NOTIFICATION.MARK_ALL_READ);
    return res.data;
  },

  delete: async (id) => {
    const res = await axiosClient.delete(ENDPOINTS.NOTIFICATION.DELETE(id));
    return res.data;
  },
};
