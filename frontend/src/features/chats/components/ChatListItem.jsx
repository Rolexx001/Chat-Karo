import React from 'react';
import { useAuthStore } from '../../auth/store/authStore.js';
import { useChatStore } from '../store/chatStore.js';
import Avatar from '../../../components/ui/Avatar.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { formatChatTime } from '../../../utils/formatDate.js';
import { Users, Bot, Pin } from 'lucide-react';

export const ChatListItem = ({ chat }) => {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const { activeChatId, setActiveChatId, typingUsers, onlineUsers } = useChatStore();

  const isSelected = activeChatId === chat._id;
  const isGroup = Boolean(chat.isGroup);

  // Get other participant for 1-on-1 chat
  const otherParticipant = isGroup
    ? null
    : chat.participants?.find((p) => (p._id || p).toString() !== currentUserId?.toString());

  const displayName = isGroup
    ? chat.groupName || 'Group Chat'
    : otherParticipant?.name || 'Unknown User';

  const displayAvatar = isGroup ? '' : otherParticipant?.avatar;
  const otherId = (otherParticipant?._id || otherParticipant)?.toString();
  const isOnline = isGroup ? false : Boolean(otherId && onlineUsers.has(otherId));

  const isTyping = typingUsers[chat._id] && typingUsers[chat._id].size > 0;
  const isPinned = chat.pinnedMessages && chat.pinnedMessages.length > 0;

  const lastMessageContent = () => {
    if (isTyping) {
      return <span className="text-[#06B6D4] font-medium animate-pulse">Typing...</span>;
    }
    if (!chat.lastMessage) {
      return <span className="text-[#64748B] italic">No messages yet</span>;
    }
    const lm = chat.lastMessage;
    if (lm.isDeleted) {
      return <span className="text-[#64748B] italic">Message was deleted</span>;
    }
    if (lm.mediaUrl && !lm.content) {
      return <span className="text-[#94A3B8]">📎 Attachment</span>;
    }
    return lm.content || '...';
  };

  return (
    <div
      onClick={() => setActiveChatId(chat._id)}
      className={`group relative flex items-center gap-3.5 px-4 py-3 cursor-pointer rounded-2xl transition-all duration-150 select-none ${
        isSelected
          ? 'bg-[#181D28] border border-white/10 shadow-sm'
          : 'hover:bg-white/[0.03] border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar
          src={displayAvatar}
          name={displayName}
          size="md"
          isOnline={isOnline}
          showStatus={!isGroup}
        />
        {isGroup && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center text-white ring-2 ring-[#0B0E14]">
            <Users className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      {/* Content & Last Message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4
            className={`text-sm font-semibold truncate ${
              isSelected ? 'text-[#F8FAFC]' : 'text-[#E2E8F0] group-hover:text-white'
            }`}
          >
            {displayName}
          </h4>
          <span className="text-[11px] text-[#64748B] shrink-0 font-medium">
            {formatChatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[#94A3B8] truncate leading-tight flex-1">
            {lastMessageContent()}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPinned && <Pin className="w-3 h-3 text-[#A78BFA]" />}
            {chat.summary && (
              <span title="AI Summary Available">
                <Bot className="w-3.5 h-3.5 text-[#06B6D4]" />
              </span>
            )}
            {chat.unreadCount > 0 && !isSelected && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#7C3AED] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
