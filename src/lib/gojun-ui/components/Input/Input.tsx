import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'filled' | 'underline';
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Left icon/addon */
  leftIcon?: React.ReactNode;
  /** Right icon/addon */
  rightIcon?: React.ReactNode;
  /** Full width */
  fullWidth?: boolean;
}

const sizeStyles = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-base rounded-xl',
  lg: 'h-12 px-5 text-lg rounded-xl',
};

const variantStyles = {
  default: [
    'border-2 border-gray-200',
    'bg-white',
    'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
    'dark:bg-gray-800 dark:border-gray-700',
    'dark:focus:border-amber-400 dark:focus:ring-amber-400/20',
  ],
  filled: [
    'border-2 border-transparent',
    'bg-gray-100',
    'focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
    'dark:bg-gray-800',
    'dark:focus:bg-gray-900 dark:focus:border-amber-400 dark:focus:ring-amber-400/20',
  ],
  underline: [
    'border-0 border-b-2 border-gray-200',
    'bg-transparent rounded-none px-0',
    'focus:border-amber-500',
    'dark:border-gray-700',
    'dark:focus:border-amber-400',
  ],
};

const errorStyles = [
  'border-red-500 focus:border-red-500 focus:ring-red-500/20',
  'dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400/20',
];

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'default',
      error = false,
      errorMessage,
      label,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium text-gray-700 dark:text-gray-300',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              // Base
              'w-full outline-none transition-all duration-200',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'text-gray-900 dark:text-white',
              // Size
              sizeStyles[size],
              // Variant
              variantStyles[variant],
              // Error
              error && errorStyles,
              // Icons padding
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              // Disabled
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>

        {(errorMessage || helperText) && (
          <p
            className={cn(
              'text-xs',
              error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error ? errorMessage : helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea variant
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Full width */
  fullWidth?: boolean;
}

const textareaSizeStyles = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-4 py-3 text-base rounded-xl',
  lg: 'px-5 py-4 text-lg rounded-xl',
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      error = false,
      errorMessage,
      label,
      helperText,
      fullWidth = false,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'text-sm font-medium text-gray-700 dark:text-gray-300',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={cn(
            // Base
            'w-full outline-none transition-all duration-200 resize-none',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'text-gray-900 dark:text-white',
            'border-2 border-gray-200 bg-white',
            'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
            'dark:bg-gray-800 dark:border-gray-700',
            'dark:focus:border-amber-400 dark:focus:ring-amber-400/20',
            // Size
            textareaSizeStyles[size],
            // Error
            error && errorStyles,
            // Disabled
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />

        {(errorMessage || helperText) && (
          <p
            className={cn(
              'text-xs',
              error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error ? errorMessage : helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
