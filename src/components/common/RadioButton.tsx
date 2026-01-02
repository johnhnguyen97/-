import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface RadioButtonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Clean radio button with inner dot animation.
 * Inspired by Material Design selection controls.
 */
export const RadioButton: React.FC<RadioButtonProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const { isDark } = useTheme();

  const sizes = {
    sm: { outer: 'w-5 h-5', inner: 'w-2.5 h-2.5', text: 'text-sm' },
    md: { outer: 'w-6 h-6', inner: 'w-3 h-3', text: 'text-base' },
    lg: { outer: 'w-8 h-8', inner: 'w-4 h-4', text: 'text-lg' },
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
          type="radio"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`${s.outer} rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            checked
              ? 'border-indigo-500'
              : isDark
              ? 'border-gray-600 hover:border-gray-500'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {/* Inner dot */}
          <div
            className={`${s.inner} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 transition-all duration-200 ${
              checked ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`}
          />
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

interface RadioGroupProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  name: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * Radio group for selecting one option from multiple.
 */
export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  name,
  disabled = false,
  size = 'md',
  direction = 'horizontal',
  className = '',
}: RadioGroupProps<T>) {
  return (
    <div
      className={`flex ${direction === 'vertical' ? 'flex-col gap-2' : 'flex-row gap-4'} ${className}`}
      role="radiogroup"
      aria-label={name}
    >
      {options.map((option) => (
        <RadioButton
          key={option.value}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
          label={option.label}
          disabled={disabled}
          size={size}
        />
      ))}
    </div>
  );
}

export default RadioButton;
