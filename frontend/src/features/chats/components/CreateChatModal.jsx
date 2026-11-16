import React, { useState, useEffect } from 'react';
import { Search, Loader2, MessageSquarePlus } from 'lucide-react';
import { userService } from '../../contacts/services/userService.js';
import { chatService } from '../services/chatService.js';
import { useChatStore } from '../store/chatStore.js';
import Modal from '../../../components/ui/Modal.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import { toast } from 'sonner';

export const CreateChatModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { addOrUpdateChat, setActiveChatId } = useChatStore();

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await userService.search(searchQuery);
        setUsers(data.users || []);
      } catch (err) {
        console.error('User search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  const handleStartChat = async (user) => {
    setIsCreating(true);
    try {
      const data = await chatService.createOneToOne(user._id);
      if (data.chat) {
        addOrUpdateChat(data.chat);
        setActiveChatId(data.chat._id);
        toast.success(`Started conversation with ${user.name}`);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create chat:', err);
      toast.error('Failed to start conversation');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Conversation"
      subtitle="Find people to chat with directly"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
            autoFocus
          />
        </div>

        {/* Results List */}
        <div className="min-h-[220px] max-h-[320px] overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-[#94A3B8]">
              <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#64748B]">
              {searchQuery ? 'No users found matching query' : 'Type a name or email to search'}
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                onClick={() => !isCreating && handleStartChat(user)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatar} name={user.name} size="md" isOnline={user.isOnline} showStatus={true} />
                  <div>
                    <h4 className="text-sm font-semibold text-[#F8FAFC] group-hover:text-white">{user.name}</h4>
                    <p className="text-xs text-[#94A3B8]">{user.email}</p>
                  </div>
                </div>

                <button
                  disabled={isCreating}
                  className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 hover:bg-[#7C3AED] text-[#C4B5FD] hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CreateChatModal;
