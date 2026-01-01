import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  showValue?: boolean;
  showInput?: boolean;
  className?: string;
}

/**
 * Custom slider component with filled track and optional number input.
 * More stable than native range input, with visual design inspired by modern UI patterns.
 */
export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  showValue = true,
  showInput = true,
  className = '',
}) => {
  const { isDark } = useTheme();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Calculate percentage for filled track
  const percentage = ((localValue - min) / (max - min)) * 100;

  // Snap value to step
  const snapToStep = useCallback((val: number): number => {
    const snapped = Math.round((val - min) / step) * step + min;
    return Math.max(min, Math.min(max, snapped));
  }, [min, max, step]);

  // Get value from mouse/touch position
  const getValueFromPosition = useCallback((clientX: number): number => {
    if (!trackRef.current) return localValue;

    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const ratio = Math.max(0, Math.min(1, x / width));
    const rawValue = min + ratio * (max - min);

    return snapToStep(rawValue);
  }, [localValue, min, max, snapToStep]);

  // Handle mouse/touch start
  const handleStart = useCallback((clientX: number) => {
    setIsDragging(true);
    const newValue = getValueFromPosition(clientX);
    setLocalValue(newValue);
    onChange(newValue);
  }, [getValueFromPosition, onChange]);

  // Handle mouse/touch move
  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const newValue = getValueFromPosition(clientX);
    setLocalValue(newValue);
    onChange(newValue);
  }, [isDragging, getValueFromPosition, onChange]);

  // Handle mouse/touch end
  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  // Global mouse/touch move and end
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onMouseUp = () => handleEnd();
    const onTouchEnd = () => handleEnd();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = snapToStep(Number(e.target.value));
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Theme colors
  const trackBg = isDark ? 'bg-gray-700' : 'bg-gray-200';
  const filledBg = 'bg-gradient-to-r from-amber-500 to-orange-500';
  const thumbBorder = isDark ? 'border-gray-600' : 'border-gray-300';
  const textColor = isDark ? 'text-white' : 'text-gray-800';
  const mutedColor = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`${className}`}>
      {/* Label and Value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className={`text-lg font-semibold ${textColor}`}>{label}</span>
          )}
          {showValue && !showInput && (
            <span className="text-lg font-bold text-orange-500">{localValue}</span>
          )}
        </div>
      )}

      {/* Slider with optional input */}
      <div className="flex items-center gap-4">
        {/* Track container */}
        <div
          ref={trackRef}
          className="relative flex-1 h-10 flex items-center cursor-pointer select-none"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          {/* Background track */}
          <div className={`absolute inset-x-0 h-2 rounded-full ${trackBg}`} />

          {/* Filled track */}
          <div
            className={`absolute left-0 h-2 rounded-full ${filledBg} transition-all duration-75`}
            style={{ width: `${percentage}%` }}
          />

          {/* Thumb */}
          <div
            className={`absolute w-6 h-6 rounded-full bg-white border-2 ${thumbBorder} shadow-md transform -translate-x-1/2 transition-transform duration-75 ${
              isDragging ? 'scale-110 shadow-lg' : 'hover:scale-105'
            }`}
            style={{ left: `${percentage}%` }}
          >
            {/* Inner dot */}
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
          </div>
        </div>

        {/* Number input */}
        {showInput && (
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleInputChange}
            className={`w-16 h-10 px-2 text-center text-lg font-bold rounded-lg border-2 ${
              isDark
                ? 'bg-gray-800 border-gray-600 text-white focus:border-orange-500'
                : 'bg-white border-gray-300 text-gray-800 focus:border-orange-500'
            } focus:outline-none transition-colors`}
          />
        )}
      </div>

      {/* Min/Max labels */}
      <div className={`flex justify-between text-xs mt-1 ${mutedColor}`}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default Slider;
