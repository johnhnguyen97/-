import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface CalendarEvent {
  id: string;
  type: 'word' | 'kanji' | 'holiday' | 'custom';
  title?: string;
  color?: string;
}

export interface CalendarDayProps {
  /** The date for this cell */
  date: Date;
  /** Day number to display */
  day: number;
  /** Whether this is today */
  isToday?: boolean;
  /** Whether this day is in the current month */
  isCurrentMonth?: boolean;
  /** Whether this is a holiday */
  isHoliday?: boolean;
  /** Holiday name if applicable */
  holidayName?: string;
  /** Daily kanji to display */
  kanji?: string;
  /** Kanji reading */
  kanjiReading?: string;
  /** Kanji meaning */
  kanjiMeaning?: string;
  /** Events for this day */
  events?: CalendarEvent[];
  /** Whether this day is selected */
  isSelected?: boolean;
  /** Variant style */
  variant?: 'default' | 'kawaii';
  /** Click handler */
  onClick?: (date: Date) => void;
  /** Kanji click handler */
  onKanjiClick?: (date: Date, kanji: string) => void;
  /** Additional class names */
  className?: string;
  /** Custom content to render */
  children?: ReactNode;
}

export function CalendarDay({
  date,
  day,
  isToday = false,
  isCurrentMonth = true,
  isHoliday = false,
  holidayName,
  kanji,
  kanjiReading,
  events = [],
  isSelected = false,
  variant = 'default',
  onClick,
  onKanjiClick,
  className,
  children,
}: CalendarDayProps) {
  const dayOfWeek = date.getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  const isKawaii = variant === 'kawaii';

  const handleClick = () => {
    onClick?.(date);
  };

  const handleKanjiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (kanji) {
      onKanjiClick?.(date, kanji);
    }
  };

  // Event dot colors
  const getEventColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'word': return 'bg-purple-400';
      case 'kanji': return 'bg-pink-400';
      case 'holiday': return 'bg-amber-400';
      default: return event.color || 'bg-gray-400';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex flex-col items-center p-1 cursor-pointer transition-all',
        'hover:bg-pink-50 dark:hover:bg-pink-900/20',
        isKawaii ? 'rounded-xl min-h-[72px]' : 'rounded-lg min-h-[64px]',
        isToday && 'bg-pink-100 dark:bg-pink-900/30 ring-2 ring-pink-400 dark:ring-pink-500',
        isSelected && 'bg-pink-200 dark:bg-pink-800/40',
        !isCurrentMonth && 'opacity-40',
        className
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          'text-sm font-semibold leading-tight',
          isSunday && 'text-red-500 dark:text-red-400',
          isSaturday && 'text-blue-500 dark:text-blue-400',
          !isSunday && !isSaturday && 'text-gray-700 dark:text-gray-200',
          isHoliday && 'text-red-500 dark:text-red-400',
          isToday && 'text-pink-600 dark:text-pink-300',
          isKawaii && isToday && 'bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center',
        )}
      >
        {day}
      </span>

      {/* Kanji */}
      {kanji && (
        <button
          onClick={handleKanjiClick}
          title={kanjiReading ? `${kanji} (${kanjiReading})` : kanji}
          className={cn(
            'text-lg font-bold leading-none mt-0.5 transition-transform hover:scale-110',
            isKawaii ? 'text-xl' : 'text-base',
            'text-indigo-600 dark:text-indigo-400',
            'hover:text-pink-500 dark:hover:text-pink-400',
          )}
        >
          {kanji}
        </button>
      )}

      {/* Holiday name (truncated) */}
      {isHoliday && holidayName && (
        <span className="text-[8px] text-red-500 dark:text-red-400 truncate w-full text-center mt-0.5">
          {holidayName}
        </span>
      )}

      {/* Event dots */}
      {events.length > 0 && (
        <div className="flex gap-0.5 mt-auto pt-1">
          {events.slice(0, 3).map((event, idx) => (
            <span
              key={event.id || idx}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                getEventColor(event)
              )}
              title={event.title}
            />
          ))}
          {events.length > 3 && (
            <span className="text-[8px] text-gray-400">+{events.length - 3}</span>
          )}
        </div>
      )}

      {/* Custom children */}
      {children}
    </div>
  );
}
