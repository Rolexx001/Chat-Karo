import React from 'react';
import { getFullMediaUrl } from '../../utils/constants.js';

export const Avatar = ({
  src,
  name = 'User',
  size = 'md', // sm, md, lg, xl, 2xl
  isOnline = false,
  showStatus = false,
  className = '',
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0 ring-1',
    md: 'w-2.5 h-2.5 bottom-0 right-0 ring-2',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 ring-2',
    xl: 'w-4 h-4 bottom-1 right-1 ring-2',
    '2xl': 'w-5 h-5 bottom-1 right-1 ring-4',
  };

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  // Generate consistent gradient for users without avatars
  const getGradient = (str) => {
    const gradients = [
      'from-violet-600 to-indigo-600',
      'from-blue-600 to-cyan-600',
      'from-emerald-600 to-teal-600',
      'from-rose-600 to-pink-600',
      'from-amber-600 to-orange-600',
      'from-fuchsia-600 to-purple-600',
    ];
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const fullSrc = getFullMediaUrl(src);

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {fullSrc ? (
        <img
          src={fullSrc}
          alt={name}
          className={`${sizes[size] || sizes.md} rounded-full object-cover border border-[rgba(255,255,255,0.08)] bg-[#181D28]`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex';
            }
          }}
        />
      ) : null}
      
      <div
        className={`${sizes[size] || sizes.md} rounded-full bg-gradient-to-tr ${getGradient(name)} text-white font-semibold items-center justify-center border border-[rgba(255,255,255,0.12)] shadow-sm ${
          fullSrc ? 'hidden' : 'flex'
        }`}
      >
        {getInitials(name)}
      </div>

      {showStatus && (
        <span
          className={`absolute rounded-full ring-[#0B0E14] ${statusSizes[size] || statusSizes.md} ${
            isOnline ? 'bg-[#10B981]' : 'bg-[#64748B]'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default Avatar;
