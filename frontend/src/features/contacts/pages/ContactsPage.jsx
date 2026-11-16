import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, MessageSquarePlus, Phone, Video, ShieldAlert, Ban, Check } from 'lucide-react';
import { userService } from '../services/userService.js';
import { chatService } from '../../chats/services/chatService.js';
import { authService } from '../../auth/services/authService.js';
import { useChatStore } from '../../chats/store/chatStore.js';
import { useCallStore } from '../../calls/store/callStore.js';
import Avatar from '../../../components/ui/Avatar.jsx';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import { toast } from 'sonner';

export const ContactsPage = () => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportModalUser, setReportModalUser] = useState(null);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDesc, setReportDesc] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const navigate = useNavigate();
  const { addOrUpdateChat, setActiveChatId, onlineUsers } = useChatStore();
  const startCall = useCallStore((s) => s.startCall);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await userService.search(query);
        setUsers(data.users || []);
      } catch (err) {
        console.error('Failed to search contacts:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleStartChat = async (user) => {
    try {
      const data = await chatService.createOneToOne(user._id);
      if (data.chat) {
        addOrUpdateChat(data.chat);
        setActiveChatId(data.chat._id);
        navigate('/chats');
      }
    } catch (e) {
      toast.error('Failed to open chat');
    }
  };

  const handleBlockUser = async (user) => {
    try {
      await authService.blockUser(user._id);
      toast.success(`Blocked ${user.name}`);
    } catch (e) {
      toast.error('Failed to block user');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportModalUser) return;
    setIsReporting(true);
    try {
      await authService.reportUser({
        reportedUserId: reportModalUser._id,
        reason: reportReason,
        description: reportDesc,
        blockUser: true,
      });
      toast.success(`Report submitted and user blocked`);
      setReportModalUser(null);
      setReportDesc('');
    } catch (e) {
      toast.error('Failed to submit report');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="flex-1 h-full bg-[#0B0E14] flex flex-col overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-6 md:p-8 border-b border-white/5 bg-[#0F131C] shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Contacts & Directory</h2>
              <p className="text-xs text-[#94A3B8] mt-1">Discover team members and start direct conversations</p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#181D28] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-[#7C3AED]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-[#64748B] text-sm">
              No contacts found matching "{query}"
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="bg-[#131720] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-glass group"
                >
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="lg"
                      isOnline={Boolean(user._id && onlineUsers.has(user._id.toString()))}
                      showStatus={true}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
                      <p className="text-xs text-[#94A3B8] truncate">{user.email}</p>
                      <p className="text-[11px] text-[#64748B] mt-1.5 line-clamp-1 italic">
                        {user.bio || 'Chat Karo member'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Button
                        onClick={() => handleStartChat(user)}
                        variant="primary"
                        size="sm"
                        className="gap-1.5"
                      >
                        <MessageSquarePlus className="w-4 h-4" /> Message
                      </Button>

                      <button
                        onClick={() => startCall(user._id, user.name, user.avatar, 'voice')}
                        title="Voice Call"
                        className="p-2 rounded-xl text-[#94A3B8] hover:text-[#06B6D4] hover:bg-white/5 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => startCall(user._id, user.name, user.avatar, 'video')}
                        title="Video Call"
                        className="p-2 rounded-xl text-[#94A3B8] hover:text-[#7C3AED] hover:bg-white/5 transition-colors"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleBlockUser(user)}
                        title="Block User"
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F43F5E] hover:bg-white/5 transition-colors"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReportModalUser(user)}
                        title="Report User"
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F59E0B] hover:bg-white/5 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report User Modal */}
      <Modal
        isOpen={Boolean(reportModalUser)}
        onClose={() => setReportModalUser(null)}
        title={`Report ${reportModalUser?.name}`}
        subtitle="Help keep Chat Karo safe and trusted"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1.5">
              Reason
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
            >
              <option value="spam">Spam or unwanted advertising</option>
              <option value="abuse">Abuse or harassment</option>
              <option value="harassment">Harassment or threats</option>
              <option value="inappropriate_content">Inappropriate content</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Provide any additional context..."
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] resize-none"
            />
          </div>

          <Button
            type="submit"
            variant="danger"
            className="w-full font-semibold"
            isLoading={isReporting}
          >
            Submit Report & Block User
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default ContactsPage;
