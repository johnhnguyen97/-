import { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
  value: string; // Format: "HH:MM" (24-hour)
  onChange: (time: string) => void;
  label?: string;
  className?: string;
}

export function TimePicker({ value, onChange, label, className = '' }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const [hours, minutes] = value.split(':').map(Number);

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

  const handleHourChange = (newHour: number) => {
    const h = newHour.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    onChange(`${h}:${m}`);
  };

  const handleMinuteChange = (newMinute: number) => {
    const h = hours.toString().padStart(2, '0');
    const m = newMinute.toString().padStart(2, '0');
    onChange(`${h}:${m}`);
  };

  // Format for display
  const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

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
          <span className="text-gray-900 dark:text-gray-100 font-mono">{displayTime}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[200px]">
          <div className="flex gap-4">
            {/* Hours */}
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">Hour</div>
              <div className="h-48 overflow-y-auto scrollbar-thin">
                {Array.from({ length: 24 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleHourChange(i)}
                    className={`w-full py-1.5 text-center text-sm rounded transition-colors ${
                      i === hours
                        ? 'bg-indigo-500 text-white font-medium'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {i.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">Min</div>
              <div className="h-48 overflow-y-auto scrollbar-thin">
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleMinuteChange(m)}
                    className={`w-full py-1.5 text-center text-sm rounded transition-colors ${
                      m === minutes
                        ? 'bg-indigo-500 text-white font-medium'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {m.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick select buttons */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-1">
            {['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map((time) => (
              <button
                key={time}
                onClick={() => {
                  onChange(time);
                  setIsOpen(false);
                }}
                className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-300 transition-colors"
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
