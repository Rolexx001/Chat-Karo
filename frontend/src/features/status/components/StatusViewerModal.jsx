import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { useStatusStore } from '../store/statusStore.js';
import { useAuthStore } from '../../auth/store/authStore.js';
import { getFullMediaUrl } from '../../../utils/constants.js';
import Avatar from '../../../components/ui/Avatar.jsx';
import { formatChatTime } from '../../../utils/formatDate.js';

export const StatusViewerModal = () => {
  const { isViewerOpen, activeUserStories, activeStoryIndex, closeViewer, deleteStatus } = useStatusStore();
  const currentUserId = useAuthStore((s) => s.user?._id);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(activeStoryIndex || 0);
  }, [activeStoryIndex, isViewerOpen]);

  // Auto advance every 5s
  useEffect(() => {
    if (!isViewerOpen || !activeUserStories || activeUserStories.length === 0) return;

    const timer = setTimeout(() => {
      if (currentIndex < activeUserStories.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        closeViewer();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, isViewerOpen, activeUserStories, closeViewer]);

  if (!isViewerOpen || !activeUserStories || activeUserStories.length === 0) return null;

  const currentStory = activeUserStories[currentIndex];
  const user = currentStory?.user || {};
  const isMine = user._id === currentUserId;
  const fullUrl = getFullMediaUrl(currentStory?.mediaUrl);
  const isVideo = fullUrl && /\.(mp4|webm|mov)$/i.test(fullUrl);

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < activeUserStories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      closeViewer();
    }
  };

  const handleDelete = () => {
    if (currentStory?._id) {
      deleteStatus(currentStory._id);
      closeViewer();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none">
        {/* Close Button */}
        <button
          onClick={closeViewer}
          className="absolute top-4 right-4 z-40 p-2 text-white/70 hover:text-white rounded-full bg-black/40 backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Container */}
        <div className="relative w-full max-w-md h-full max-h-[85vh] flex flex-col justify-between overflow-hidden rounded-3xl bg-[#0B0E14] border border-white/10 shadow-2xl">
          {/* Top Progress Bars */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
            {activeUserStories.map((s, idx) => (
              <div key={s._id || idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-pulse' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* User Info Bar */}
          <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <Avatar src={user.avatar} name={user.name} size="sm" />
              <div>
                <h4 className="text-xs font-bold">{user.name}</h4>
                <p className="text-[10px] text-white/70">{formatChatTime(currentStory?.createdAt)}</p>
              </div>
            </div>

            {isMine && (
              <button
                onClick={handleDelete}
                title="Delete Story"
                className="p-1.5 text-white/70 hover:text-[#F43F5E] rounded-lg bg-black/40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Media Center Viewport */}
          <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
            {isVideo ? (
              <video src={fullUrl} autoPlay loop playsInline className="w-full h-full object-contain" />
            ) : (
              <img src={fullUrl} alt="Story" className="w-full h-full object-contain" />
            )}

            {/* Click Navigation Overlays */}
            <div onClick={handlePrev} className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-20" />
            <div onClick={handleNext} className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-20" />

            {/* Arrow Nav Buttons */}
            {currentIndex > 0 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 text-white/60 hover:text-white bg-black/40 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {currentIndex < activeUserStories.length - 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 text-white/60 hover:text-white bg-black/40 rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Bottom Caption & Viewers Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-col gap-2">
            {currentStory?.caption && (
              <div className="p-3 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs leading-relaxed text-center">
                {currentStory.caption}
              </div>
            )}

            {isMine && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-white/80 py-1 bg-black/40 backdrop-blur-sm rounded-lg">
                <Eye className="w-3.5 h-3.5" />
                <span>{currentStory?.viewers?.length || 0} views</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default StatusViewerModal;
