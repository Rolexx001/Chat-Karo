import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, MessageSquarePlus, Sparkles } from 'lucide-react';
import { useChatStore } from '../store/chatStore.js';
import ChatListItem from './ChatListItem.jsx';
import CreateChatModal from './CreateChatModal.jsx';
import CreateGroupModal from './CreateGroupModal.jsx';
import Skeleton from '../../../components/ui/Skeleton.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';

export const ChatList = () => {
  const { chats, fetchChats, isLoading } = useChatStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, groups
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const filteredChats = chats.filter((chat) => {
    // 1. Filter by category
    if (filter === 'groups' && !chat.isGroup) return false;
    // 2. Filter by search text
    if (search.trim()) {
      const q = search.toLowerCase();
      const nameMatch = chat.groupName?.toLowerCase().includes(q) ||
        chat.participants?.some((p) => p.name?.toLowerCase().includes(q));
      const msgMatch = chat.lastMessage?.content?.toLowerCase().includes(q);
      return nameMatch || msgMatch;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full w-full md:w-[360px] lg:w-[400px] bg-[#0F131C] border-r border-white/5 shrink-0 select-none">
      {/* Header with Title & Action Buttons */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[#F8FAFC]">Messages</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#94A3B8] font-semibold">
              {chats.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsGroupModalOpen(true)}
              title="Create Group"
              className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 transition-colors"
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsChatModalOpen(true)}
              title="New Conversation"
              className="p-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-glow-primary transition-all hover:scale-105 active:scale-95"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181D28] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
          {['all', 'groups'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === tab
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {isLoading && chats.length === 0 ? (
          <div className="space-y-3 p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-24 h-3.5" />
                  <Skeleton className="w-48 h-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="Start a new direct chat or create a group to begin messaging."
            actionLabel="Start a Chat"
            onAction={() => setIsChatModalOpen(true)}
            className="py-16"
          />
        ) : (
          filteredChats.map((chat) => (
            <ChatListItem key={chat._id} chat={chat} />
          ))
        )}
      </div>

      {/* Modals */}
      <CreateChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </div>
  );
};

export default ChatList;
