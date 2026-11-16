export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
export const STATIC_URL = import.meta.env.VITE_STATIC_URL || 'http://localhost:5000';

export const getFullMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return `${STATIC_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB
