import axiosClient from '../../../services/api/axiosClient.js';
import { ENDPOINTS } from '../../../services/api/endpoints.js';

export const messageService = {
  sendMessage: async (messageData) => {
    const res = await axiosClient.post(ENDPOINTS.MESSAGE.BASE, messageData);
    return res.data;
  },

  getMessages: async (chatId, cursor = null, limit = 20) => {
    const params = { limit };
    if (cursor) params.cursor = cursor;
    const res = await axiosClient.get(ENDPOINTS.MESSAGE.BY_CHAT(chatId), { params });
    return res.data;
  },

  editMessage: async (id, content) => {
    const res = await axiosClient.put(ENDPOINTS.MESSAGE.EDIT(id), { content });
    return res.data;
  },

  deleteMessage: async (id, type = 'everyone') => {
    const res = await axiosClient.delete(ENDPOINTS.MESSAGE.DELETE(id), { data: { type } });
    return res.data;
  },

  markSeen: async (id) => {
    const res = await axiosClient.post(ENDPOINTS.MESSAGE.SEEN(id));
    return res.data;
  },

  markChatAsSeen: async (chatId) => {
    const res = await axiosClient.post(`/message/${chatId}/mark-seen`);
    return res.data;
  },

  starMessage: async (id) => {
    const res = await axiosClient.post(ENDPOINTS.MESSAGE.STAR(id));
    return res.data;
  },

  unstarMessage: async (id) => {
    const res = await axiosClient.post(ENDPOINTS.MESSAGE.UNSTAR(id));
    return res.data;
  },

  getStarredMessages: async (chatId = 'all') => {
    const url = chatId && chatId !== 'all' ? ENDPOINTS.MESSAGE.STARRED(chatId) : '/message/starred/all';
    const res = await axiosClient.get(url);
    return res.data;
  },

  forwardMessage: async (id, chatIds) => {
    const res = await axiosClient.post(ENDPOINTS.MESSAGE.FORWARD(id), { chatIds });
    return res.data;
  },

  searchMessages: async (chatId, query) => {
    const res = await axiosClient.get(ENDPOINTS.MESSAGE.SEARCH(chatId), { params: { query } });
    return res.data;
  },
};
