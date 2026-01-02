/**
 * Toggle Component
 * Japanese-inspired toggle switch with smooth animations
 */

import React from 'react';
import { cn } from '../../utils/cn';
import type { Size, Intent } from '../../types';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  labelPosition?: 'left' | 'right';
  size?: Size;
  intent?: Intent;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const sizeClasses: Record<Size, { track: string; thumb: string; translate: string; label: string }> = {
  sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4', label: 'text-sm' },
  md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5', label: 'text-base' },
  lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7', label: 'text-lg' },
};

const intentClasses: Record<Intent, { active: string; ring: string }> = {
  primary: {
    active: 'bg-gradient-to-r from-amber-500 to-orange-500',
    ring: 'ring-amber-200',
  },
  secondary: {
    active: 'bg-gradient-to-r from-indigo-500 to-purple-600',
    ring: 'ring-indigo-200',
  },
  accent: {
    active: 'bg-gradient-to-r from-pink-400 to-rose-500',
    ring: 'ring-pink-200',
  },
  success: {
    active: 'bg-gradient-to-r from-emerald-500 to-green-600',
    ring: 'ring-emerald-200',
  },
  error: {
    active: 'bg-gradient-to-r from-red-500 to-rose-600',
    ring: 'ring-red-200',
  },
};

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  labelPosition = 'right',
  size = 'md',
  intent = 'primary',
  disabled = false,
  className,
  id,
}) => {
  const sizes = sizeClasses[size];
  const intents = intentClasses[intent];
  const toggleId = id || `toggle-${React.useId()}`;

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

  const toggleElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onClick={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={cn(
        'relative inline-flex flex-shrink-0 rounded-full transition-all duration-200 ease-out',
        sizes.track,
        checked ? intents.active : 'bg-gray-200',
        !disabled && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2',
        !disabled && checked && intents.ring,
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Sliding thumb */}
      <span
        className={cn(
          'pointer-events-none absolute top-0.5 left-0.5 rounded-full bg-white shadow-md',
          'transition-transform duration-200 ease-out',
          sizes.thumb,
          checked && sizes.translate
        )}
      />
    </button>
  );

  if (!label) {
    return (
      <div className={className}>
        {toggleElement}
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={() => onChange(!checked)}
          disabled={disabled}
          className="sr-only"
        />
      </div>
    );
  }

  return (
    <label
      htmlFor={toggleId}
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {labelPosition === 'left' && (
        <span className={cn('font-medium text-gray-900', sizes.label)}>
          {label}
        </span>
      )}

      {toggleElement}

      {labelPosition === 'right' && (
        <span className={cn('font-medium text-gray-900', sizes.label)}>
          {label}
        </span>
      )}

      <input
        type="checkbox"
        id={toggleId}
        checked={checked}
        onChange={() => onChange(!checked)}
        disabled={disabled}
        className="sr-only"
      />
    </label>
  );
};

export default Toggle;
