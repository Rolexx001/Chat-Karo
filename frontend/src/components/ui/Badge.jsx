import React from 'react';

export const Badge = ({
  children,
  variant = 'primary', // primary, cyan, emerald, danger, gray
  size = 'md',
  className = '',
}) => {
  const variants = {
    primary: 'bg-[#7C3AED]/20 text-[#C4B5FD] border border-[#7C3AED]/30',
    cyan: 'bg-[#06B6D4]/20 text-[#67E8F9] border border-[#06B6D4]/30',
    emerald: 'bg-[#10B981]/20 text-[#6EE7B7] border border-[#10B981]/30',
    danger: 'bg-[#F43F5E]/20 text-[#FDA4AF] border border-[#F43F5E]/30',
    gray: 'bg-white/5 text-[#94A3B8] border border-white/10',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2 py-0.5 rounded-full font-semibold',
    count: 'min-w-[18px] h-[18px] text-[10px] px-1 rounded-full flex items-center justify-center font-bold',
  };

  return (
    <span className={`inline-flex items-center justify-center leading-none ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
