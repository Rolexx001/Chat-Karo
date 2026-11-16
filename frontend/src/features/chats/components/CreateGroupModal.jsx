import React, { useState, useEffect } from 'react';
import { Search, Loader2, Check, Users, X } from 'lucide-react';
import { userService } from '../../contacts/services/userService.js';
import { chatService } from '../services/chatService.js';
import { useChatStore } from '../store/chatStore.js';
import Modal from '../../../components/ui/Modal.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import Button from '../../../components/ui/Button.jsx';
import { toast } from 'sonner';

export const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { addOrUpdateChat, setActiveChatId } = useChatStore();

  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setSearchQuery('');
      setUsers([]);
      setSelectedUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await userService.search(searchQuery);
        setUsers(data.users || []);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  const toggleUser = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u._id === user._id);
      if (exists) {
        return prev.filter((u) => u._id !== user._id);
      }
      return [...prev, user];
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedUsers.length < 2) {
      toast.error('Select at least 2 participants for a group');
      return;
    }

    setIsCreating(true);
    try {
      const participantIds = selectedUsers.map((u) => u._id);
      const data = await chatService.createGroup(groupName.trim(), participantIds);
      if (data.chat) {
        addOrUpdateChat(data.chat);
        setActiveChatId(data.chat._id);
        toast.success(`Group "${groupName}" created!`);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create group:', err);
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
      subtitle="Gather your team or friends into a group conversation"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleCreateGroup} className="space-y-4">
        {/* Group Name Input */}
        <div>
          <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1.5">
            Group Name
          </label>
          <div className="relative">
            <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="e.g. Design Sync, Project Alpha"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-[#0B0E14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
              autoFocus
            />
          </div>
        </div>

        {/* Selected Participants Chips */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            {selectedUsers.map((u) => (
              <span
                key={u._id}
                className="inline-flex items-center gap-1.5 bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#C4B5FD] text-xs px-2.5 py-1 rounded-full"
              >
                {u.name}
                <button type="button" onClick={() => toggleUser(u)}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search Users Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        {/* Pickable Users List */}
        <div className="min-h-[160px] max-h-[220px] overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-[#94A3B8]">
              <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#64748B]">
              No contacts found
            </div>
          ) : (
            users.map((user) => {
              const isSelected = selectedUsers.some((u) => u._id === user._id);
              return (
                <div
                  key={user._id}
                  onClick={() => toggleUser(user)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#7C3AED]/15 border border-[#7C3AED]/30' : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar src={user.avatar} name={user.name} size="sm" isOnline={user.isOnline} />
                    <div>
                      <h5 className="text-xs font-semibold text-[#F8FAFC]">{user.name}</h5>
                      <p className="text-[11px] text-[#94A3B8]">{user.email}</p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                        : 'border-white/20'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full font-semibold"
          isLoading={isCreating}
          disabled={!groupName.trim() || selectedUsers.length < 2}
        >
          Create Group ({selectedUsers.length} selected)
        </Button>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;
