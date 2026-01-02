/**
 * Chip Component
 * Japanese-inspired selection chips with gradient states
 */

import React from 'react';
import { cn } from '../../utils/cn';
import type { Size, Intent } from '../../types';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  icon?: React.ReactNode;
  size?: Size;
  intent?: Intent;
  outlined?: boolean;
  disabled?: boolean;
  className?: string;
}

const sizeClasses: Record<Size, { chip: string; icon: string; deleteBtn: string }> = {
  sm: { chip: 'h-6 px-2.5 text-xs gap-1', icon: 'w-3 h-3', deleteBtn: 'w-3.5 h-3.5' },
  md: { chip: 'h-8 px-3 text-sm gap-1.5', icon: 'w-4 h-4', deleteBtn: 'w-4 h-4' },
  lg: { chip: 'h-10 px-4 text-base gap-2', icon: 'w-5 h-5', deleteBtn: 'w-5 h-5' },
};

const intentClasses: Record<Intent, {
  default: string;
  selected: string;
  outlined: string;
  outlinedSelected: string;
}> = {
  primary: {
    default: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    selected: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md',
    outlined: 'border-amber-300 text-amber-700 hover:bg-amber-50',
    outlinedSelected: 'border-amber-500 bg-amber-50 text-amber-700',
  },
  secondary: {
    default: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    selected: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md',
    outlined: 'border-indigo-300 text-indigo-700 hover:bg-indigo-50',
    outlinedSelected: 'border-indigo-500 bg-indigo-50 text-indigo-700',
  },
  accent: {
    default: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
    selected: 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-md',
    outlined: 'border-pink-300 text-pink-700 hover:bg-pink-50',
    outlinedSelected: 'border-pink-500 bg-pink-50 text-pink-700',
  },
  success: {
    default: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    selected: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md',
    outlined: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
    outlinedSelected: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  },
  error: {
    default: 'bg-red-100 text-red-700 hover:bg-red-200',
    selected: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md',
    outlined: 'border-red-300 text-red-700 hover:bg-red-50',
    outlinedSelected: 'border-red-500 bg-red-50 text-red-700',
  },
};

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  onDelete,
  icon,
  size = 'md',
  intent = 'primary',
  outlined = false,
  disabled = false,
  className,
}) => {
  const sizes = sizeClasses[size];
  const intents = intentClasses[intent];

  const getVariantClass = () => {
    if (outlined) {
      return selected ? intents.outlinedSelected : intents.outlined;
    }
    return selected ? intents.selected : intents.default;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onDelete) {
      onDelete();
    }
  };

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && onClick) {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all duration-200 select-none',
        sizes.chip,
        getVariantClass(),
        outlined && 'border-2 bg-transparent',
        onClick && !disabled && 'cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <span className={cn('flex-shrink-0', sizes.icon)}>
          {icon}
        </span>
      )}

      {/* Label */}
      <span className="truncate">{label}</span>

      {/* Delete button */}
      {onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={disabled}
          className={cn(
            'flex-shrink-0 rounded-full p-0.5 transition-colors',
            'hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-current',
            sizes.deleteBtn
          )}
        >
          <svg
            className="w-full h-full"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};

export default Chip;
