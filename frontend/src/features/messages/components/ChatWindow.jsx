import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';
import { useMessageStore } from '../store/messageStore.js';
import { useChatStore } from '../../chats/store/chatStore.js';
import { useAuthStore } from '../../auth/store/authStore.js';
import { messageService } from '../services/messageService.js';
import { getSocket } from '../../../services/socket/socketClient.js';
import ChatHeader from './ChatHeader.jsx';
import MessageBubble from './MessageBubble.jsx';
import ChatComposer from './ChatComposer.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';

export const ChatWindow = ({ chat }) => {
  const { messagesByChat, fetchMessages, hasMore, isLoading, setReplyingTo } = useMessageStore();
  const { typingUsers } = useChatStore();

  const [editingMessage, setEditingMessage] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const prevChatIdRef = useRef(null);

  const currentUserId = useAuthStore((s) => s.user?._id);
  const chatId = chat?._id;
  const rawMessages = (chatId && messagesByChat[chatId]) || [];
  const messages = rawMessages.filter(
    (m) => !m.deletedFor?.some((id) => (id._id || id).toString() === currentUserId?.toString())
  );
  const isTyping = chatId && typingUsers[chatId] && typingUsers[chatId].size > 0;

  // When chatId changes, reset state for instant scroll to bottom
  useEffect(() => {
    if (chatId && prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      isInitialLoadRef.current = true;
      setShowScrollBottom(false);
      fetchMessages(chatId);
      messageService.markChatAsSeen(chatId).catch(() => {});
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('markChatSeen', { chatId });
      }
      useChatStore.getState().markChatSeenLocal(chatId);
    }
  }, [chatId, fetchMessages]);

  // Mark incoming messages as seen if chat is currently open
  useEffect(() => {
    if (chatId && messages.length > 0) {
      const hasUnseen = messages.some(
        (m) =>
          (m.sender?._id || m.sender)?.toString() !== currentUserId?.toString() &&
          m.status !== 'seen' &&
          !m.seenBy?.some((id) => (id._id || id).toString() === currentUserId?.toString())
      );
      if (hasUnseen) {
        messageService.markChatAsSeen(chatId).catch(() => {});
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit('markChatSeen', { chatId });
        }
        useChatStore.getState().markChatSeenLocal(chatId);
      }
    }
  }, [chatId, messages.length, currentUserId]);

  const scrollToBottom = (behavior = 'auto') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Ensure scroll is at the very bottom on initial chat load and incoming messages
  useLayoutEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoadRef.current) {
        scrollToBottom('auto');
        const timer = setTimeout(() => {
          scrollToBottom('auto');
          isInitialLoadRef.current = false;
        }, 50);
        return () => clearTimeout(timer);
      } else if (!showScrollBottom) {
        scrollToBottom('smooth');
      }
    }
  }, [messages.length, chatId]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight <= clientHeight) return;

    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);

    // Infinite scroll trigger only when user explicitly scrolls near top
    if (!isInitialLoadRef.current && scrollTop < 20 && hasMore[chatId] && !isLoading) {
      fetchMessages(chatId, true);
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0E14] select-none">
        <EmptyState
          title="Select a conversation"
          description="Choose a conversation from the list or start a new chat with contacts or AI Copilot."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0E14] overflow-hidden relative">
      {/* Top Header */}
      <ChatHeader chat={chat} />

      {/* Messages Scroll Viewport */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-1 relative"
      >
        {/* Load More Indicator */}
        {hasMore[chatId] && (
          <div className="flex items-center justify-center py-2">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
            ) : (
              <button
                onClick={() => fetchMessages(chatId, true)}
                className="text-xs text-[#94A3B8] hover:text-white px-3 py-1 rounded-full bg-white/5 border border-white/5"
              >
                Load older messages
              </button>
            )}
          </div>
        )}

        {messages.length === 0 && !isLoading ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              title="No messages yet"
              description="Say hello to start the conversation!"
            />
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              onReply={(msg) => setReplyingTo(msg)}
              onForward={(msg) => console.log('Forward', msg)}
              onEdit={(msg) => setEditingMessage(msg)}
            />
          ))
        )}

        {/* Real-time Typing Bubble */}
        {isTyping && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#181D28] border border-white/5 w-fit my-2">
            <span className="text-xs text-[#94A3B8]">Someone is typing</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-9 h-9 rounded-full bg-[#181D28] border border-white/10 text-white shadow-xl flex items-center justify-center hover:bg-[#1F2432] transition-all hover:scale-110 active:scale-95 z-20"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Bottom Message Composer */}
      <ChatComposer
        chatId={chatId}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
};

export default ChatWindow;
