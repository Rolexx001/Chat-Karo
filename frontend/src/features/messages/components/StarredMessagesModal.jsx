import React, { useState, useEffect } from 'react';
import { Star, X, Loader2, ArrowRight, Trash2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { messageService } from '../services/messageService.js';
import { useChatStore } from '../../chats/store/chatStore.js';
import { useMessageStore } from '../store/messageStore.js';
import { formatChatTime } from '../../../utils/formatDate.js';
import { toast } from 'sonner';

export const StarredMessagesModal = ({ isOpen, onClose, chatId = null }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setActiveChatId } = useChatStore();
  const { updateMessage } = useMessageStore();

  const fetchStarred = async () => {
    setIsLoading(true);
    try {
      const data = await messageService.getStarredMessages(chatId || 'all');
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch starred messages:', err);
      toast.error('Could not load starred messages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStarred();
    }
  }, [isOpen, chatId]);

  const handleUnstar = async (msgId, e) => {
    e?.stopPropagation();
    try {
      await messageService.unstarMessage(msgId);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      updateMessage(msgId, { starredBy: [] });
      toast.info('Message unstarred');
    } catch (err) {
      toast.error('Failed to unstar message');
    }
  };

  const handleNavigateToChat = (targetChatId) => {
    if (targetChatId) {
      setActiveChatId(targetChatId);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B]" />
          <span>Starred Messages</span>
        </div>
      }
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#7C3AED] gap-3">
            <Loader2 className="w-7 h-7 animate-spin" />
            <span className="text-xs text-[#94A3B8]">Loading starred messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title="No starred messages"
              description="Star important messages to easily find them here later."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const sender = typeof msg.sender === 'object' ? msg.sender : {};
              const targetChatId = typeof msg.chatId === 'object' ? msg.chatId?._id : msg.chatId;
              const chatName = msg.chatId?.groupName || (msg.chatId?.isGroup ? 'Group' : 'Direct Chat');

              return (
                <div
                  key={msg._id}
                  onClick={() => handleNavigateToChat(targetChatId)}
                  className="p-3.5 rounded-2xl bg-[#131720] border border-white/5 hover:border-white/10 transition-all cursor-pointer group flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={sender.avatar} name={sender.name || 'User'} size="sm" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{sender.name || 'User'}</h4>
                        <span className="text-[10px] text-[#64748B]">{chatName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#64748B]">{formatChatTime(msg.createdAt)}</span>
                      <button
                        onClick={(e) => handleUnstar(msg._id, e)}
                        title="Unstar"
                        className="p-1 rounded-lg text-[#F59E0B] hover:bg-white/5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#E2E8F0] break-words line-clamp-3 bg-[#0B0E14]/60 p-2.5 rounded-xl border border-white/5">
                    {msg.content || (msg.mediaUrl ? '📎 Attachment' : '...')}
                  </p>

                  <div className="flex items-center justify-end text-[11px] text-[#7C3AED] group-hover:text-[#A78BFA] font-medium gap-1">
                    <span>Jump to chat</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StarredMessagesModal;
