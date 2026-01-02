import React from 'react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Options to display */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'filled';
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
};

const errorStyles = [
  'border-red-500 focus:border-red-500 focus:ring-red-500/20',
  'dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400/20',
];

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      placeholder,
      size = 'md',
      variant = 'default',
      error = false,
      errorMessage,
      label,
      helperText,
      fullWidth = false,
      className,
      id,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'text-sm font-medium text-gray-700 dark:text-gray-300',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            value={value}
            className={cn(
              // Base
              'w-full outline-none transition-all duration-200 appearance-none cursor-pointer',
              'text-gray-900 dark:text-white',
              // Size
              sizeStyles[size],
              // Variant
              variantStyles[variant],
              // Error
              error && errorStyles,
              // Right padding for arrow
              'pr-10',
              // Placeholder style when no value
              !value && 'text-gray-400 dark:text-gray-500',
              // Disabled
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
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

Select.displayName = 'Select';

export default Select;
