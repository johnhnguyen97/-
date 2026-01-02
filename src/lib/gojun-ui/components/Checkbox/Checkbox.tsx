/**
 * Checkbox Component
 * Japanese-inspired checkbox with gradient selection states
 */

import React from 'react';
import { cn } from '../../utils/cn';
import type { Size, Intent } from '../../types';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  size?: Size;
  intent?: Intent;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
  id?: string;
}

const sizeClasses: Record<Size, { box: string; icon: string; label: string; desc: string }> = {
  sm: { box: 'w-4 h-4', icon: 'w-2.5 h-2.5', label: 'text-sm', desc: 'text-xs' },
  md: { box: 'w-5 h-5', icon: 'w-3 h-3', label: 'text-base', desc: 'text-sm' },
  lg: { box: 'w-6 h-6', icon: 'w-3.5 h-3.5', label: 'text-lg', desc: 'text-base' },
};

const intentClasses: Record<Intent, { checked: string; ring: string }> = {
  primary: {
    checked: 'bg-gradient-to-r from-amber-500 to-orange-500',
    ring: 'ring-amber-200',
  },
  secondary: {
    checked: 'bg-gradient-to-r from-indigo-500 to-purple-600',
    ring: 'ring-indigo-200',
  },
  accent: {
    checked: 'bg-gradient-to-r from-pink-400 to-rose-500',
    ring: 'ring-pink-200',
  },
  success: {
    checked: 'bg-gradient-to-r from-emerald-500 to-green-600',
    ring: 'ring-emerald-200',
  },
  error: {
    checked: 'bg-gradient-to-r from-red-500 to-rose-600',
    ring: 'ring-red-200',
  },
};

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  size = 'md',
  intent = 'primary',
  disabled = false,
  indeterminate = false,
  className,
  id,
}) => {
  const sizes = sizeClasses[size];
  const intents = intentClasses[intent];
  const checkboxId = id || `checkbox-${React.useId()}`;

  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleChange();
    }
  };

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        'inline-flex items-start gap-3 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onClick={handleChange}
        className={cn(
          'relative flex-shrink-0 flex items-center justify-center rounded-md border-2 transition-all duration-200',
          sizes.box,
          checked || indeterminate
            ? cn(intents.checked, 'border-transparent shadow-md')
            : 'bg-white border-gray-300 hover:border-gray-400',
          !disabled && 'focus:outline-none focus:ring-2 focus:ring-offset-2',
          !disabled && (checked || indeterminate) && intents.ring
        )}
      >
        {/* Checkmark icon */}
        {checked && !indeterminate && (
          <svg
            className={cn('text-white', sizes.icon)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}

        {/* Indeterminate icon */}
        {indeterminate && (
          <svg
            className={cn('text-white', sizes.icon)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12h14"
            />
          </svg>
        )}
      </div>

      {/* Label and description */}
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className={cn('font-medium text-gray-900', sizes.label)}>
              {label}
            </span>
          )}
          {description && (
            <span className={cn('text-gray-500 mt-0.5', sizes.desc)}>
              {description}
            </span>
          )}
        </div>
      )}

      {/* Hidden native checkbox for form compatibility */}
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={() => onChange(!checked)}
        disabled={disabled}
        className="sr-only"
      />
    </label>
  );
};

export default Checkbox;
