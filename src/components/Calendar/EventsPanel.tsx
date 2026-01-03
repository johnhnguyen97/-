import { useTheme } from '../../contexts/ThemeContext';

export interface WordData {
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech?: string;
  isLearned?: boolean;
}

export interface KanjiData {
  kanji: string;
  reading?: string;
  meaning?: string;
  onyomi?: string[];
  kunyomi?: string[];
  strokeCount?: number;
  isLearned?: boolean;
}

export interface HolidayData {
  name: string;
  localName?: string;
  description?: string;
}

export interface EventsPanelProps {
  selectedDate: Date | null;
  wordOfTheDay?: WordData | null;
  kanjiOfTheDay?: KanjiData | null;
  holidays?: HolidayData[];
  jlptLevel?: string;
  onWordClick?: () => void;
  onKanjiClick?: () => void;
  className?: string;
}

export function EventsPanel({
  selectedDate,
  wordOfTheDay,
  kanjiOfTheDay,
  holidays = [],
  jlptLevel = 'N5',
  onWordClick,
  onKanjiClick,
  className = '',
}: EventsPanelProps) {
  const { isDark } = useTheme();

  const hasContent = wordOfTheDay || kanjiOfTheDay || holidays.length > 0;

  if (!hasContent) {
    return null;
  }

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })
    : '今日';

  return (
    <div className={`rounded-2xl overflow-hidden ${
      isDark ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-pink-100'
    } ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        isDark ? 'border-white/10 bg-white/5' : 'border-pink-100 bg-pink-50/50'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {dateLabel}の学習
          </h3>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
            {jlptLevel}
          </span>
        </div>
      </div>

      {/* Content - Pill style buttons */}
      <div className="p-4 flex flex-wrap gap-2">
        {/* Word of the Day Pill */}
        {wordOfTheDay && (
          <button
            onClick={onWordClick}
            className={`
              px-4 py-2.5 rounded-full font-medium text-sm
              flex items-center gap-2 transition-all
              hover:scale-[1.02] active:scale-[0.98]
              ${isDark
                ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-700/50'
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200'
              }
            `}
          >
            <span className="text-base">📚</span>
            <span className="font-bold">{wordOfTheDay.word}</span>
            <span className="opacity-70">({wordOfTheDay.reading})</span>
            <span className="opacity-60 hidden sm:inline">- {wordOfTheDay.meaning}</span>
            {wordOfTheDay.isLearned && (
              <span className="text-green-500">✓</span>
            )}
          </button>
        )}

        {/* Kanji of the Day Pill */}
        {kanjiOfTheDay && (
          <button
            onClick={onKanjiClick}
            className={`
              px-4 py-2.5 rounded-full font-medium text-sm
              flex items-center gap-2 transition-all
              hover:scale-[1.02] active:scale-[0.98]
              ${isDark
                ? 'bg-pink-900/40 text-pink-300 hover:bg-pink-900/60 border border-pink-700/50'
                : 'bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200'
              }
            `}
          >
            <span className="text-base">漢</span>
            <span className="font-bold text-lg">{kanjiOfTheDay.kanji}</span>
            {kanjiOfTheDay.reading && (
              <span className="opacity-70">({kanjiOfTheDay.reading})</span>
            )}
            <span className="opacity-60 hidden sm:inline">- {kanjiOfTheDay.meaning}</span>
            {kanjiOfTheDay.isLearned && (
              <span className="text-green-500">✓</span>
            )}
          </button>
        )}

        {/* Holiday Pills */}
        {holidays.map((holiday, idx) => (
          <div
            key={idx}
            className={`
              px-4 py-2.5 rounded-full font-medium text-sm
              flex items-center gap-2
              ${isDark
                ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
              }
            `}
          >
            <span className="text-base">🎌</span>
            <span>{holiday.localName || holiday.name}</span>
          </div>
        ))}
      </div>

      {/* Quick tip */}
      <div className={`px-4 pb-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        Tap to view details
      </div>
    </div>
  );
}

export default EventsPanel;
