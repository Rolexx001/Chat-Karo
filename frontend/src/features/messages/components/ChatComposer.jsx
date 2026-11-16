import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Sparkles,
  X,
  Loader2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { useMessageStore } from '../store/messageStore.js';
import { useAiStore } from '../../ai/store/aiStore.js';
import { messageService } from '../services/messageService.js';
import { mediaService } from '../../media/services/mediaService.js';
import {
  socketSendMessage,
  socketEditMessage,
  socketTyping,
  socketStopTyping,
} from '../../../services/socket/socketClient.js';
import { toast } from 'sonner';

export const ChatComposer = ({ chatId, editingMessage, onCancelEdit }) => {
  const [content, setContent] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachment, setAttachment] = useState(null); // { mediaUrl, filename, type }
  const [isSending, setIsSending] = useState(false);

  const { replyingTo, setReplyingTo, addMessage, updateMessage } = useMessageStore();
  const { askAi, isStreaming } = useAiStore();

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Populate when editing
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content || '');
      setIsAiMode(false);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const handleInputChange = (e) => {
    setContent(e.target.value);

    // Emit typing indicator to socket
    if (chatId && !isAiMode) {
      socketTyping(chatId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketStopTyping(chatId);
      }, 2000);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await mediaService.uploadFile(file);
      setAttachment({
        mediaUrl: data.mediaUrl,
        filename: file.name,
        type: file.type,
      });
      toast.success('File attached');
    } catch (err) {
      console.error('File upload failed:', err);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = content.trim();
    if (!text && !attachment) return;

    // Handle Edit Mode
    if (editingMessage) {
      try {
        const data = await messageService.editMessage(editingMessage._id, text);
        updateMessage(editingMessage._id, { content: text, isEdited: true });
        socketEditMessage({
          chatId,
          messageId: editingMessage._id,
          content: text,
        });
        toast.success('Message updated');
        onCancelEdit();
        setContent('');
      } catch (err) {
        toast.error('Failed to edit message');
      }
      return;
    }

    setIsSending(true);

    // Handle Gemini AI Copilot Prompt Mode
    if (isAiMode) {
      try {
        await askAi(chatId, text, attachment?.mediaUrl || null);
        setContent('');
        setAttachment(null);
        setIsAiMode(false);
      } catch (err) {
        // Handled in store
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Normal Real-Time Chat Message
    try {
      const payload = {
        chatId,
        ...(text ? { content: text } : {}),
        ...(attachment?.mediaUrl ? { mediaUrl: attachment.mediaUrl } : {}),
        ...(replyingTo?._id ? { replyTo: replyingTo._id } : {}),
      };

      const data = await messageService.sendMessage(payload);
      if (data.message) {
        addMessage(data.message);
        socketSendMessage(data.message);
        socketStopTyping(chatId);
      }

      setContent('');
      setAttachment(null);
      setReplyingTo(null);
    } catch (err) {
      console.error('Send message failed:', err);
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 md:p-4 bg-[#0F131C] border-t border-white/5 select-none shrink-0 z-20">
      {/* Replying-to Header Bar */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-black/30 border-l-2 border-[#06B6D4] text-xs">
          <div className="truncate">
            <span className="text-[10px] font-bold text-[#06B6D4]">Replying to</span>
            <p className="text-white/80 truncate text-xs">{replyingTo.content || 'Attachment'}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing Message Header Bar */}
      {editingMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-white/5 border-l-2 border-[#A78BFA] text-xs">
          <span className="text-xs text-[#A78BFA] font-medium">Editing message</span>
          <button onClick={onCancelEdit} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Uploaded Attachment Chip */}
      {attachment && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-xl bg-[#181D28] border border-white/10 w-fit text-xs">
          <FileText className="w-4 h-4 text-[#A78BFA]" />
          <span className="text-white font-medium max-w-xs truncate">{attachment.filename}</span>
          <button onClick={() => setAttachment(null)} className="text-white/50 hover:text-white ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div
        className={`flex items-end gap-2 bg-[#181D28] border rounded-2xl p-2 transition-all ${
          isAiMode
            ? 'border-[#7C3AED] shadow-glow-primary/30 ring-1 ring-[#7C3AED]'
            : 'border-white/10 focus-within:border-[#7C3AED]'
        }`}
      >
        {/* Attachment Button */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isSending}
          title="Attach File (Images, Videos, PDFs)"
          className="p-2 text-[#94A3B8] hover:text-white rounded-xl hover:bg-white/5 transition-colors shrink-0"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" /> : <Paperclip className="w-5 h-5" />}
        </button>

        {/* AI Mode Toggle Button */}
        <button
          type="button"
          onClick={() => setIsAiMode(!isAiMode)}
          title={isAiMode ? 'Switch to Normal Chat' : 'Ask Gemini AI Assistant in this chat'}
          className={`p-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 text-xs font-semibold ${
            isAiMode
              ? 'bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white shadow-glow-primary'
              : 'text-[#94A3B8] hover:text-[#06B6D4] hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {isAiMode && <span className="hidden sm:inline">AI Copilot</span>}
        </button>

        {/* Auto-expanding Input Field */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isAiMode
              ? 'Ask Gemini AI anything (math, live weather, web search, PDF questions)...'
              : 'Type a message (Enter to send, Shift+Enter for newline)...'
          }
          className="flex-1 bg-transparent border-0 text-[#F8FAFC] placeholder-[#64748B] text-sm py-2 px-1 focus:outline-none resize-none max-h-32 leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && !attachment) || isSending || isStreaming}
          title="Send"
          className="p-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 disabled:hover:bg-[#7C3AED] text-white shadow-glow-primary transition-all shrink-0 active:scale-95"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatComposer;
