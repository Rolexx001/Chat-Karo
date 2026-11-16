import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  endIcon: EndIcon,
  onEndIconClick,
  className = '',
  wrapperClassName = '',
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${wrapperClassName}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-[#64748B] pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full bg-[#131720] border border-[rgba(255,255,255,0.08)] text-[#F8FAFC] placeholder-[#64748B] text-sm rounded-xl px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed ${
            Icon ? 'pl-9' : ''
          } ${EndIcon ? 'pr-9' : ''} ${error ? 'border-[#F43F5E] focus:border-[#F43F5E] focus:ring-[#F43F5E]' : ''} ${className}`}
          {...props}
        />
        {EndIcon && (
          <button
            type="button"
            tabIndex={-1}
            onClick={onEndIconClick}
            className={`absolute right-3 text-[#64748B] hover:text-[#E2E8F0] transition-colors flex items-center justify-center ${
              !onEndIconClick ? 'pointer-events-none' : 'cursor-pointer'
            }`}
          >
            <EndIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs text-[#F43F5E] mt-0.5">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
