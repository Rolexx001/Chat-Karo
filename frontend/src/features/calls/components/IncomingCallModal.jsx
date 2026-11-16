import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCallStore } from '../store/callStore.js';
import Avatar from '../../../components/ui/Avatar.jsx';

export const IncomingCallModal = () => {
  const { callState, callType, peerName, peerAvatar, acceptIncomingCall, rejectIncomingCall } = useCallStore();

  const isIncoming = callState === 'incoming';

  return (
    <AnimatePresence>
      {isIncoming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative w-full max-w-sm bg-[#151922] border border-white/10 rounded-3xl p-8 shadow-glass flex flex-col items-center text-center"
          >
            {/* Animated Ringing Ripple */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-[#7C3AED]/30 animate-ping" />
              <Avatar
                src={peerAvatar}
                name={peerName || 'Incoming Caller'}
                size="2xl"
                className="relative shadow-glow-primary"
              />
            </div>

            <h3 className="text-xl font-bold text-[#F8FAFC]">{peerName || 'Incoming Caller'}</h3>
            <p className="text-xs text-[#06B6D4] font-medium tracking-wide uppercase mt-1 flex items-center gap-1.5">
              {callType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              Incoming {callType} call...
            </p>

            {/* Accept / Decline Action Buttons */}
            <div className="flex items-center gap-8 mt-8">
              <button
                onClick={rejectIncomingCall}
                title="Decline"
                className="w-14 h-14 rounded-full bg-[#F43F5E] hover:bg-[#E11D48] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={acceptIncomingCall}
                title="Accept"
                className="w-14 h-14 rounded-full bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105 active:scale-95 animate-pulse"
              >
                <Phone className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default IncomingCallModal;
