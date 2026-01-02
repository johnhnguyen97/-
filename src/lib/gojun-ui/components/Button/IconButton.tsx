/**
 * IconButton Component
 * Square button designed for icon-only content
 */

import React from 'react';
import { cn } from '../../utils/cn';
import type { Size, Intent } from '../../types';
import type { ButtonVariant } from './Button';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  intent?: Intent;
  size?: Size | 'xl';
  isLoading?: boolean;
  'aria-label': string; // Required for accessibility
}

const sizeClasses: Record<Size | 'xl', { button: string; icon: string }> = {
  sm: { button: 'w-8 h-8', icon: 'w-4 h-4' },
  md: { button: 'w-10 h-10', icon: 'w-5 h-5' },
  lg: { button: 'w-12 h-12', icon: 'w-6 h-6' },
  xl: { button: 'w-14 h-14', icon: 'w-7 h-7' },
};

const variantClasses: Record<ButtonVariant, Record<Intent, string>> = {
  solid: {
    primary: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700',
    secondary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md hover:from-indigo-600 hover:to-purple-700',
    accent: 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-md hover:from-pink-500 hover:to-rose-600',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md hover:from-emerald-600 hover:to-green-700',
    error: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md hover:from-red-600 hover:to-rose-700',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md hover:from-red-600 hover:to-rose-700',
  },
  outline: {
    primary: 'border-2 border-amber-500 text-amber-600 hover:bg-amber-50 active:bg-amber-100',
    secondary: 'border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100',
    accent: 'border-2 border-pink-500 text-pink-600 hover:bg-pink-50 active:bg-pink-100',
    success: 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100',
    error: 'border-2 border-red-500 text-red-600 hover:bg-red-50 active:bg-red-100',
    danger: 'border-2 border-red-500 text-red-600 hover:bg-red-50 active:bg-red-100',
  },
  ghost: {
    primary: 'text-amber-600 hover:bg-amber-50 active:bg-amber-100',
    secondary: 'text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100',
    accent: 'text-pink-600 hover:bg-pink-50 active:bg-pink-100',
    success: 'text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100',
    error: 'text-red-600 hover:bg-red-50 active:bg-red-100',
    danger: 'text-red-600 hover:bg-red-50 active:bg-red-100',
  },
  link: {
    primary: 'text-amber-600 hover:text-amber-700',
    secondary: 'text-indigo-600 hover:text-indigo-700',
    accent: 'text-pink-600 hover:text-pink-700',
    success: 'text-emerald-600 hover:text-emerald-700',
    error: 'text-red-600 hover:text-red-700',
    danger: 'text-red-600 hover:text-red-700',
  },
};

const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  intent = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const sizes = sizeClasses[size];
  const variantIntentClass = variantClasses[variant][intent];
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-300',
        sizes.button,
        variantIntentClass,
        isDisabled && 'opacity-50 cursor-not-allowed',
        !isDisabled && 'hover:scale-105 active:scale-95',
        className
      )}
    >
      {isLoading ? (
        <LoadingSpinner className={sizes.icon} />
      ) : (
        <span className={sizes.icon}>{icon}</span>
      )}
    </button>
  );
};

export default IconButton;
