/**
 * Slider Component
 * Japanese-inspired range slider with optional value display
 */

import React, { useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';
import type { Size, Intent } from '../../types';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  showInput?: boolean;
  formatValue?: (value: number) => string;
  size?: Size;
  intent?: Intent;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const sizeClasses: Record<Size, { track: string; thumb: string; label: string }> = {
  sm: { track: 'h-1', thumb: 'w-3.5 h-3.5', label: 'text-sm' },
  md: { track: 'h-2', thumb: 'w-5 h-5', label: 'text-base' },
  lg: { track: 'h-3', thumb: 'w-6 h-6', label: 'text-lg' },
};

const intentClasses: Record<Intent, { fill: string; thumb: string; ring: string }> = {
  primary: {
    fill: 'bg-gradient-to-r from-amber-500 to-orange-500',
    thumb: 'border-amber-500 hover:border-amber-600',
    ring: 'focus:ring-amber-200',
  },
  secondary: {
    fill: 'bg-gradient-to-r from-indigo-500 to-purple-600',
    thumb: 'border-indigo-500 hover:border-indigo-600',
    ring: 'focus:ring-indigo-200',
  },
  accent: {
    fill: 'bg-gradient-to-r from-pink-400 to-rose-500',
    thumb: 'border-pink-500 hover:border-pink-600',
    ring: 'focus:ring-pink-200',
  },
  success: {
    fill: 'bg-gradient-to-r from-emerald-500 to-green-600',
    thumb: 'border-emerald-500 hover:border-emerald-600',
    ring: 'focus:ring-emerald-200',
  },
  error: {
    fill: 'bg-gradient-to-r from-red-500 to-rose-600',
    thumb: 'border-red-500 hover:border-red-600',
    ring: 'focus:ring-red-200',
  },
  danger: {
    fill: 'bg-gradient-to-r from-red-500 to-rose-600',
    thumb: 'border-red-500 hover:border-red-600',
    ring: 'focus:ring-red-200',
  },
};

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  showValue = false,
  showInput = false,
  formatValue = (v) => String(v),
  size = 'md',
  intent = 'primary',
  disabled = false,
  className,
  id,
}) => {
  const sizes = sizeClasses[size];
  const intents = intentClasses[intent];
  const sliderId = id || `slider-${React.useId()}`;
  const trackRef = useRef<HTMLDivElement>(null);

  // Calculate percentage for fill
  const percentage = ((value - min) / (max - min)) * 100;

  // Clamp value to valid range
  const clampValue = useCallback((v: number) => {
    const stepped = Math.round(v / step) * step;
    return Math.max(min, Math.min(max, stepped));
  }, [min, max, step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(clampValue(newValue));
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Label row */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label htmlFor={sliderId} className={cn('font-medium text-gray-900', sizes.label)}>
              {label}
            </label>
          )}
          {showValue && !showInput && (
            <span className={cn('font-medium text-gray-600', sizes.label)}>
              {formatValue(value)}
            </span>
          )}
          {showInput && (
            <input
              type="number"
              value={value}
              onChange={handleInputChange}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              className={cn(
                'w-16 px-2 py-1 text-center border border-gray-300 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400',
                'text-sm font-medium text-gray-700',
                disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
              )}
            />
          )}
        </div>
      )}

      {/* Slider track */}
      <div className="relative py-2">
        <div
          ref={trackRef}
          className={cn(
            'relative w-full rounded-full bg-gray-200',
            sizes.track,
            disabled && 'opacity-50'
          )}
        >
          {/* Fill track */}
          <div
            className={cn('absolute left-0 top-0 h-full rounded-full', intents.fill)}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Native range input (invisible, handles interactions) */}
        <input
          type="range"
          id={sliderId}
          value={value}
          onChange={(e) => onChange(clampValue(parseFloat(e.target.value)))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
            disabled && 'cursor-not-allowed'
          )}
          style={{ margin: 0 }}
        />

        {/* Custom thumb */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none',
            'rounded-full bg-white border-2 shadow-md transition-all duration-150',
            sizes.thumb,
            intents.thumb,
            disabled && 'opacity-50'
          )}
          style={{ left: `${percentage}%` }}
        />
      </div>

      {/* Min/Max labels (optional) */}
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};

export default Slider;
