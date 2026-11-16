import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Sparkles,
  FileText,
  Mic,
  MoreVertical,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore.js';
import { useChatStore } from '../../chats/store/chatStore.js';
import { useCallStore } from '../../calls/store/callStore.js';
import { useAiStore } from '../../ai/store/aiStore.js';
import { chatService } from '../../chats/services/chatService.js';
import Avatar from '../../../components/ui/Avatar.jsx';
import PdfUploadModal from '../../ai/components/PdfUploadModal.jsx';
import SummaryModal from '../../ai/components/SummaryModal.jsx';
import VoiceRecorderModal from '../../ai/components/VoiceRecorderModal.jsx';
import StarredMessagesModal from './StarredMessagesModal.jsx';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

export const ChatHeader = ({ chat }) => {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const { setActiveChatId, fetchChats, onlineUsers } = useChatStore();
  const startCall = useCallStore((s) => s.startCall);
  const { summarizeConversation, isSummarizing } = useAiStore();

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isStarredModalOpen, setIsStarredModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isGroup = Boolean(chat.isGroup);

  const otherParticipant = isGroup
    ? null
    : chat.participants?.find((p) => (p._id || p).toString() !== currentUserId?.toString());

  const displayName = isGroup
    ? chat.groupName || 'Group Chat'
    : otherParticipant?.name || 'Unknown User';

  const displayAvatar = isGroup ? '' : otherParticipant?.avatar;
  const otherId = (otherParticipant?._id || otherParticipant)?.toString();
  const isOnline = isGroup ? false : Boolean(otherId && onlineUsers.has(otherId));

  const handleStartCall = (type) => {
    if (isGroup) {
      toast.info('Group calling is available for 1-on-1 chats');
      return;
    }
    if (!otherParticipant?._id) return;
    startCall(otherParticipant._id, displayName, displayAvatar, type);
  };

  const handleClearChat = async () => {
    try {
      await chatService.clearChat(chat._id);
      toast.success('Chat history cleared');
      fetchChats();
      setIsMenuOpen(false);
    } catch (err) {
      toast.error('Failed to clear chat');
    }
  };

  const handleSummarize = async () => {
    try {
      await summarizeConversation(chat._id);
      setIsSummaryModalOpen(true);
    } catch (e) {}
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-[#0F131C] border-b border-white/5 flex items-center justify-between shrink-0 select-none z-20">
      {/* Left: Back button (mobile) & Profile info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setActiveChatId(null)}
          className="md:hidden p-1.5 -ml-1 text-[#94A3B8] hover:text-white"
          title="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Avatar
          src={displayAvatar}
          name={displayName}
          size="md"
          isOnline={isOnline}
          showStatus={!isGroup}
        />

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#F8FAFC] truncate">{displayName}</h3>
          <p className="text-[11px] text-[#94A3B8] truncate">
            {isGroup
              ? `${chat.participants?.length || 0} participants`
              : isOnline
              ? 'Online'
              : 'Offline'}
          </p>
        </div>
      </div>

      {/* Right: Calling, Gemini AI Copilot Tools & Options */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Voice Call */}
        {!isGroup && (
          <button
            onClick={() => handleStartCall('voice')}
            title="Start Voice Call"
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#06B6D4] hover:bg-white/5 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
        )}

        {/* Video Call */}
        {!isGroup && (
          <button
            onClick={() => handleStartCall('video')}
            title="Start Video Call"
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#7C3AED] hover:bg-white/5 transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>
        )}

        <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

        {/* Gemini Speech-to-Speech Assistant Modal */}
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          title="Gemini Voice Assistant"
          className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F43F5E] hover:bg-white/5 transition-colors"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Gemini PDF RAG Knowledge Base */}
        <button
          onClick={() => setIsPdfModalOpen(true)}
          title="Index PDF for RAG Knowledge"
          className="p-2 rounded-xl text-[#94A3B8] hover:text-[#A78BFA] hover:bg-white/5 transition-colors"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Gemini Chat Summarize */}
        <button
          onClick={handleSummarize}
          disabled={isSummarizing}
          title="Summarize Chat with Gemini"
          className="p-2 rounded-xl text-[#94A3B8] hover:text-[#06B6D4] hover:bg-white/5 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Context Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl text-[#64748B] hover:text-white hover:bg-white/5 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-[#181D28] border border-white/10 rounded-xl shadow-glass p-1 z-30">
              {chat.summary && (
                <button
                  onClick={() => {
                    setIsSummaryModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E2E8F0] hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" /> View AI Summary
                </button>
              )}

              <button
                onClick={() => {
                  setIsStarredModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E2E8F0] hover:bg-white/5 rounded-lg transition-colors text-left"
              >
                <Star className="w-3.5 h-3.5 text-[#F59E0B]" /> Starred Messages
              </button>

              <button
                onClick={handleClearChat}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#FDA4AF] hover:bg-[#F43F5E]/10 rounded-lg transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Modals */}
      <PdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        chatId={chat._id}
      />
      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={chat.summary}
      />
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
      <StarredMessagesModal
        isOpen={isStarredModalOpen}
        onClose={() => setIsStarredModalOpen(false)}
        chatId={chat._id}
      />
    </header>
  );
};

export default ChatHeader;
