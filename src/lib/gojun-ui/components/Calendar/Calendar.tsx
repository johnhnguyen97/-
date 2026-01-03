import { useState, useMemo, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { calendar } from '../../tokens';
import { CalendarHeader } from './CalendarHeader';
import { CalendarDay, type CalendarEvent } from './CalendarDay';

export interface CalendarDayData {
  kanji?: string;
  kanjiReading?: string;
  kanjiMeaning?: string;
  events?: CalendarEvent[];
  isHoliday?: boolean;
  holidayName?: string;
}

export interface CalendarProps {
  /** Initial year */
  year?: number;
  /** Initial month (1-12) */
  month?: number;
  /** Start week on Monday */
  startMonday?: boolean;
  /** Variant style */
  variant?: 'default' | 'kawaii';
  /** Day data keyed by date string (YYYY-MM-DD) */
  dayData?: Record<string, CalendarDayData>;
  /** Selected date */
  selectedDate?: Date | null;
  /** Day click handler */
  onDayClick?: (date: Date) => void;
  /** Kanji click handler */
  onKanjiClick?: (date: Date, kanji: string) => void;
  /** Month change handler */
  onMonthChange?: (year: number, month: number) => void;
  /** Custom day renderer */
  renderDay?: (date: Date, defaultContent: ReactNode) => ReactNode;
  /** Show navigation controls */
  showNavigation?: boolean;
  /** Additional class names */
  className?: string;
}

export function Calendar({
  year: initialYear,
  month: initialMonth,
  startMonday = true,
  variant = 'default',
  dayData = {},
  selectedDate,
  onDayClick,
  onKanjiClick,
  onMonthChange,
  renderDay,
  showNavigation = true,
  className,
}: CalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(initialYear ?? today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? today.getMonth() + 1);

  const isKawaii = variant === 'kawaii';

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();

    // Get the day of week for the first day (0 = Sunday)
    let startDayOfWeek = firstDay.getDay();

    // Adjust for Monday start
    if (startMonday) {
      startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    }

    const days: Array<{ date: Date; day: number; isCurrentMonth: boolean }> = [];

    // Previous month days
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(currentYear, currentMonth - 2, day);
      days.push({ date, day, isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      days.push({ date, day, isCurrentMonth: true });
    }

    // Next month days to fill the grid (6 rows × 7 days = 42)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({ date, day, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth, startMonday]);

  const navigateMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newYear, newMonth);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    onMonthChange?.(today.getFullYear(), today.getMonth() + 1);
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden',
        isKawaii
          ? 'bg-white/90 dark:bg-gray-900/90 shadow-lg'
          : 'bg-white dark:bg-gray-900 shadow-md',
        isKawaii && 'border-2 border-pink-200 dark:border-pink-800',
        className
      )}
    >
      {/* Navigation Header */}
      {showNavigation && (
        <div
          className={cn(
            'flex items-center justify-between px-4 py-3',
            isKawaii
              ? 'bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40'
              : 'bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'
          )}
        >
          {/* Previous month */}
          <button
            onClick={() => navigateMonth(-1)}
            className={cn(
              'p-2 rounded-lg transition-all hover:scale-105 active:scale-95',
              isKawaii
                ? 'hover:bg-pink-200/50 dark:hover:bg-pink-800/30'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Month/Year display */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToToday}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full transition-all',
                isKawaii
                  ? 'bg-pink-500 text-white hover:bg-pink-600'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              )}
            >
              今日
            </button>
            <h2 className={cn(
              'text-lg font-bold',
              isKawaii ? 'text-pink-700 dark:text-pink-300' : 'text-gray-800 dark:text-gray-200'
            )}>
              {currentYear}年 {calendar.monthNames.full[currentMonth - 1]}
            </h2>
          </div>

          {/* Next month */}
          <button
            onClick={() => navigateMonth(1)}
            className={cn(
              'p-2 rounded-lg transition-all hover:scale-105 active:scale-95',
              isKawaii
                ? 'hover:bg-pink-200/50 dark:hover:bg-pink-800/30'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Day Headers */}
      <CalendarHeader
        startMonday={startMonday}
        variant={variant}
        className={cn(
          isKawaii
            ? 'bg-pink-50/50 dark:bg-pink-900/20'
            : 'bg-gray-50 dark:bg-gray-800/50'
        )}
      />

      {/* Calendar Grid */}
      <div className={cn(
        'grid grid-cols-7 gap-1 p-2',
        isKawaii ? 'bg-white/50 dark:bg-gray-900/50' : ''
      )}>
        {calendarDays.map(({ date, day, isCurrentMonth }, index) => {
          const dateKey = formatDateKey(date);
          const data = dayData[dateKey];

          const dayContent = (
            <CalendarDay
              key={index}
              date={date}
              day={day}
              isToday={isToday(date)}
              isCurrentMonth={isCurrentMonth}
              isHoliday={data?.isHoliday}
              holidayName={data?.holidayName}
              kanji={data?.kanji}
              kanjiReading={data?.kanjiReading}
              events={data?.events}
              isSelected={isSelected(date)}
              variant={variant}
              onClick={onDayClick}
              onKanjiClick={onKanjiClick}
            />
          );

          return renderDay ? renderDay(date, dayContent) : dayContent;
        })}
      </div>
    </div>
  );
}
