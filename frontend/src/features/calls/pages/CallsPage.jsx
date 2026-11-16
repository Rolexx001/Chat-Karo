import React, { useEffect } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Loader2, Sparkles } from 'lucide-react';
import { useCallStore } from '../store/callStore.js';
import { useAuthStore } from '../../auth/store/authStore.js';
import Avatar from '../../../components/ui/Avatar.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { formatChatTime, formatCallDuration } from '../../../utils/formatDate.js';

export const CallsPage = () => {
  const { history, fetchHistory, isLoadingHistory, startCall } = useCallStore();
  const currentUserId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="flex-1 h-full bg-[#0B0E14] flex flex-col overflow-y-auto select-none">
      {/* Top Header */}
      <div className="p-6 md:p-8 border-b border-white/5 bg-[#0F131C] shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Call Logs & History</h2>
            <p className="text-xs text-[#94A3B8] mt-1">Direct WebRTC voice and video call records</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-6 md:p-8">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-24 text-[#7C3AED]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={Phone}
            title="No call logs"
            description="Your incoming, outgoing, and missed voice and video calls will appear here."
          />
        ) : (
          <div className="space-y-2.5">
            {history.map((call) => {
              const isOutgoing = call.caller?._id?.toString() === currentUserId?.toString();
              const peer = isOutgoing ? call.receiver : call.caller;
              const isMissed = call.status === 'missed';

              return (
                <div
                  key={call._id}
                  className="bg-[#131720] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar src={peer?.avatar} name={peer?.name} size="md" />

                    <div>
                      <h4 className="text-sm font-bold text-white">{peer?.name || 'Unknown User'}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#94A3B8]">
                        {isMissed ? (
                          <span className="flex items-center gap-1 text-[#F43F5E] font-medium">
                            <PhoneMissed className="w-3.5 h-3.5" /> Missed
                          </span>
                        ) : isOutgoing ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <PhoneOutgoing className="w-3.5 h-3.5" /> Outgoing
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[#06B6D4] font-medium">
                            <PhoneIncoming className="w-3.5 h-3.5" /> Incoming
                          </span>
                        )}

                        <span>•</span>
                        <span>{formatChatTime(call.startedAt || call.createdAt)}</span>

                        {call.duration > 0 && (
                          <>
                            <span>•</span>
                            <span>{formatCallDuration(call.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Call Back Actions */}
                  {peer?._id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startCall(peer._id, peer.name, peer.avatar, 'voice')}
                        title="Voice Call"
                        className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#06B6D4] hover:bg-white/5 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startCall(peer._id, peer.name, peer.avatar, 'video')}
                        title="Video Call"
                        className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#7C3AED] hover:bg-white/5 transition-colors"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallsPage;
