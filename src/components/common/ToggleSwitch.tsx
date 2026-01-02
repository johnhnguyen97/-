import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  labelPosition?: 'left' | 'right';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Toggle switch component with smooth sliding animation.
 * Inspired by iOS/Material Design toggle switches.
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  labelPosition = 'right',
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const { isDark } = useTheme();

  const sizes = {
    sm: { track: 'w-9 h-5', thumb: 'w-4 h-4', translate: 'translate-x-4', text: 'text-sm' },
    md: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'translate-x-6', text: 'text-base' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7', text: 'text-lg' },
  };

  const s = sizes[size];

  const trackColors = checked
    ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
    : isDark
    ? 'bg-gray-600'
    : 'bg-gray-300';

  const labelElement = label && (
    <span className={`${s.text} ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
      {label}
    </span>
  );

  return (
    <label
      className={`inline-flex items-center gap-3 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {labelPosition === 'left' && labelElement}

      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        {/* Track */}
        <div
          className={`${s.track} rounded-full transition-colors duration-200 ${trackColors}`}
        />
        {/* Thumb */}
        <div
          className={`absolute top-0.5 left-0.5 ${s.thumb} rounded-full bg-white shadow-md transition-transform duration-200 ${
            checked ? s.translate : 'translate-x-0'
          }`}
        />
      </div>

      {labelPosition === 'right' && labelElement}
    </label>
  );
};

export default ToggleSwitch;
