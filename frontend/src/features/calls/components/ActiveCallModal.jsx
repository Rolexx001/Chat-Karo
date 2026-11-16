import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useCallStore } from '../store/callStore.js';
import Avatar from '../../../components/ui/Avatar.jsx';
import { formatCallDuration } from '../../../utils/formatDate.js';

export const ActiveCallModal = () => {
  const {
    callState,
    callType,
    peerName,
    peerAvatar,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    endCall,
    setDuration,
  } = useCallStore();

  const [seconds, setSeconds] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const isActive = callState === 'calling' || callState === 'connected';

  // Timer counter
  useEffect(() => {
    let timer = null;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          setDuration(next);
          return next;
        });
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState, setDuration]);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isActive]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-4xl h-[80vh] bg-[#131720] border border-white/10 rounded-3xl overflow-hidden shadow-glass flex flex-col"
          >
            {/* Top Bar with Info & Duration */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0B0E14]/60 z-10">
              <div className="flex items-center gap-3">
                <Avatar src={peerAvatar} name={peerName} size="sm" />
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">{peerName}</h4>
                  <p className="text-xs text-[#94A3B8]">
                    {callState === 'calling' ? 'Calling...' : formatCallDuration(seconds)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  {callType} call
                </span>
              </div>
            </div>

            {/* Video Viewports Area */}
            <div className="relative flex-1 bg-[#0B0E14] flex items-center justify-center overflow-hidden">
              {/* Remote Stream View */}
              {callType === 'video' && remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <Avatar src={peerAvatar} name={peerName} size="2xl" className="shadow-glow-primary" />
                  <div>
                    <h3 className="text-xl font-bold text-white">{peerName}</h3>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      {callState === 'calling' ? 'Waiting for answer...' : 'Audio connected'}
                    </p>
                  </div>
                </div>
              )}

              {/* Local Stream Picture-in-Picture */}
              {callType === 'video' && localStream && (
                <div className="absolute top-4 right-4 w-40 h-28 sm:w-52 sm:h-36 rounded-2xl border border-white/20 overflow-hidden shadow-2xl bg-black">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {isVideoOff && (
                    <div className="absolute inset-0 bg-[#181D28] flex items-center justify-center text-xs text-[#94A3B8]">
                      Camera off
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Control Actions Bottom Bar */}
            <div className="flex items-center justify-center gap-5 py-5 bg-[#0B0E14]/80 border-t border-white/5 z-10">
              {/* Mute Toggle */}
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isMuted ? 'bg-[#F43F5E] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle (only for video calls) */}
              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isVideoOff ? 'bg-[#F43F5E] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-[#F43F5E] hover:bg-[#E11D48] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ActiveCallModal;
