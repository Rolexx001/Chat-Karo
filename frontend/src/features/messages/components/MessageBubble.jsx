import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Check,
  CheckCheck,
  Bot,
  Star,
  MoreHorizontal,
  Reply,
  Forward,
  Edit2,
  Trash2,
  FileText,
  Download,
} from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore.js';
import { useMessageStore } from '../store/messageStore.js';
import { messageService } from '../services/messageService.js';
import { getFullMediaUrl } from '../../../utils/constants.js';
import { formatMessageTime } from '../../../utils/formatDate.js';
import { toast } from 'sonner';

export const MessageBubble = ({ message, onReply, onForward, onEdit }) => {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const { deleteMessageLocal, updateMessage } = useMessageStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const senderId = typeof message.sender === 'object' ? message.sender?._id : message.sender;
  const isMine = senderId?.toString() === currentUserId?.toString();
  const isAi = Boolean(message.isAI);

  const isStarred = message.starredBy?.includes(currentUserId);
  const isSeen = message.status === 'seen' || (message.seenBy && message.seenBy.length > 0);

  const handleToggleStar = async () => {
    try {
      if (isStarred) {
        await messageService.unstarMessage(message._id);
        updateMessage(message._id, {
          starredBy: message.starredBy.filter((id) => id !== currentUserId),
        });
        toast.info('Message unstarred');
      } else {
        await messageService.starMessage(message._id);
        updateMessage(message._id, {
          starredBy: [...(message.starredBy || []), currentUserId],
        });
        toast.success('Message starred');
      }
    } catch (e) {
      toast.error('Failed to update star');
    }
  };

  const handleDelete = async (type) => {
    try {
      await messageService.deleteMessage(message._id, type);
      deleteMessageLocal(message._id, type, currentUserId);
      setIsMenuOpen(false);
      toast.success(type === 'everyone' ? 'Deleted for everyone' : 'Deleted for you');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const fullMediaUrl = getFullMediaUrl(message.mediaUrl);
  const isImage = fullMediaUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(fullMediaUrl);
  const isVideo = fullMediaUrl && /\.(mp4|webm|mov)$/i.test(fullMediaUrl);
  const isAudio = fullMediaUrl && /\.(mp3|wav|ogg)$/i.test(fullMediaUrl);
  const isPdf = fullMediaUrl && /\.pdf$/i.test(fullMediaUrl);

  return (
    <div
      className={`group relative flex w-full my-1.5 ${
        isAi ? 'justify-start' : isMine ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm transition-all ${
          isAi
            ? 'bg-[#151922] border border-[#7C3AED]/30 shadow-glow-primary/20 text-[#F8FAFC]'
            : isMine
            ? 'bg-[#7C3AED] text-white rounded-br-sm'
            : 'bg-[#181D28] text-[#F8FAFC] border border-white/5 rounded-bl-sm'
        }`}
      >
        {/* AI Copilot Badge */}
        {isAi && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A78BFA] uppercase tracking-wider mb-1.5">
            <Bot className="w-3.5 h-3.5 text-[#06B6D4]" /> Gemini AI Assistant
          </div>
        )}

        {/* Sender Name in Group chats if incoming */}
        {!isMine && !isAi && typeof message.sender === 'object' && message.sender?.name && (
          <p className="text-[11px] font-bold text-[#A78BFA] mb-1">
            {message.sender.name}
          </p>
        )}

        {/* Reply Quote Preview */}
        {message.replyTo && (
          <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-2 border-[#06B6D4] text-xs">
            <span className="text-[10px] font-bold text-[#06B6D4] block">Replying to message</span>
            <p className="text-white/80 line-clamp-1 italic">
              {message.replyTo.content || '[Attachment]'}
            </p>
          </div>
        )}

        {/* Media Attachments */}
        {fullMediaUrl && (
          <div className="mb-2 rounded-xl overflow-hidden">
            {isImage ? (
              <img
                src={fullMediaUrl}
                alt="attachment"
                className="max-h-72 w-full object-cover rounded-xl cursor-pointer hover:opacity-95"
                onClick={() => window.open(fullMediaUrl, '_blank')}
              />
            ) : isVideo ? (
              <video src={fullMediaUrl} controls className="max-h-72 w-full rounded-xl" />
            ) : isAudio ? (
              <audio src={fullMediaUrl} controls className="w-full mt-1" />
            ) : isPdf ? (
              <a
                href={fullMediaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-black/20 border border-white/10 hover:bg-black/30 transition-colors"
              >
                <FileText className="w-6 h-6 text-[#F43F5E]" />
                <span className="text-xs font-medium truncate flex-1">PDF Document</span>
                <Download className="w-4 h-4 text-[#94A3B8]" />
              </a>
            ) : (
              <a
                href={fullMediaUrl}
                download
                className="flex items-center gap-2 p-2 rounded-lg bg-black/20 text-xs text-[#94A3B8] hover:text-white"
              >
                Download Attachment
              </a>
            )}
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <div className={`text-sm leading-relaxed break-words ${message.isDeleted ? 'italic text-white/50' : ''}`}>
            {isAi ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : (
              message.content
            )}
          </div>
        )}

        {/* Footer: Star, Edited Indicator, Timestamp, Read Receipts */}
        <div className="flex items-center justify-end gap-1.5 mt-1 select-none text-[10px] text-white/60">
          {isStarred && <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />}
          {message.isEdited && <span className="italic">edited</span>}
          <span>{formatMessageTime(message.createdAt)}</span>

          {isMine && !isAi && (
            <span className="inline-flex items-center ml-0.5">
              {isSeen ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#06B6D4]" title="Read" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#94A3B8]" title="Delivered" />
              ) : (
                <Check className="w-3.5 h-3.5 text-[#94A3B8]" title="Sent" />
              )}
            </span>
          )}
        </div>

        {/* Hover Quick Actions Bar */}
        <div
          className={`absolute top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#181D28] border border-white/10 rounded-full px-1.5 py-0.5 shadow-lg flex items-center gap-1 z-20 ${
            isMine ? 'left-2' : 'right-2'
          }`}
        >
          <button
            onClick={() => onReply(message)}
            title="Reply"
            className="p-1 hover:text-[#06B6D4] text-[#94A3B8]"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleStar}
            title={isStarred ? 'Unstar' : 'Star'}
            className="p-1 hover:text-[#F59E0B] text-[#94A3B8]"
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-[#F59E0B] text-[#F59E0B]' : ''}`} />
          </button>
          <button
            onClick={() => onForward(message)}
            title="Forward"
            className="p-1 hover:text-[#7C3AED] text-[#94A3B8]"
          >
            <Forward className="w-3.5 h-3.5" />
          </button>

          {isMine && !message.isDeleted && (
            <button
              onClick={() => onEdit(message)}
              title="Edit"
              className="p-1 hover:text-white text-[#94A3B8]"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="More"
              className="p-1 hover:text-white text-[#64748B]"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-[#131720] border border-white/10 rounded-xl shadow-glass p-1 z-30">
                <button
                  onClick={() => handleDelete('self')}
                  className="w-full text-left px-2 py-1.5 text-[11px] text-[#FDA4AF] hover:bg-white/5 rounded"
                >
                  Delete for me
                </button>
                {isMine && !message.isDeleted && (
                  <button
                    onClick={() => handleDelete('everyone')}
                    className="w-full text-left px-2 py-1.5 text-[11px] text-[#F43F5E] hover:bg-white/5 rounded font-semibold"
                  >
                    Delete for everyone
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
