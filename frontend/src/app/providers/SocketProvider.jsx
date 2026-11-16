import React, { useEffect } from 'react';
import { useAuthStore } from '../../features/auth/store/authStore.js';
import { useMessageStore } from '../../features/messages/store/messageStore.js';
import { useChatStore } from '../../features/chats/store/chatStore.js';
import { useNotificationStore } from '../../features/notifications/store/notificationStore.js';
import { useCallStore } from '../../features/calls/store/callStore.js';
import { connectSocket, disconnectSocket, getSocket } from '../../services/socket/socketClient.js';
import { addRemoteCandidate } from '../../features/calls/services/webrtcService.js';
import { toast } from 'sonner';

export const SocketProvider = ({ children }) => {
  const { user, accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user?._id || !accessToken) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(user._id, accessToken);

    // 1. Chat & Messaging Events
    const handleReceiveMessage = (message) => {
      useMessageStore.getState().addMessage(message);
      const senderId = typeof message.sender === 'object' ? message.sender?._id : message.sender;
      if (senderId?.toString() !== user._id.toString()) {
        socket.emit('messageDelivered', { messageId: message._id, chatId: message.chatId });
      }
    };

    const handleMessageEdited = (data) => {
      useMessageStore.getState().updateMessage(data.messageId, {
        content: data.content,
        isEdited: true,
      });
    };

    const handleMessageDeleted = (data) => {
      useMessageStore.getState().deleteMessageLocal(data.messageId, data.type, user._id);
    };

    const handleMessageSeen = ({ messageId, userId }) => {
      useMessageStore.getState().markSeenLocal(messageId, userId);
    };

    const handleMessagesSeen = ({ chatId, userId }) => {
      useMessageStore.getState().markChatMessagesSeenLocal(chatId, userId);
    };

    const handleMessageDelivered = ({ messageId, chatId }) => {
      useMessageStore.getState().markMessagesDeliveredLocal(chatId, messageId);
    };

    const handleMessagesDelivered = ({ chatId }) => {
      useMessageStore.getState().markMessagesDeliveredLocal(chatId);
    };

    // 2. Typing Indicators
    const handleTyping = ({ userId }) => {
      const activeChatId = useChatStore.getState().activeChatId;
      if (activeChatId) {
        useChatStore.getState().setUserTyping(activeChatId, userId, true);
      }
    };

    const handleStopTyping = ({ userId }) => {
      const activeChatId = useChatStore.getState().activeChatId;
      if (activeChatId) {
        useChatStore.getState().setUserTyping(activeChatId, userId, false);
      }
    };

    // 3. User Presence
    const handleInitialPresence = ({ onlineUserIds }) => {
      useChatStore.getState().setInitialPresence(onlineUserIds);
    };

    const handleUserPresence = ({ userId, isOnline }) => {
      useChatStore.getState().setUserPresence(userId, isOnline);
    };

    // 4. Real-Time AI Chunk Streaming
    const handleReceiveAIChunk = (data) => {
      useMessageStore.getState().appendAiChunk(data);
    };

    // 5. Notifications
    const handleReceiveNotification = (notification) => {
      useNotificationStore.getState().addNotification(notification);
      toast(notification.title || 'New Notification', {
        description: notification.body || '',
      });
    };

    // 6. WebRTC Signaling Relays
    const handleIncomingCall = (data) => {
      useCallStore.getState().handleIncomingCall(data);
    };

    const handleCallAccepted = (data) => {
      useCallStore.getState().handleCallAccepted(data);
    };

    const handleCallRejected = () => {
      toast.error('Call was declined');
      useCallStore.getState().cleanup();
    };

    const handleIceCandidate = ({ candidate }) => {
      addRemoteCandidate(candidate);
    };

    const handleCallEnded = () => {
      useCallStore.getState().handleRemoteEnded();
    };

    const handleCallBusy = () => {
      useCallStore.getState().handleRemoteBusy();
    };

    const handleCallUserOffline = () => {
      useCallStore.getState().handleRemoteOffline();
    };

    // Register listeners
    socket.on('ReceiveMessage', handleReceiveMessage);
    socket.on('MessageEdited', handleMessageEdited);
    socket.on('MessageDeleted', handleMessageDeleted);
    socket.on('MessageSeen', handleMessageSeen);
    socket.on('MessagesSeen', handleMessagesSeen);
    socket.on('MessageDelivered', handleMessageDelivered);
    socket.on('MessagesDelivered', handleMessagesDelivered);
    socket.on('Typing', handleTyping);
    socket.on('StopTyping', handleStopTyping);
    socket.on('InitialPresence', handleInitialPresence);
    socket.on('UserPresence', handleUserPresence);
    socket.on('ReceiveAIChunk', handleReceiveAIChunk);
    socket.on('ReceiveNotification', handleReceiveNotification);
    socket.on('incomingCall', handleIncomingCall);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('callRejected', handleCallRejected);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('callEnded', handleCallEnded);
    socket.on('callBusy', handleCallBusy);
    socket.on('callUserOffline', handleCallUserOffline);

    return () => {
      socket.off('ReceiveMessage', handleReceiveMessage);
      socket.off('MessageEdited', handleMessageEdited);
      socket.off('MessageDeleted', handleMessageDeleted);
      socket.off('MessageSeen', handleMessageSeen);
      socket.off('MessagesSeen', handleMessagesSeen);
      socket.off('MessageDelivered', handleMessageDelivered);
      socket.off('MessagesDelivered', handleMessagesDelivered);
      socket.off('Typing', handleTyping);
      socket.off('StopTyping', handleStopTyping);
      socket.off('InitialPresence', handleInitialPresence);
      socket.off('UserPresence', handleUserPresence);
      socket.off('ReceiveAIChunk', handleReceiveAIChunk);
      socket.off('ReceiveNotification', handleReceiveNotification);
      socket.off('incomingCall', handleIncomingCall);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('callRejected', handleCallRejected);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('callEnded', handleCallEnded);
      socket.off('callBusy', handleCallBusy);
      socket.off('callUserOffline', handleCallUserOffline);
    };
  }, [isAuthenticated, user?._id, accessToken]);

  return children;
};

export default SocketProvider;
