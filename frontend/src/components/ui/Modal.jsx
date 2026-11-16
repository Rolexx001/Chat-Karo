import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
  showClose = true,
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full ${maxWidth} bg-[#151922] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-glass overflow-hidden flex flex-col max-h-[90vh] ${className}`}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] shrink-0">
                <div>
                  {title && <h3 className="text-base font-semibold text-[#F8FAFC]">{title}</h3>}
                  {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="text-[#64748B] hover:text-[#E2E8F0] p-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
