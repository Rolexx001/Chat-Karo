import axiosClient from '../../../services/api/axiosClient.js';
import { ENDPOINTS } from '../../../services/api/endpoints.js';

export const chatService = {
  getChats: async () => {
    const res = await axiosClient.get(ENDPOINTS.CHAT.BASE);
    return res.data;
  },

  createOneToOne: async (userId) => {
    const res = await axiosClient.post(ENDPOINTS.CHAT.BASE, { userId });
    return res.data;
  },

  createGroup: async (groupName, participants) => {
    const res = await axiosClient.post(ENDPOINTS.CHAT.GROUP, { groupName, participants });
    return res.data;
  },

  addMember: async (chatId, userId) => {
    const res = await axiosClient.put(ENDPOINTS.CHAT.ADD_MEMBER(chatId), { userId });
    return res.data;
  },

  removeMember: async (chatId, userId) => {
    const res = await axiosClient.put(ENDPOINTS.CHAT.REMOVE_MEMBER(chatId), { userId });
    return res.data;
  },

  pinMessage: async (chatId, messageId) => {
    const res = await axiosClient.put(ENDPOINTS.CHAT.PIN(chatId), { messageId });
    return res.data;
  },

  unpinMessage: async (chatId, messageId) => {
    const res = await axiosClient.put(ENDPOINTS.CHAT.UNPIN(chatId), { messageId });
    return res.data;
  },

  getPinnedMessages: async (chatId) => {
    const res = await axiosClient.get(ENDPOINTS.CHAT.PINNED(chatId));
    return res.data;
  },

  clearChat: async (chatId) => {
    const res = await axiosClient.delete(ENDPOINTS.CHAT.CLEAR(chatId));
    return res.data;
  },

  getClearedTimestamp: async (chatId) => {
    const res = await axiosClient.get(ENDPOINTS.CHAT.CLEARED_TIMESTAMP(chatId));
    return res.data;
  },
};
