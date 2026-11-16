import axiosClient from '../../../services/api/axiosClient.js';
import { ENDPOINTS } from '../../../services/api/endpoints.js';

export const statusService = {
  create: async (statusData) => {
    // If statusData is FormData or JSON
    const isFormData = statusData instanceof FormData;
    const res = await axiosClient.post(ENDPOINTS.STATUS.BASE, statusData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return res.data;
  },

  getFeed: async () => {
    const res = await axiosClient.get(ENDPOINTS.STATUS.BASE);
    return res.data;
  },

  getMyStatuses: async () => {
    const res = await axiosClient.get(ENDPOINTS.STATUS.ME);
    return res.data;
  },

  view: async (statusId) => {
    const res = await axiosClient.post(ENDPOINTS.STATUS.VIEW(statusId));
    return res.data;
  },

  getViewers: async (statusId) => {
    const res = await axiosClient.get(ENDPOINTS.STATUS.VIEWERS(statusId));
    return res.data;
  },

  delete: async (statusId) => {
    const res = await axiosClient.delete(ENDPOINTS.STATUS.DELETE(statusId));
    return res.data;
  },
};
