import { create } from 'zustand';
import { aiService } from '../services/aiService.js';
import { useMessageStore } from '../../messages/store/messageStore.js';
import { toast } from 'sonner';

export const useAiStore = create((set, get) => ({
  isStreaming: false,
  isSummarizing: false,
  isIndexingPdf: false,
  isRecordingVoice: false,
  activeAiMessageId: null,

  askAi: async (chatId, prompt, imageUrl = null) => {
    set({ isStreaming: true });
    try {
      const data = await aiService.ask(chatId, prompt, imageUrl);
      
      // Instantly inject user message & placeholder into local timeline
      if (data.userMessage) {
        useMessageStore.getState().addMessage(data.userMessage);
      }
      if (data.aiPlaceholder) {
        useMessageStore.getState().addMessage(data.aiPlaceholder);
        set({ activeAiMessageId: data.aiPlaceholder._id });
      }

      return data;
    } catch (err) {
      console.error('Failed to ask AI:', err);
      toast.error(err.response?.data?.message || 'Failed to send prompt to Gemini AI');
      set({ isStreaming: false });
      throw err;
    }
  },

  setStreamingFinished: () => {
    set({ isStreaming: false, activeAiMessageId: null });
  },

  indexPdf: async (chatId, file) => {
    set({ isIndexingPdf: true });
    try {
      const data = await aiService.uploadPdf(chatId, file);
      toast.success(data.message || 'PDF uploaded. Indexing knowledge for RAG in background...');
      set({ isIndexingPdf: false });
      return data;
    } catch (err) {
      console.error('PDF indexing error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload PDF for RAG');
      set({ isIndexingPdf: false });
      throw err;
    }
  },

  summarizeConversation: async (chatId) => {
    set({ isSummarizing: true });
    try {
      const data = await aiService.summarize(chatId);
      toast.info(data.message || 'Summarization queued. Generating 3-bullet points...');
      set({ isSummarizing: false });
      return data;
    } catch (err) {
      console.error('Summarize error:', err);
      toast.error('Failed to trigger chat summarization');
      set({ isSummarizing: false });
      throw err;
    }
  },
}));
