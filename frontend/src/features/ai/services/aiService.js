import axiosClient from '../../../services/api/axiosClient.js';
import { ENDPOINTS } from '../../../services/api/endpoints.js';

export const aiService = {
  ask: async (chatId, prompt, imageUrl = null) => {
    const res = await axiosClient.post(ENDPOINTS.AI.ASK(chatId), { prompt, imageUrl });
    return res.data;
  },

  uploadPdf: async (chatId, pdfFile, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', pdfFile);

    const res = await axiosClient.post(ENDPOINTS.AI.PDF_RAG(chatId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return res.data;
  },

  semanticSearch: async (chatId, query) => {
    const res = await axiosClient.get(ENDPOINTS.AI.SEMANTIC_SEARCH(chatId), {
      params: { query },
    });
    return res.data;
  },

  summarize: async (chatId) => {
    const res = await axiosClient.post(ENDPOINTS.AI.SUMMARIZE(chatId));
    return res.data;
  },

  voiceAssistant: async (audioBlob) => {
    const formData = new FormData();
    const file = new File([audioBlob], 'voice_note.wav', { type: 'audio/wav' });
    formData.append('file', file);

    const res = await axiosClient.post(ENDPOINTS.AI.VOICE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
