
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, hoverable = true }) => {
  return (
    <div
      onClick={onClick}
      className={`
        glass rounded-3xl p-6 transition-all duration-300 
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
        ${hoverable && onClick ? 'hover:bg-white/20 hover:border-white/40' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
