import axiosClient from '../../../services/api/axiosClient.js';
import { ENDPOINTS } from '../../../services/api/endpoints.js';

export const mediaService = {
  uploadFile: async (file, type = 'message', onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const res = await axiosClient.post(ENDPOINTS.MEDIA.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return res.data;
  },

  uploadAvatar: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await axiosClient.post(ENDPOINTS.MEDIA.UPLOAD_AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return res.data;
  },
};
