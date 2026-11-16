import axiosClient from '../../../services/api/axiosClient.js';
import { ENDPOINTS } from '../../../services/api/endpoints.js';

export const callService = {
  getHistory: async () => {
    const res = await axiosClient.get(ENDPOINTS.CALL.HISTORY);
    return res.data;
  },

  getIceServers: async () => {
    const res = await axiosClient.get(ENDPOINTS.CALL.ICE_SERVERS);
    return res.data;
  },
};
