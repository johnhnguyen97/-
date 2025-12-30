import type { JLPTLevel } from '../../types/calendar';

type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

interface CalendarHeaderProps {
  currentView: CalendarViewType;
  jlptLevel: JLPTLevel;
  onViewChange: (view: CalendarViewType) => void;
  onJlptChange: (level: JLPTLevel) => void;
  onClose?: () => void;
  showWOTD?: boolean;
  showKOTD?: boolean;
  onToggleWOTD?: () => void;
  onToggleKOTD?: () => void;
}

const VIEW_OPTIONS: { value: CalendarViewType; label: string; labelJp: string; shortLabel: string }[] = [
  { value: 'dayGridMonth', label: 'Month', labelJp: '月', shortLabel: '月' },
  { value: 'timeGridWeek', label: 'Week', labelJp: '週', shortLabel: '週' },
  { value: 'timeGridDay', label: 'Day', labelJp: '日', shortLabel: '日' }
];

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export function CalendarHeader({
  currentView,
  jlptLevel,
  onViewChange,
  onJlptChange,
  onClose,
  showWOTD = true,
  showKOTD = true,
  onToggleWOTD,
  onToggleKOTD
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
        {VIEW_OPTIONS.map(({ value, label, labelJp }) => (
          <button
            key={value}
            onClick={() => onViewChange(value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              currentView === value
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-base mr-1">{labelJp}</span>
            <span className="text-xs opacity-75">{label}</span>
          </button>
        ))}
      </div>

      {/* Mobile View Switcher */}
      <div className="flex sm:hidden items-center bg-white/20 rounded-lg p-1">
        {VIEW_OPTIONS.map(({ value, shortLabel }) => (
          <button
            key={value}
            onClick={() => onViewChange(value)}
            className={`px-3 py-1.5 text-base font-medium rounded-md transition-all ${
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
        <div className="relative">
          <select
            value={jlptLevel}
            onChange={(e) => onJlptChange(e.target.value as JLPTLevel)}
            className="bg-white text-indigo-600 border-0 rounded-lg pl-3 pr-8 py-1.5 text-sm font-bold focus:ring-2 focus:ring-white/50 cursor-pointer appearance-none shadow-sm"
          >
            {JLPT_LEVELS.map((level) => (
              <option key={level} value={level} className="text-gray-900 font-bold">
                {level}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Event Toggles (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <button
            onClick={onToggleWOTD}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
              showWOTD
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
            title={showWOTD ? 'Hide Word of the Day' : 'Show Word of the Day'}
          >
            <span className={`w-3 h-3 rounded transition-opacity ${
              showWOTD ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gray-400'
            }`}></span>
            Word
          </button>
          <button
            onClick={onToggleKOTD}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
              showKOTD
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
            title={showKOTD ? 'Hide Kanji of the Day' : 'Show Kanji of the Day'}
          >
            <span className={`w-3 h-3 rounded transition-opacity ${
              showKOTD ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-400'
            }`}></span>
            Kanji
          </button>
          <span className="flex items-center gap-1 text-white/80">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-orange-500"></span>
            Holiday
          </span>
        </div>

        {/* Close Button - only show if onClose is provided */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close calendar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
