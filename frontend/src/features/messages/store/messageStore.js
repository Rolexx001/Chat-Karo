import { create } from 'zustand';
import { messageService } from '../services/messageService.js';
import { useChatStore } from '../../chats/store/chatStore.js';
import { useAuthStore } from '../../auth/store/authStore.js';

export const useMessageStore = create((set, get) => ({
  messagesByChat: {}, // { [chatId]: Message[] }
  cursors: {},        // { [chatId]: string | null }
  hasMore: {},        // { [chatId]: boolean }
  isLoading: false,
  replyingTo: null,

  setReplyingTo: (message) => set({ replyingTo: message }),

  fetchMessages: async (chatId, loadMore = false) => {
    if (!chatId) return;
    const currentCursor = loadMore ? get().cursors[chatId] : null;
    if (loadMore && !get().hasMore[chatId]) return;

    set({ isLoading: true });
    try {
      const data = await messageService.getMessages(chatId, currentCursor, 20);
      const fetchedMessages = data.messages || [];

      set((state) => {
        const existing = loadMore ? state.messagesByChat[chatId] || [] : [];
        // Combine without duplicates
        const messageMap = new Map();
        existing.forEach((m) => messageMap.set(m._id, m));
        fetchedMessages.forEach((m) => messageMap.set(m._id, m));

        const combined = Array.from(messageMap.values()).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        return {
          messagesByChat: {
            ...state.messagesByChat,
            [chatId]: combined,
          },
          cursors: {
            ...state.cursors,
            [chatId]: data.nextCursor || null,
          },
          hasMore: {
            ...state.hasMore,
            [chatId]: Boolean(data.hasMore),
          },
          isLoading: false,
        };
      });
    } catch (err) {
      console.error('Failed to fetch messages for chat:', chatId, err);
      set({ isLoading: false });
    }
  },

  addMessage: (message) => {
    const { chatId } = message;
    if (!chatId) return;

    set((state) => {
      const chatMessages = state.messagesByChat[chatId] || [];
      // Prevent duplicates
      if (chatMessages.some((m) => m._id === message._id)) {
        return state;
      }
      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: [...chatMessages, message],
        },
      };
    });

    const currentUserId = useAuthStore.getState().user?._id;
    useChatStore.getState().updateLastMessage(chatId, message, currentUserId);
  },

  updateMessage: (messageId, updates) => {
    set((state) => {
      const nextMessages = { ...state.messagesByChat };
      for (const [chatId, messages] of Object.entries(nextMessages)) {
        const index = messages.findIndex((m) => m._id === messageId);
        if (index !== -1) {
          const updated = [...messages];
          updated[index] = { ...updated[index], ...updates };
          nextMessages[chatId] = updated;
          break;
        }
      }
      return { messagesByChat: nextMessages };
    });
  },

  appendAiChunk: ({ chatId, messageId, chunk, isLast, fullText }) => {
    set((state) => {
      const chatMessages = state.messagesByChat[chatId] || [];
      const index = chatMessages.findIndex((m) => m._id === messageId);

      if (index === -1) {
        // Placeholder not found yet: create it dynamically
        const newAiMessage = {
          _id: messageId,
          chatId,
          isAI: true,
          content: fullText || chunk || '',
          status: isLast ? 'sent' : 'delivered',
          createdAt: new Date().toISOString(),
        };
        return {
          messagesByChat: {
            ...state.messagesByChat,
            [chatId]: [...chatMessages, newAiMessage],
          },
        };
      }

      const updated = [...chatMessages];
      const target = updated[index];
      const updatedContent = isLast ? (fullText || target.content) : (target.content + (chunk || ''));

      updated[index] = {
        ...target,
        content: updatedContent,
        status: isLast ? 'sent' : target.status,
      };

      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: updated,
        },
      };
    });
  },

  markSeenLocal: (messageId, userId) => {
    set((state) => {
      const nextMessages = { ...state.messagesByChat };
      for (const [chatId, messages] of Object.entries(nextMessages)) {
        const index = messages.findIndex((m) => m._id === messageId);
        if (index !== -1) {
          const target = messages[index];
          const seenBy = new Set(target.seenBy || []);
          seenBy.add(userId);
          const updated = [...messages];
          updated[index] = { ...target, seenBy: Array.from(seenBy), status: 'seen' };
          nextMessages[chatId] = updated;
          break;
        }
      }
      return { messagesByChat: nextMessages };
    });
  },

  markChatMessagesSeenLocal: (chatId, userId) => {
    set((state) => {
      const messages = state.messagesByChat[chatId];
      if (!messages || messages.length === 0) return state;

      const updated = messages.map((m) => {
        const seenBy = new Set(m.seenBy || []);
        if (userId) seenBy.add(userId);
        return {
          ...m,
          status: 'seen',
          seenBy: Array.from(seenBy),
        };
      });

      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: updated,
        },
      };
    });
  },

  markMessagesDeliveredLocal: (chatId, messageId = null) => {
    set((state) => {
      const messages = state.messagesByChat[chatId];
      if (!messages || messages.length === 0) return state;

      const updated = messages.map((m) => {
        if (messageId && m._id !== messageId) return m;
        if (m.status === 'sent') {
          return { ...m, status: 'delivered' };
        }
        return m;
      });

      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: updated,
        },
      };
    });
  },

  deleteMessageLocal: (messageId, type, userId) => {
    set((state) => {
      const nextMessages = { ...state.messagesByChat };
      for (const [chatId, messages] of Object.entries(nextMessages)) {
        const index = messages.findIndex((m) => m._id === messageId);
        if (index !== -1) {
          if (type === 'everyone') {
            const updated = [...messages];
            updated[index] = {
              ...updated[index],
              content: 'This message was deleted',
              mediaUrl: null,
              isDeleted: true,
            };
            nextMessages[chatId] = updated;
          } else {
            // Delete for self: remove message immediately from local list
            nextMessages[chatId] = messages.filter((m) => m._id !== messageId);
          }
          break;
        }
      }
      return { messagesByChat: nextMessages };
    });
  },
}));
