import axiosClient from '../../../services/api/axiosClient.js';
import { ENDPOINTS } from '../../../services/api/endpoints.js';

export const authService = {
  signup: async (userData) => {
    const response = await axiosClient.post(ENDPOINTS.AUTH.SIGNUP, userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await axiosClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  refreshToken: async () => {
    const response = await axiosClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN);
    return response.data;
  },

  logout: async () => {
    const response = await axiosClient.post(ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },

  getProfile: async () => {
    const response = await axiosClient.get(ENDPOINTS.AUTH.PROFILE);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await axiosClient.put(ENDPOINTS.AUTH.PROFILE, profileData);
    return response.data;
  },

  blockUser: async (targetUserId) => {
    const response = await axiosClient.post(ENDPOINTS.AUTH.BLOCK, { targetUserId });
    return response.data;
  },

  unblockUser: async (targetUserId) => {
    const response = await axiosClient.post(ENDPOINTS.AUTH.UNBLOCK, { targetUserId });
    return response.data;
  },

  getBlockedUsers: async () => {
    const response = await axiosClient.get(ENDPOINTS.AUTH.BLOCKED);
    return response.data;
  },

  reportUser: async (reportData) => {
    const response = await axiosClient.post(ENDPOINTS.AUTH.REPORT, reportData);
    return response.data;
  },

  getSessions: async () => {
    const response = await axiosClient.get(ENDPOINTS.AUTH.DEVICES);
    return response.data;
  },

  revokeSession: async (sessionId) => {
    const response = await axiosClient.delete(`${ENDPOINTS.AUTH.DEVICES}/${sessionId}`);
    return response.data;
  },

  revokeAllOtherSessions: async () => {
    const response = await axiosClient.delete(ENDPOINTS.AUTH.DEVICES);
    return response.data;
  },
};
