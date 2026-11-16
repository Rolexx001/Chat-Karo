import React from 'react';

export const Skeleton = ({ className = '', rounded = 'rounded-md' }) => {
  return (
    <div className={`shimmer-effect bg-white/[0.04] ${rounded} ${className}`} />
  );
};

export default Skeleton;
