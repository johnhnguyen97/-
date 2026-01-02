/**
 * Button Component
 * Japanese-inspired button with multiple variants and sizes
 */

import React from 'react';
import { cn } from '../../utils/cn';
import type { Size, Intent } from '../../types';

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  intent?: Intent;
  size?: Size | 'xl';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const sizeClasses: Record<Size | 'xl', { button: string; icon: string }> = {
  sm: { button: 'h-8 px-3 text-sm gap-1.5', icon: 'w-4 h-4' },
  md: { button: 'h-10 px-4 text-base gap-2', icon: 'w-5 h-5' },
  lg: { button: 'h-12 px-6 text-lg gap-2', icon: 'w-5 h-5' },
  xl: { button: 'h-14 px-8 text-xl gap-3', icon: 'w-6 h-6' },
};

const variantClasses: Record<ButtonVariant, Record<Intent, string>> = {
  solid: {
    primary: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700',
    secondary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md hover:from-indigo-600 hover:to-purple-700 active:from-indigo-700 active:to-purple-800',
    accent: 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-md hover:from-pink-500 hover:to-rose-600 active:from-pink-600 active:to-rose-700',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md hover:from-emerald-600 hover:to-green-700 active:from-emerald-700 active:to-green-800',
    error: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md hover:from-red-600 hover:to-rose-700 active:from-red-700 active:to-rose-800',
  },
  outline: {
    primary: 'border-2 border-amber-500 text-amber-600 hover:bg-amber-50 active:bg-amber-100',
    secondary: 'border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100',
    accent: 'border-2 border-pink-500 text-pink-600 hover:bg-pink-50 active:bg-pink-100',
    success: 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100',
    error: 'border-2 border-red-500 text-red-600 hover:bg-red-50 active:bg-red-100',
  },
  ghost: {
    primary: 'text-amber-600 hover:bg-amber-50 active:bg-amber-100',
    secondary: 'text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100',
    accent: 'text-pink-600 hover:bg-pink-50 active:bg-pink-100',
    success: 'text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100',
    error: 'text-red-600 hover:bg-red-50 active:bg-red-100',
  },
  link: {
    primary: 'text-amber-600 hover:text-amber-700 hover:underline p-0 h-auto',
    secondary: 'text-indigo-600 hover:text-indigo-700 hover:underline p-0 h-auto',
    accent: 'text-pink-600 hover:text-pink-700 hover:underline p-0 h-auto',
    success: 'text-emerald-600 hover:text-emerald-700 hover:underline p-0 h-auto',
    error: 'text-red-600 hover:text-red-700 hover:underline p-0 h-auto',
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

export const Button: React.FC<ButtonProps> = ({
  variant = 'solid',
  intent = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
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
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        variant !== 'link' && sizes.button,
        variantIntentClass,
        fullWidth && 'w-full',
        isDisabled && 'opacity-50 cursor-not-allowed',
        !isDisabled && 'hover:scale-[1.02] active:scale-[0.98]',
        variant === 'solid' && 'focus:ring-amber-300',
        variant === 'outline' && 'focus:ring-current/30',
        className
      )}
    >
      {/* Loading spinner or left icon */}
      {isLoading ? (
        <LoadingSpinner className={sizes.icon} />
      ) : leftIcon ? (
        <span className={cn('flex-shrink-0', sizes.icon)}>{leftIcon}</span>
      ) : null}

      {/* Children */}
      <span className={isLoading ? 'opacity-0' : undefined}>{children}</span>

      {/* Loading text overlay */}
      {isLoading && (
        <span className="absolute">{children}</span>
      )}

      {/* Right icon */}
      {rightIcon && !isLoading && (
        <span className={cn('flex-shrink-0', sizes.icon)}>{rightIcon}</span>
      )}
    </button>
  );
};

export default Button;
