import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../utils/constants.js';
import { useAuthStore } from '../../features/auth/store/authStore.js';
import { authService } from '../../features/auth/services/authService.js';
import { toast } from 'sonner';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

let currentChatRoom = null;
let joinedUserId = null;
let joinedToken = null;

export const connectSocket = (userId, token) => {
  const s = getSocket();

  s.off('connect');
  s.off('connect_error');
  s.off('SessionRevoked');
  s.off('TokenExpired');

  s.on('connect', () => {
    console.log('Socket connected:', s.id);
    if (userId) {
      joinedUserId = userId;
      joinedToken = token;
      s.emit('join', { userId, token });
    }
    if (currentChatRoom) {
      s.emit('joinChat', currentChatRoom);
    }
  });

  s.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  s.on('SessionRevoked', (data) => {
    toast.error(data?.message || 'Your session has been revoked from another device.');
    useAuthStore.getState().logout();
    disconnectSocket();
  });

  s.on('TokenExpired', async () => {
    try {
      const data = await authService.refreshToken();
      if (data?.accessToken) {
        useAuthStore.getState().setAccessToken(data.accessToken);
        joinedToken = data.accessToken;
        s.emit('join', { userId: useAuthStore.getState().user?._id, token: data.accessToken });
      }
    } catch (err) {
      console.error('Failed to refresh socket token:', err);
    }
  });

  if (!s.connected) {
    s.connect();
  } else if (userId && (joinedUserId !== userId || joinedToken !== token)) {
    joinedUserId = userId;
    joinedToken = token;
    s.emit('join', { userId, token });
  }

  return s;
};

export const disconnectSocket = () => {
  joinedUserId = null;
  joinedToken = null;
  currentChatRoom = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Chat Room Helpers
export const socketJoinChat = (chatId) => {
  const s = getSocket();
  if (!chatId || currentChatRoom === chatId) return;
  currentChatRoom = chatId;
  if (s.connected) {
    s.emit('joinChat', chatId);
  }
};

export const socketLeaveChat = (chatId) => {
  const s = getSocket();
  if (currentChatRoom === chatId) {
    currentChatRoom = null;
  }
  if (s && s.connected && chatId) {
    s.emit('leaveChat', chatId);
  }
};

// Messaging Emitters
export const socketSendMessage = (message) => {
  const s = getSocket();
  if (s.connected && message) {
    s.emit('sendMessage', message);
  }
};

export const socketEditMessage = (data) => {
  const s = getSocket();
  if (s.connected && data) {
    s.emit('editMessage', data);
  }
};

export const socketDeleteMessage = (data) => {
  const s = getSocket();
  if (s.connected && data) {
    s.emit('deleteMessage', data);
  }
};

export const socketMarkSeen = (data) => {
  const s = getSocket();
  if (s.connected && data) {
    s.emit('markSeen', data);
  }
};

export const socketTyping = (chatId) => {
  const s = getSocket();
  if (s.connected && chatId) {
    s.emit('typing', { chatId });
  }
};

export const socketStopTyping = (chatId) => {
  const s = getSocket();
  if (s.connected && chatId) {
    s.emit('stopTyping', { chatId });
  }
};
