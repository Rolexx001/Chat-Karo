import React, { useEffect, useState } from 'react';
import { Plus, CircleDot, Eye, Sparkles, Loader2 } from 'lucide-react';
import { useStatusStore } from '../store/statusStore.js';
import { useAuthStore } from '../../auth/store/authStore.js';
import CreateStatusModal from '../components/CreateStatusModal.jsx';
import StatusViewerModal from '../components/StatusViewerModal.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import Button from '../../../components/ui/Button.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { formatChatTime } from '../../../utils/formatDate.js';

export const StatusPage = () => {
  const { feed, myStatuses, fetchFeed, openViewer, isLoading } = useStatusStore();
  const currentUser = useAuthStore((s) => s.user);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Group feed statuses by user
  const groupedFeed = feed.reduce((acc, status) => {
    const userId = status.user?._id;
    if (!userId) return acc;
    if (!acc[userId]) {
      acc[userId] = {
        user: status.user,
        statuses: [],
      };
    }
    acc[userId].statuses.push(status);
    return acc;
  }, {});

  const contactStories = Object.values(groupedFeed);

  return (
    <div className="flex-1 h-full bg-[#0B0E14] flex flex-col overflow-y-auto select-none">
      {/* Top Header */}
      <div className="p-6 md:p-8 border-b border-white/5 bg-[#0F131C] shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">24-Hour Stories</h2>
            <p className="text-xs text-[#94A3B8] mt-1">Photos and video moments that disappear after 24 hours</p>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            size="md"
            className="shadow-glow-primary"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Post Story
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-6 md:p-8 space-y-8">
        {/* My Status Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-3">My Story</h3>
          <div className="bg-[#131720] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <Avatar
                  src={currentUser?.avatar}
                  name={currentUser?.name}
                  size="lg"
                  className={myStatuses.length > 0 ? 'ring-2 ring-[#7C3AED] ring-offset-2 ring-offset-[#0B0E14]' : ''}
                />
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center ring-2 ring-[#0B0E14]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white">My Status</h4>
                <p className="text-xs text-[#94A3B8]">
                  {myStatuses.length > 0
                    ? `${myStatuses.length} active updates`
                    : 'Tap + to share an update with your contacts'}
                </p>
              </div>
            </div>

            {myStatuses.length > 0 && (
              <Button
                onClick={() => openViewer(myStatuses, 0)}
                variant="secondary"
                size="sm"
              >
                View My Stories
              </Button>
            )}
          </div>
        </div>

        {/* Recent Updates from Contacts */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-3">Recent Updates</h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-[#7C3AED]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : contactStories.length === 0 ? (
            <EmptyState
              icon={CircleDot}
              title="No recent stories"
              description="When your contacts post updates, they will appear here."
              actionLabel="Post Your Own"
              onAction={() => setIsCreateModalOpen(true)}
              className="py-12 bg-[#131720]/40 rounded-2xl border border-white/5"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {contactStories.map((group) => {
                const latestStory = group.statuses[group.statuses.length - 1];
                return (
                  <div
                    key={group.user._id}
                    onClick={() => openViewer(group.statuses, 0)}
                    className="p-4 rounded-2xl bg-[#131720] border border-white/5 hover:border-[#7C3AED]/40 hover:shadow-glow-primary/10 cursor-pointer transition-all flex items-center gap-3.5 group"
                  >
                    <div className="relative">
                      <Avatar
                        src={group.user.avatar}
                        name={group.user.name}
                        size="md"
                        className="ring-2 ring-[#7C3AED] ring-offset-2 ring-offset-[#0B0E14]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#C4B5FD] truncate">
                        {group.user.name}
                      </h4>
                      <p className="text-[11px] text-[#94A3B8]">
                        {formatChatTime(latestStory?.createdAt)} • {group.statuses.length} updates
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateStatusModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <StatusViewerModal />
    </div>
  );
};

export default StatusPage;
