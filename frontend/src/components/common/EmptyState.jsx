import React from 'react';
import { MessageSquareDashed } from 'lucide-react';
import Button from '../ui/Button.jsx';

export const EmptyState = ({
  icon: Icon = MessageSquareDashed,
  title = 'No items found',
  description = 'Get started by creating a new conversation or exploring contacts.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-[#181D28] border border-white/5 flex items-center justify-center text-[#7C3AED] mb-4 shadow-sm">
        <Icon className="w-8 h-8 opacity-80" />
      </div>
      <h3 className="text-base font-semibold text-[#F8FAFC] mb-1">{title}</h3>
      <p className="text-xs text-[#94A3B8] max-w-xs mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
