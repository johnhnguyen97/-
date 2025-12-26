import { useState, useRef, useEffect } from 'react';

interface DateRangePickerProps {
  startDate: string; // Format: "YYYY-MM-DD"
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  label?: string;
  className?: string;
}

// Preset options
const PRESETS = [
  { label: 'Next 7 days', days: 7 },
  { label: 'Next 14 days', days: 14 },
  { label: 'Next 30 days', days: 30 },
  { label: 'Next 60 days', days: 60 },
  { label: 'Next 90 days', days: 90 },
];

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  label,
  className = ''
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Apply preset
  const applyPreset = (days: number) => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + days);

    onStartChange(today.toISOString().split('T')[0]);
    onEndChange(end.toISOString().split('T')[0]);
  };

  // Calculate days between dates
  const daysBetween = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-900 dark:text-gray-100 text-sm">
            {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            ({daysBetween()} days)
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[300px]">
          {/* Manual date inputs */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndChange(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-xs text-gray-400">or quick select</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>

          {/* Presets */}
          <div className="space-y-1">
            {PRESETS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => {
                  applyPreset(days);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-300 transition-colors flex justify-between items-center"
              >
                <span>{label}</span>
                <span className="text-xs text-gray-400">{days} days</span>
              </button>
            ))}
          </div>

          {/* Done button */}
          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
