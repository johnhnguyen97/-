import { useState, useEffect, useRef } from 'react';

interface KanjiSearchProps {
  value: string;
  onChange: (query: string) => void;
  isLoading: boolean;
  isDark: boolean;
}

export function KanjiSearch({ value, onChange, isLoading, isDark }: KanjiSearchProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localValue, onChange]);

  // Sync external value changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const theme = {
    input: isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-amber-500/50 focus:ring-amber-500/20'
      : 'bg-white border-stone-200 text-gray-800 placeholder-gray-400 focus:border-amber-500 focus:ring-amber-200',
    icon: isDark ? 'text-gray-500' : 'text-gray-400',
    clearBtn: isDark
      ? 'text-gray-500 hover:text-gray-300 hover:bg-white/10'
      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
  };

  return (
    <div className="relative">
      {/* Search Icon */}
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${theme.icon}`}>
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Search kanji, reading, or meaning..."
        className={`w-full pl-12 pr-12 py-4 text-lg rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 ${theme.input}`}
      />

      {/* Clear Button */}
      {localValue && (
        <button
          onClick={handleClear}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${theme.clearBtn}`}
          aria-label="Clear search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Search hints */}
      <div className={`mt-2 flex flex-wrap gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <span className="flex items-center gap-1">
          <kbd className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>日</kbd>
          <span>Character</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>にち</kbd>
          <span>Reading</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>sun</kbd>
          <span>Meaning</span>
        </span>
      </div>
    </div>
  );
}
