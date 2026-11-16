import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // primary, secondary, ghost, danger, outline
  size = 'md',        // sm, md, lg, icon
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0E14] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-glow-primary focus:ring-[#7C3AED] border border-transparent',
    secondary: 'bg-[#181D28] hover:bg-[#1F2432] text-[#F8FAFC] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] focus:ring-slate-500',
    ghost: 'bg-transparent hover:bg-[rgba(255,255,255,0.06)] text-[#94A3B8] hover:text-[#F8FAFC] focus:ring-slate-500',
    danger: 'bg-[#F43F5E] hover:bg-[#E11D48] text-white shadow-sm focus:ring-[#F43F5E] border border-transparent',
    outline: 'bg-transparent hover:bg-[#7C3AED]/10 text-[#A78BFA] border border-[#7C3AED]/40 hover:border-[#7C3AED] focus:ring-[#7C3AED]',
    cyan: 'bg-[#06B6D4] hover:bg-[#0891B2] text-black font-semibold shadow-glow-cyan focus:ring-[#06B6D4]',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
    icon: 'p-2 rounded-xl text-sm',
    'icon-sm': 'p-1.5 rounded-lg text-xs',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
