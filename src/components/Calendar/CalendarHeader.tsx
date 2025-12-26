import type { JLPTLevel } from '../../types/calendar';

type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

interface CalendarHeaderProps {
  currentView: CalendarViewType;
  jlptLevel: JLPTLevel;
  onViewChange: (view: CalendarViewType) => void;
  onJlptChange: (level: JLPTLevel) => void;
  onClose: () => void;
}

const VIEW_OPTIONS: { value: CalendarViewType; label: string; shortLabel: string }[] = [
  { value: 'dayGridMonth', label: 'Month', shortLabel: 'M' },
  { value: 'timeGridWeek', label: 'Week', shortLabel: 'W' },
  { value: 'timeGridDay', label: 'Day', shortLabel: 'D' }
];

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export function CalendarHeader({
  currentView,
  jlptLevel,
  onViewChange,
  onJlptChange,
  onClose
}: CalendarHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
      {/* Left: Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span className="text-xl sm:text-2xl">📅</span>
        <h2 className="text-lg sm:text-xl font-bold text-white truncate">
          Japanese Learning Calendar
        </h2>
      </div>

      {/* Center: View Switcher */}
      <div className="hidden sm:flex items-center bg-white/20 rounded-lg p-1">
        {VIEW_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onViewChange(value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              currentView === value
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mobile View Switcher */}
      <div className="flex sm:hidden items-center bg-white/20 rounded-lg p-1">
        {VIEW_OPTIONS.map(({ value, shortLabel }) => (
          <button
            key={value}
            onClick={() => onViewChange(value)}
            className={`px-2 py-1 text-sm font-medium rounded-md transition-all ${
              currentView === value
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            {shortLabel}
          </button>
        ))}
      </div>

      {/* Right: JLPT Level & Close */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* JLPT Level Selector */}
        <select
          value={jlptLevel}
          onChange={(e) => onJlptChange(e.target.value as JLPTLevel)}
          className="bg-white/20 text-white border-0 rounded-lg px-2 sm:px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-white/50 cursor-pointer appearance-none"
          style={{ backgroundImage: 'none' }}
        >
          {JLPT_LEVELS.map((level) => (
            <option key={level} value={level} className="text-gray-900">
              {level}
            </option>
          ))}
        </select>

        {/* Legend Button (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-white/80">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-indigo-500 to-purple-500"></span>
            Word
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-purple-500 to-pink-500"></span>
            Kanji
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-orange-500"></span>
            Holiday
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Close calendar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
