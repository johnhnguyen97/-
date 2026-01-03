import { cn } from '../../utils/cn';
import { calendar } from '../../tokens';

export interface CalendarHeaderProps {
  /** Start week on Monday (true) or Sunday (false) */
  startMonday?: boolean;
  /** Variant style */
  variant?: 'default' | 'kawaii';
  /** Show full day names or short */
  showFull?: boolean;
  /** Additional class names */
  className?: string;
}

export function CalendarHeader({
  startMonday = true,
  variant = 'default',
  showFull = false,
  className,
}: CalendarHeaderProps) {
  // Reorder days based on start day preference
  const dayOrder = startMonday
    ? [1, 2, 3, 4, 5, 6, 0] // Mon-Sun
    : [0, 1, 2, 3, 4, 5, 6]; // Sun-Sat

  const dayNames = showFull ? calendar.dayNames.full : calendar.dayNames.short;

  const getDayColor = (dayIndex: number) => {
    if (dayIndex === 0) return 'text-red-500 dark:text-red-400'; // Sunday
    if (dayIndex === 6) return 'text-blue-500 dark:text-blue-400'; // Saturday
    return 'text-gray-700 dark:text-gray-300';
  };

  const isKawaii = variant === 'kawaii';

  return (
    <div
      className={cn(
        'grid grid-cols-7 gap-1',
        isKawaii ? 'px-2 py-3' : 'px-1 py-2',
        className
      )}
    >
      {dayOrder.map((dayIndex) => (
        <div
          key={dayIndex}
          className={cn(
            'flex items-center justify-center font-medium text-center',
            isKawaii ? 'text-sm py-2 rounded-full' : 'text-xs py-1',
            getDayColor(dayIndex),
            isKawaii && dayIndex === 0 && 'bg-red-50 dark:bg-red-900/20',
            isKawaii && dayIndex === 6 && 'bg-blue-50 dark:bg-blue-900/20',
          )}
        >
          {dayNames[dayIndex]}
        </div>
      ))}
    </div>
  );
}
