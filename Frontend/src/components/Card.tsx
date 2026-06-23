import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  role?: string;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Reusable Card component for AgriFlux.
 * Standardizes sizes, shadows, padding, margins and responsiveness.
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  size = 'medium',
  role,
  tabIndex,
  onKeyDown,
}) => {
  const sizeClasses = {
    small: 'p-4 min-h-[100px] shadow-card',
    medium: 'p-6 min-h-[220px] shadow-card-hover',
    large: 'p-8 min-h-[380px] shadow-floating',
  };

  const baseClass = onClick ? 'card-clickable' : 'card';
  const computedClass = `${baseClass} ${sizeClasses[size]} ${className}`;

  return (
    <div
      className={computedClass}
      onClick={onClick}
      role={role || (onClick ? 'button' : undefined)}
      tabIndex={tabIndex ?? (onClick ? 0 : undefined)}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
};

export default Card;
