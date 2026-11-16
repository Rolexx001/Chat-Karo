import axiosClient from '../../../services/api/axiosClient.js';
import { ENDPOINTS } from '../../../services/api/endpoints.js';

export const userService = {
  search: async (query = '') => {
    const res = await axiosClient.get(ENDPOINTS.USER.SEARCH, {
      params: { query },
    });
    return res.data;
  },
};
