import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Clean checkbox component with smooth animations.
 * Inspired by Material Design selection controls.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const { isDark } = useTheme();

  const sizes = {
    sm: { box: 'w-5 h-5', icon: 'w-3 h-3', text: 'text-sm' },
    md: { box: 'w-6 h-6', icon: 'w-4 h-4', text: 'text-base' },
    lg: { box: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-lg' },
  };

  const s = sizes[size];

  return (
    <label
      className={`inline-flex items-center gap-3 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`${s.box} rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
            checked
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent'
              : isDark
              ? 'bg-gray-800 border-gray-600 hover:border-gray-500'
              : 'bg-white border-gray-300 hover:border-gray-400'
          }`}
        >
          {/* Checkmark */}
          <svg
            className={`${s.icon} text-white transition-all duration-200 ${
              checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      {label && (
        <span className={`${s.text} ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
