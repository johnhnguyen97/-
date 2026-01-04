import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FavoriteButton } from '../FavoriteButton';
import { WordNoteButton } from '../WordNoteButton';
import { StrokeAnimation } from '../Kanji/StrokeAnimation';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface DayData {
  word?: string;
  wordReading?: string;
  wordMeaning?: string;
  wordPartOfSpeech?: string;
  kanji?: string;
  kanjiReading?: string;
  kanjiMeaning?: string;
  kanjiOnyomi?: string[];
  kanjiKunyomi?: string[];
  kanjiStrokeCount?: number;
  isHoliday?: boolean;
  holidayName?: string;
}

interface MobileCalendarViewProps {
  currentYear: number;
  currentMonth: number;
  selectedDate: Date;
  dayData: Record<string, DayData>;
  jlptLevel: string;
  isLoading: boolean;
  onDateSelect: (date: Date) => void;
  onMonthChange: (delta: number) => void;
  onJlptChange: (level: string) => void;
}

// Format date as YYYY-MM-DD
function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Get days of the week for horizontal scroll
function getWeekDays(centerDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(centerDate);
  start.setDate(start.getDate() - 3); // 3 days before

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

// Japanese day names
const WEEKDAY_SHORT = ['日', '月', '火', '水', '木', '金', '土'];

export function MobileCalendarView({
  currentYear,
  currentMonth,
  selectedDate,
  dayData,
  jlptLevel,
  isLoading,
  onDateSelect,
  onMonthChange,
  onJlptChange,
}: MobileCalendarViewProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'word' | 'kanji'>('word');
  const [showStrokeAnimation, setShowStrokeAnimation] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const weekScrollRef = useRef<HTMLDivElement>(null);
  const { speak, isSpeaking } = useSpeechSynthesis({ lang: 'ja-JP', rate: 0.8 });

  // Get current day data
  const dateKey = formatDateKey(selectedDate);
  const currentDayData = dayData[dateKey] || {};

  // Get week days for horizontal scroll
  const weekDays = getWeekDays(selectedDate);

  // Scroll to center on mount
  useEffect(() => {
    if (weekScrollRef.current) {
      const centerOffset = weekScrollRef.current.scrollWidth / 2 - weekScrollRef.current.clientWidth / 2;
      weekScrollRef.current.scrollLeft = centerOffset;
    }
  }, [selectedDate]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // Theme colors
  const theme = {
    bg: isDark ? 'bg-[#0f0f1a]' : 'bg-gradient-to-b from-slate-50 to-white',
    card: isDark ? 'bg-[#1a1a2e]' : 'bg-white',
    cardBorder: isDark ? 'border-white/10' : 'border-slate-200/60',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-slate-400',
    accent: 'from-violet-500 to-purple-600',
    accentLight: isDark ? 'bg-violet-500/20' : 'bg-violet-100',
  };

  return (
    <div className={`min-h-screen ${theme.bg} pb-24`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${isDark ? 'bg-[#0f0f1a]/95' : 'bg-white/95'} backdrop-blur-xl border-b ${theme.cardBorder}`}>
        {/* Top Bar */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${theme.text}`}>
                {currentMonth}月
              </h1>
              <p className={`text-sm ${theme.textMuted}`}>
                {currentYear}年
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* JLPT Level Selector */}
              <select
                value={jlptLevel}
                onChange={(e) => onJlptChange(e.target.value)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                  isDark
                    ? 'bg-violet-500/20 border-violet-500/30 text-violet-300'
                    : 'bg-violet-50 border-violet-200 text-violet-700'
                }`}
              >
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>

              {/* Calendar Toggle */}
              <button
                onClick={() => setShowFullCalendar(!showFullCalendar)}
                className={`p-2.5 rounded-xl transition-all ${
                  showFullCalendar
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                    : isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Week Scroll */}
        <div
          ref={weekScrollRef}
          className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {/* Previous Month Button */}
          <button
            onClick={() => onMonthChange(-1)}
            className={`flex-shrink-0 w-12 h-16 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {weekDays.map((date) => {
            const dayOfWeek = date.getDay();
            const dayKey = formatDateKey(date);
            const hasData = dayData[dayKey]?.word || dayData[dayKey]?.kanji;
            const isHoliday = dayData[dayKey]?.isHoliday;

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                className={`flex-shrink-0 w-14 py-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                  isSelected(date)
                    ? 'bg-gradient-to-b from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 scale-105'
                    : isToday(date)
                    ? isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'
                    : isDark ? 'bg-white/5' : 'bg-slate-50'
                }`}
                style={{ scrollSnapAlign: 'center' }}
              >
                <span className={`text-[10px] font-medium ${
                  isSelected(date) ? 'text-white/80' :
                  isHoliday || dayOfWeek === 0 ? 'text-red-500' :
                  dayOfWeek === 6 ? 'text-blue-500' :
                  theme.textMuted
                }`}>
                  {WEEKDAY_SHORT[dayOfWeek]}
                </span>
                <span className={`text-xl font-bold mt-0.5 ${
                  isSelected(date) ? 'text-white' : theme.text
                }`}>
                  {date.getDate()}
                </span>
                {/* Indicator dot */}
                {hasData && !isSelected(date) && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    isDark ? 'bg-violet-400' : 'bg-violet-500'
                  }`} />
                )}
                {isSelected(date) && hasData && (
                  <div className="w-1.5 h-1.5 rounded-full mt-1 bg-white/60" />
                )}
              </button>
            );
          })}

          {/* Next Month Button */}
          <button
            onClick={() => onMonthChange(1)}
            className={`flex-shrink-0 w-12 h-16 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Full Calendar (expandable) */}
      {showFullCalendar && (
        <FullMonthGrid
          year={currentYear}
          month={currentMonth}
          selectedDate={selectedDate}
          dayData={dayData}
          isDark={isDark}
          onDateSelect={(date) => {
            onDateSelect(date);
            setShowFullCalendar(false);
          }}
        />
      )}

      {/* Content Cards */}
      <div className="px-4 pt-4 space-y-4">
        {/* Date Header Card */}
        <div className={`${theme.card} rounded-3xl p-4 border ${theme.cardBorder} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
              <h2 className={`text-2xl font-bold ${theme.text} mt-0.5`}>
                {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
              </h2>
            </div>
            {/* Today Button */}
            {!isToday(selectedDate) && (
              <button
                onClick={() => onDateSelect(new Date())}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25"
              >
                今日
              </button>
            )}
          </div>

          {/* Holiday Banner */}
          {currentDayData.isHoliday && currentDayData.holidayName && (
            <div className={`mt-3 px-4 py-3 rounded-2xl ${
              isDark ? 'bg-amber-500/20' : 'bg-amber-50'
            } flex items-center gap-3`}>
              <span className="text-2xl">🎌</span>
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  祝日
                </p>
                <p className={`font-bold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                  {currentDayData.holidayName}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className={`${theme.card} rounded-2xl p-1.5 border ${theme.cardBorder} flex gap-1`}>
          <button
            onClick={() => setActiveTab('word')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'word'
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                : isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span className="mr-1.5">📖</span>
            今日の単語
          </button>
          <button
            onClick={() => setActiveTab('kanji')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'kanji'
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                : isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span className="mr-1.5">漢</span>
            今日の漢字
          </button>
        </div>

        {/* Word Card */}
        {activeTab === 'word' && (
          <div className={`${theme.card} rounded-3xl border ${theme.cardBorder} shadow-sm overflow-hidden`}>
            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentDayData.word ? (
              <>
                {/* Word Display */}
                <div className="p-6 text-center relative">
                  {/* Action buttons */}
                  <div className="absolute top-4 right-4 flex gap-1">
                    <FavoriteButton
                      word={currentDayData.word}
                      reading={currentDayData.wordReading || ''}
                      english={currentDayData.wordMeaning || ''}
                      partOfSpeech={currentDayData.wordPartOfSpeech?.toLowerCase() as 'noun' | 'verb'}
                    />
                    <WordNoteButton
                      word={currentDayData.word}
                      reading={currentDayData.wordReading || ''}
                      english={currentDayData.wordMeaning || ''}
                    />
                  </div>

                  {/* Part of speech badge */}
                  {currentDayData.wordPartOfSpeech && (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'
                    }`}>
                      {currentDayData.wordPartOfSpeech}
                    </span>
                  )}

                  {/* Main word */}
                  <div className="mt-4">
                    <p className={`text-5xl font-bold ${theme.text}`}>
                      {currentDayData.word}
                    </p>
                    <p className={`text-xl mt-2 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                      {currentDayData.wordReading}
                    </p>
                  </div>

                  {/* Meaning */}
                  <p className={`mt-4 text-lg ${theme.textMuted}`}>
                    {currentDayData.wordMeaning}
                  </p>

                  {/* Audio Button */}
                  <button
                    onClick={() => speak(currentDayData.word || '')}
                    className={`mt-6 px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 mx-auto transition-all ${
                      isSpeaking(currentDayData.word || '')
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white scale-105 shadow-lg'
                        : isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-xl">🔊</span>
                    <span>発音を聞く</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className={`w-16 h-16 mx-auto rounded-2xl ${theme.accentLight} flex items-center justify-center mb-3`}>
                  <span className="text-3xl">📖</span>
                </div>
                <p className={theme.textMuted}>この日の単語はありません</p>
              </div>
            )}
          </div>
        )}

        {/* Kanji Card */}
        {activeTab === 'kanji' && (
          <div className={`${theme.card} rounded-3xl border ${theme.cardBorder} shadow-sm overflow-hidden`}>
            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentDayData.kanji ? (
              <>
                {/* Kanji Display */}
                <div className="p-6 text-center relative">
                  {/* Action buttons */}
                  <div className="absolute top-4 right-4 flex gap-1">
                    <FavoriteButton
                      word={currentDayData.kanji}
                      reading={currentDayData.kanjiReading || ''}
                      english={currentDayData.kanjiMeaning || ''}
                      partOfSpeech="kanji"
                    />
                    <WordNoteButton
                      word={currentDayData.kanji}
                      reading={currentDayData.kanjiReading || ''}
                      english={currentDayData.kanjiMeaning || ''}
                    />
                  </div>

                  {/* Stroke count badge */}
                  {currentDayData.kanjiStrokeCount && (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {currentDayData.kanjiStrokeCount} strokes
                    </span>
                  )}

                  {/* Main kanji */}
                  <div className="mt-4">
                    <p className={`text-7xl font-bold ${theme.text}`}>
                      {currentDayData.kanji}
                    </p>
                  </div>

                  {/* Meaning */}
                  <p className={`mt-4 text-xl font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {currentDayData.kanjiMeaning}
                  </p>

                  {/* Readings */}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {currentDayData.kanjiOnyomi && currentDayData.kanjiOnyomi.length > 0 && (
                      <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                        <p className={`text-xs font-medium ${theme.textSubtle} mb-1`}>音読み</p>
                        <p className={`font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                          {currentDayData.kanjiOnyomi.slice(0, 2).join('、')}
                        </p>
                      </div>
                    )}
                    {currentDayData.kanjiKunyomi && currentDayData.kanjiKunyomi.length > 0 && (
                      <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                        <p className={`text-xs font-medium ${theme.textSubtle} mb-1`}>訓読み</p>
                        <p className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {currentDayData.kanjiKunyomi.slice(0, 2).join('、')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => speak(currentDayData.kanji || '')}
                      className={`flex-1 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
                        isSpeaking(currentDayData.kanji || '')
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white scale-105'
                          : isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>🔊</span>
                      <span>発音</span>
                    </button>
                    <button
                      onClick={() => setShowStrokeAnimation(true)}
                      className={`flex-1 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 ${
                        isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      <span>✏️</span>
                      <span>書き順</span>
                    </button>
                  </div>
                </div>

                {/* Stroke Animation Panel */}
                {showStrokeAnimation && (
                  <div className={`border-t ${theme.cardBorder} p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-semibold ${theme.text}`}>書き順アニメーション</h3>
                      <button
                        onClick={() => setShowStrokeAnimation(false)}
                        className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <StrokeAnimation character={currentDayData.kanji} isDark={isDark} />
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <div className={`w-16 h-16 mx-auto rounded-2xl ${theme.accentLight} flex items-center justify-center mb-3`}>
                  <span className="text-3xl">漢</span>
                </div>
                <p className={theme.textMuted}>この日の漢字はありません</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Full Month Grid Component
function FullMonthGrid({
  year,
  month,
  selectedDate,
  dayData,
  isDark,
  onDateSelect,
}: {
  year: number;
  month: number;
  selectedDate: Date;
  dayData: Record<string, DayData>;
  isDark: boolean;
  onDateSelect: (date: Date) => void;
}) {
  const weekDays = ['月', '火', '水', '木', '金', '土', '日'];

  // Generate calendar grid
  const generateDays = () => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: Array<{ date: Date; day: number; isCurrentMonth: boolean }> = [];

    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 2, day);
      days.push({ date, day, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      days.push({ date, day, isCurrentMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month, day);
      days.push({ date, day, isCurrentMonth: false });
    }

    return days;
  };

  const days = generateDays();
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isSelected = (date: Date) => date.toDateString() === selectedDate.toDateString();

  return (
    <div className={`mx-4 mt-4 rounded-3xl overflow-hidden border ${
      isDark ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-slate-200'
    } shadow-lg animate-fadeInUp`}>
      {/* Week headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/10">
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-semibold ${
              idx === 5 ? 'text-blue-500' : idx === 6 ? 'text-red-500' : isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map(({ date, day, isCurrentMonth }, idx) => {
          const dateKey = formatDateKey(date);
          const data = dayData[dateKey];
          const dayOfWeek = date.getDay();
          const hasData = data?.word || data?.kanji;

          return (
            <button
              key={idx}
              onClick={() => onDateSelect(date)}
              className={`aspect-square p-1 flex flex-col items-center justify-center transition-all ${
                !isCurrentMonth ? 'opacity-30' : ''
              } ${isSelected(date) ? 'bg-violet-500 text-white' : ''}`}
            >
              <span className={`text-sm font-medium ${
                isSelected(date) ? 'text-white' :
                isToday(date) ? 'text-violet-500 font-bold' :
                data?.isHoliday || dayOfWeek === 0 ? 'text-red-500' :
                dayOfWeek === 6 ? 'text-blue-500' :
                isDark ? 'text-white' : 'text-slate-800'
              }`}>
                {day}
              </span>
              {hasData && (
                <div className={`w-1 h-1 rounded-full mt-0.5 ${
                  isSelected(date) ? 'bg-white/60' : 'bg-violet-500'
                }`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MobileCalendarView;
