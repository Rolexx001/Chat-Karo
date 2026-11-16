import { create } from 'zustand';
import { chatService } from '../services/chatService.js';
import { socketJoinChat, socketLeaveChat } from '../../../services/socket/socketClient.js';

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChatId: null,
  isLoading: false,
  onlineUsers: new Set(),
  typingUsers: {}, // { [chatId]: Set([userIds]) }

  fetchChats: async () => {
    set({ isLoading: true });
    try {
      const data = await chatService.getChats();
      const chats = data.chats || [];
      set({ chats, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch chats:', err);
      set({ isLoading: false });
    }
  },

  setActiveChatId: (chatId) => {
    const prevChatId = get().activeChatId;
    if (prevChatId && prevChatId !== chatId) {
      socketLeaveChat(prevChatId);
    }
    if (chatId) {
      socketJoinChat(chatId);
      // Reset unread count locally when opening chat
      get().markChatSeenLocal(chatId);
    }
    set({ activeChatId: chatId });
  },

  markChatSeenLocal: (chatId) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c._id === chatId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  getActiveChat: () => {
    const { chats, activeChatId } = get();
    return chats.find((c) => c._id === activeChatId) || null;
  },

  addOrUpdateChat: (chat) => {
    set((state) => {
      const index = state.chats.findIndex((c) => c._id === chat._id);
      if (index !== -1) {
        const updated = [...state.chats];
        updated[index] = { ...updated[index], ...chat };
        updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        return { chats: updated };
      }
      const newChats = [chat, ...state.chats];
      newChats.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      return { chats: newChats };
    });
  },

  updateLastMessage: (chatId, message, currentUserId = null) => {
    let found = false;
    set((state) => {
      const senderId = typeof message.sender === 'object' ? message.sender?._id : message.sender;
      const isFromOther = currentUserId && senderId?.toString() !== currentUserId?.toString();
      const isNotActiveChat = state.activeChatId !== chatId;

      const chats = state.chats.map((c) => {
        if (c._id === chatId) {
          found = true;
          return {
            ...c,
            lastMessage: message,
            updatedAt: message.createdAt || new Date().toISOString(),
            unreadCount:
              isFromOther && isNotActiveChat
                ? (c.unreadCount || 0) + 1
                : c.unreadCount || 0,
          };
        }
        return c;
      });

      if (found) {
        chats.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        return { chats };
      }
      return state;
    });

    if (!found) {
      get().fetchChats();
    }
  },

  setInitialPresence: (onlineUserIds = []) => {
    set((state) => {
      const onlineUsers = new Set(state.onlineUsers);
      onlineUserIds.forEach((id) => onlineUsers.add(id.toString()));

      const chats = state.chats.map((chat) => ({
        ...chat,
        participants: chat.participants?.map((p) => {
          const pId = (p._id || p).toString();
          return { ...p, isOnline: onlineUsers.has(pId) };
        }),
      }));

      return { onlineUsers, chats };
    });
  },

  setUserPresence: (userId, isOnline) => {
    if (!userId) return;
    const uidStr = userId.toString();
    set((state) => {
      const onlineUsers = new Set(state.onlineUsers);
      if (isOnline) {
        onlineUsers.add(uidStr);
      } else {
        onlineUsers.delete(uidStr);
      }

      // Also update participants online state inside chats
      const chats = state.chats.map((chat) => ({
        ...chat,
        participants: chat.participants?.map((p) => {
          const pId = (p._id || p).toString();
          if (pId === uidStr) {
            return { ...p, isOnline };
          }
          return p;
        }),
      }));

      return { onlineUsers, chats };
    });
  },

  setUserTyping: (chatId, userId, isTyping) => {
    set((state) => {
      const currentTyping = state.typingUsers[chatId] || new Set();
      const nextTyping = new Set(currentTyping);
      if (isTyping) {
        nextTyping.add(userId);
      } else {
        nextTyping.delete(userId);
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: nextTyping,
        },
      };
    });
  },
}));
