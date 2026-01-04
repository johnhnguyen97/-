import { useState, useRef, useEffect, useCallback } from 'react';
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

// Get extended days for smooth scrolling (2 weeks before and after)
function getExtendedWeekDays(centerDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(centerDate);
  start.setDate(start.getDate() - 7);

  for (let i = 0; i < 15; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

// Japanese day names
const WEEKDAY_SHORT = ['日', '月', '火', '水', '木', '金', '土'];

// Swipe hook for gesture detection
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void, threshold = 50) {
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (Math.abs(distance) > threshold) {
      if (distance > 0) onSwipeLeft();
      else onSwipeRight();
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

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
  const [showStrokeAnimation, setShowStrokeAnimation] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [pressedDate, setPressedDate] = useState<string | null>(null);
  const weekScrollRef = useRef<HTMLDivElement>(null);
  const { speak, isSpeaking } = useSpeechSynthesis({ lang: 'ja-JP', rate: 0.8 });

  // Swipe handlers for content area
  const contentSwipe = useSwipe(
    () => {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 1);
      onDateSelect(next);
    },
    () => {
      const prev = new Date(selectedDate);
      prev.setDate(prev.getDate() - 1);
      onDateSelect(prev);
    }
  );

  // Get current day data
  const dateKey = formatDateKey(selectedDate);
  const currentDayData = dayData[dateKey] || {};

  // Get extended week days for horizontal scroll
  const weekDays = getExtendedWeekDays(selectedDate);

  // Scroll to center on mount and when date changes
  const scrollToCenter = useCallback(() => {
    if (weekScrollRef.current) {
      const container = weekScrollRef.current;
      const selectedElement = container.querySelector('[data-selected="true"]');
      if (selectedElement) {
        const containerWidth = container.clientWidth;
        const elementLeft = (selectedElement as HTMLElement).offsetLeft;
        const elementWidth = (selectedElement as HTMLElement).offsetWidth;
        container.scrollTo({
          left: elementLeft - containerWidth / 2 + elementWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  useEffect(() => {
    scrollToCenter();
  }, [selectedDate, scrollToCenter]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // Theme colors - enhanced glassmorphism
  const theme = {
    bg: isDark
      ? 'bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#12121f]'
      : 'bg-gradient-to-br from-violet-50 via-white to-purple-50',
    card: isDark
      ? 'bg-white/[0.03] backdrop-blur-xl'
      : 'bg-white/70 backdrop-blur-xl',
    cardBorder: isDark ? 'border-white/[0.08]' : 'border-white/60',
    cardShadow: isDark
      ? 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
      : 'shadow-[0_8px_32px_rgba(139,92,246,0.1)]',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-slate-400',
    accent: 'from-violet-500 to-purple-600',
    accentGlow: isDark ? 'shadow-violet-500/25' : 'shadow-violet-500/20',
  };

  return (
    <div className={`min-h-screen ${theme.bg} pb-24 overflow-hidden`}>
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] ${
          isDark ? 'bg-violet-600/20' : 'bg-violet-400/30'
        }`} />
        <div className={`absolute top-1/3 -left-32 w-48 h-48 rounded-full blur-[80px] ${
          isDark ? 'bg-purple-600/15' : 'bg-purple-300/25'
        }`} />
        <div className={`absolute bottom-32 right-0 w-56 h-56 rounded-full blur-[90px] ${
          isDark ? 'bg-indigo-600/15' : 'bg-indigo-300/20'
        }`} />
      </div>

      {/* Header */}
      <div className={`sticky top-0 z-40 ${isDark ? 'bg-[#0a0a12]/80' : 'bg-white/80'} backdrop-blur-2xl border-b ${theme.cardBorder}`}>
        {/* Top Bar */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Month/Year with tap to expand calendar */}
              <button
                onClick={() => setShowFullCalendar(!showFullCalendar)}
                className="flex items-center gap-2 active:scale-95 transition-transform"
              >
                <h1 className={`text-2xl font-bold ${theme.text}`}>
                  {currentMonth}月 {currentYear}
                </h1>
                <svg
                  className={`w-5 h-5 ${theme.textMuted} transition-transform duration-300 ${showFullCalendar ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* JLPT Level Pill */}
              <div className={`flex items-center rounded-full p-1 ${
                isDark ? 'bg-white/5' : 'bg-slate-100'
              }`}>
                {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (
                  <button
                    key={level}
                    onClick={() => onJlptChange(level)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      jlptLevel === level
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                        : `${theme.textMuted} hover:text-white`
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Week Scroll - enhanced */}
        <div
          ref={weekScrollRef}
          className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {/* Previous Week Button */}
          <button
            onClick={() => onMonthChange(-1)}
            className={`flex-shrink-0 w-10 h-[72px] rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
              isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {weekDays.map((date) => {
            const dayOfWeek = date.getDay();
            const dayKey = formatDateKey(date);
            const hasData = dayData[dayKey]?.word || dayData[dayKey]?.kanji;
            const isHoliday = dayData[dayKey]?.isHoliday;
            const isPressed = pressedDate === dayKey;
            const selected = isSelected(date);
            const today = isToday(date);

            return (
              <button
                key={date.toISOString()}
                data-selected={selected}
                onClick={() => onDateSelect(date)}
                onTouchStart={() => setPressedDate(dayKey)}
                onTouchEnd={() => setPressedDate(null)}
                onMouseDown={() => setPressedDate(dayKey)}
                onMouseUp={() => setPressedDate(null)}
                onMouseLeave={() => setPressedDate(null)}
                className={`flex-shrink-0 w-12 py-2 rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${
                  selected
                    ? `bg-gradient-to-b from-violet-500 to-purple-600 text-white shadow-lg ${theme.accentGlow} scale-105`
                    : today
                    ? isDark ? 'bg-violet-500/20 text-violet-300 ring-2 ring-violet-500/30' : 'bg-violet-100 text-violet-700 ring-2 ring-violet-300'
                    : isDark ? 'bg-white/[0.03]' : 'bg-white/50'
                } ${isPressed && !selected ? 'scale-95' : ''}`}
                style={{ scrollSnapAlign: 'center' }}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                  selected ? 'text-white/70' :
                  isHoliday || dayOfWeek === 0 ? 'text-red-500' :
                  dayOfWeek === 6 ? 'text-blue-500' :
                  theme.textMuted
                }`}>
                  {WEEKDAY_SHORT[dayOfWeek]}
                </span>
                <span className={`text-xl font-bold mt-0.5 ${
                  selected ? 'text-white' : theme.text
                }`}>
                  {date.getDate()}
                </span>
                {/* Enhanced indicator */}
                <div className="h-1.5 mt-1 flex gap-0.5">
                  {hasData && (
                    <>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        selected ? 'bg-white/70' : 'bg-violet-500'
                      }`} />
                      {dayData[dayKey]?.kanji && (
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          selected ? 'bg-white/50' : 'bg-indigo-400'
                        }`} />
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}

          {/* Next Week Button */}
          <button
            onClick={() => onMonthChange(1)}
            className={`flex-shrink-0 w-10 h-[72px] rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
              isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
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
          onMonthChange={onMonthChange}
        />
      )}

      {/* Content Cards - with swipe gesture */}
      <div
        className="px-4 pt-4 space-y-4 relative z-10"
        {...contentSwipe}
      >
        {/* Date Header - Compact */}
        <div className={`${theme.card} rounded-3xl p-4 border ${theme.cardBorder} ${theme.cardShadow}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Day Circle */}
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${
                isToday(selectedDate)
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                  : isDark ? 'bg-white/5' : 'bg-slate-100'
              }`}>
                <span className={`text-[10px] font-semibold uppercase ${
                  isToday(selectedDate) ? 'text-white/70' : theme.textMuted
                }`}>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className={`text-xl font-bold ${
                  isToday(selectedDate) ? 'text-white' : theme.text
                }`}>
                  {selectedDate.getDate()}
                </span>
              </div>
              <div>
                <p className={`text-sm ${theme.textMuted}`}>
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <h2 className={`text-lg font-bold ${theme.text}`}>
                  {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                </h2>
              </div>
            </div>

            {/* Today Button */}
            {!isToday(selectedDate) && (
              <button
                onClick={() => onDateSelect(new Date())}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 active:scale-95 transition-transform"
              >
                今日
              </button>
            )}
          </div>

          {/* Holiday Banner */}
          {currentDayData.isHoliday && currentDayData.holidayName && (
            <div className={`mt-3 px-4 py-3 rounded-2xl ${
              isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
            } flex items-center gap-3`}>
              <span className="text-2xl">🎌</span>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  祝日 Holiday
                </p>
                <p className={`font-bold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                  {currentDayData.holidayName}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Combined Word + Kanji Cards */}
        {isLoading ? (
          <div className={`${theme.card} rounded-3xl p-12 border ${theme.cardBorder} ${theme.cardShadow} flex items-center justify-center`}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className={theme.textMuted}>読み込み中...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Word Card */}
            {currentDayData.word && (
              <WordCard
                data={currentDayData}
                isDark={isDark}
                theme={theme}
                speak={speak}
                isSpeaking={isSpeaking}
              />
            )}

            {/* Kanji Card */}
            {currentDayData.kanji && (
              <KanjiCard
                data={currentDayData}
                isDark={isDark}
                theme={theme}
                speak={speak}
                isSpeaking={isSpeaking}
                showStrokeAnimation={showStrokeAnimation}
                setShowStrokeAnimation={setShowStrokeAnimation}
              />
            )}

            {/* Empty State */}
            {!currentDayData.word && !currentDayData.kanji && (
              <div className={`${theme.card} rounded-3xl p-8 border ${theme.cardBorder} ${theme.cardShadow} text-center`}>
                <div className={`w-20 h-20 mx-auto rounded-3xl ${isDark ? 'bg-white/5' : 'bg-slate-100'} flex items-center justify-center mb-4`}>
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className={`font-bold text-lg ${theme.text} mb-1`}>No content for this day</h3>
                <p className={theme.textMuted}>この日のコンテンツはありません</p>
              </div>
            )}
          </>
        )}

        {/* Schedule / Tasks Section */}
        <ScheduleSection isDark={isDark} theme={theme} selectedDate={selectedDate} />
      </div>
    </div>
  );
}

// Schedule Section Component
function ScheduleSection({
  isDark,
  theme,
  selectedDate,
}: {
  isDark: boolean;
  theme: Record<string, string>;
  selectedDate: Date;
}) {
  // Sample tasks - in a real app these would come from a database/state
  const [tasks, setTasks] = useState<Array<{id: string; text: string; completed: boolean; time?: string}>>([
    { id: '1', text: 'Review N5 vocabulary', completed: false, time: '09:00' },
    { id: '2', text: 'Practice kanji writing', completed: true, time: '14:00' },
    { id: '3', text: 'Complete grammar exercises', completed: false, time: '18:00' },
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className={`${theme.card} rounded-3xl border ${theme.cardBorder} ${theme.cardShadow} overflow-hidden`}>
      {/* Header */}
      <div className={`px-5 py-3 flex items-center justify-between border-b ${theme.cardBorder}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
          }`}>
            <span className="text-sm">📋</span>
          </div>
          <div>
            <h3 className={`font-bold text-sm ${theme.text}`}>
              {isToday ? '今日の予定' : 'スケジュール'}
            </h3>
            <p className={`text-[10px] ${theme.textMuted}`}>
              {isToday ? "Today's Schedule" : 'Schedule'}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
          isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
        }`}>
          {tasks.filter(t => !t.completed).length} 件
        </span>
      </div>

      {/* Tasks List */}
      <div className="p-4 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-6">
            <p className={`text-sm ${theme.textMuted}`}>予定はありません</p>
            <p className={`text-xs ${theme.textSubtle} mt-1`}>No scheduled tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.98] ${
                task.completed
                  ? isDark ? 'bg-white/[0.02]' : 'bg-slate-50'
                  : isDark ? 'bg-white/[0.05]' : 'bg-white'
              } ${isDark ? 'border border-white/[0.05]' : 'border border-slate-100'}`}
            >
              {/* Checkbox */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                task.completed
                  ? 'bg-emerald-500 border-emerald-500'
                  : isDark ? 'border-slate-500' : 'border-slate-300'
              }`}>
                {task.completed && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Task Content */}
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${
                  task.completed
                    ? `line-through ${theme.textMuted}`
                    : theme.text
                }`}>
                  {task.text}
                </p>
                {task.time && (
                  <p className={`text-xs ${theme.textSubtle}`}>{task.time}</p>
                )}
              </div>

              {/* Time indicator */}
              {!task.completed && task.time && (
                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'
                }`}>
                  {task.time}
                </div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Add Task Button */}
      <div className={`px-4 pb-4`}>
        <button className={`w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
          isDark
            ? 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] border border-white/[0.05]'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          タスクを追加
        </button>
      </div>
    </div>
  );
}

// Word Card Component
function WordCard({
  data,
  isDark,
  theme,
  speak,
  isSpeaking,
}: {
  data: DayData;
  isDark: boolean;
  theme: Record<string, string>;
  speak: (text: string) => void;
  isSpeaking: (text: string) => boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      className={`${theme.card} rounded-3xl border ${theme.cardBorder} ${theme.cardShadow} overflow-hidden transition-transform duration-200 ${isPressed ? 'scale-[0.98]' : ''}`}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      {/* Header */}
      <div className={`px-5 py-3 flex items-center justify-between border-b ${theme.cardBorder}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-violet-500/20' : 'bg-violet-100'
          }`}>
            <span className="text-sm">📖</span>
          </div>
          <div>
            <h3 className={`font-bold text-sm ${theme.text}`}>今日の単語</h3>
            <p className={`text-[10px] ${theme.textMuted}`}>Word of the Day</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <FavoriteButton
            word={data.word || ''}
            reading={data.wordReading || ''}
            english={data.wordMeaning || ''}
            partOfSpeech={data.wordPartOfSpeech?.toLowerCase() as 'noun' | 'verb'}
          />
          <WordNoteButton
            word={data.word || ''}
            reading={data.wordReading || ''}
            english={data.wordMeaning || ''}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Part of speech */}
        {data.wordPartOfSpeech && (
          <div className="flex justify-center mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'
            }`}>
              {data.wordPartOfSpeech}
            </span>
          </div>
        )}

        {/* Main word with audio */}
        <div className="text-center">
          <button
            onClick={() => speak(data.word || '')}
            className="group relative inline-block"
          >
            <p className={`text-5xl font-bold ${theme.text} group-active:scale-95 transition-transform`}>
              {data.word}
            </p>
            {/* Audio indicator */}
            <div className={`absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              isSpeaking(data.word || '')
                ? 'bg-violet-500 text-white scale-110'
                : `${isDark ? 'bg-white/10' : 'bg-slate-100'} opacity-0 group-hover:opacity-100`
            }`}>
              <span className="text-xs">🔊</span>
            </div>
          </button>
          <p className={`text-xl mt-2 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
            {data.wordReading}
          </p>
        </div>

        {/* Meaning */}
        <p className={`mt-4 text-center text-lg ${theme.textMuted}`}>
          {data.wordMeaning}
        </p>
      </div>
    </div>
  );
}

// Kanji Card Component
function KanjiCard({
  data,
  isDark,
  theme,
  speak,
  isSpeaking,
  showStrokeAnimation,
  setShowStrokeAnimation,
}: {
  data: DayData;
  isDark: boolean;
  theme: Record<string, string>;
  speak: (text: string) => void;
  isSpeaking: (text: string) => boolean;
  showStrokeAnimation: boolean;
  setShowStrokeAnimation: (show: boolean) => void;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      className={`${theme.card} rounded-3xl border ${theme.cardBorder} ${theme.cardShadow} overflow-hidden transition-transform duration-200 ${isPressed ? 'scale-[0.98]' : ''}`}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      {/* Header */}
      <div className={`px-5 py-3 flex items-center justify-between border-b ${theme.cardBorder}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
          }`}>
            <span className={`text-sm font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>漢</span>
          </div>
          <div>
            <h3 className={`font-bold text-sm ${theme.text}`}>今日の漢字</h3>
            <p className={`text-[10px] ${theme.textMuted}`}>Kanji of the Day</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {data.kanjiStrokeCount && (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
              isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}>
              {data.kanjiStrokeCount}画
            </span>
          )}
          <FavoriteButton
            word={data.kanji || ''}
            reading={data.kanjiReading || ''}
            english={data.kanjiMeaning || ''}
            partOfSpeech="kanji"
          />
          <WordNoteButton
            word={data.kanji || ''}
            reading={data.kanjiReading || ''}
            english={data.kanjiMeaning || ''}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Main kanji with audio */}
        <div className="text-center">
          <button
            onClick={() => speak(data.kanji || '')}
            className="group relative inline-block"
          >
            <p className={`text-7xl font-bold ${theme.text} group-active:scale-95 transition-transform`}>
              {data.kanji}
            </p>
            {/* Audio indicator */}
            <div className={`absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              isSpeaking(data.kanji || '')
                ? 'bg-indigo-500 text-white scale-110'
                : `${isDark ? 'bg-white/10' : 'bg-slate-100'} opacity-0 group-hover:opacity-100`
            }`}>
              <span className="text-xs">🔊</span>
            </div>
          </button>
        </div>

        {/* Meaning */}
        <p className={`mt-3 text-center text-xl font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
          {data.kanjiMeaning}
        </p>

        {/* Readings - horizontal pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {data.kanjiOnyomi && data.kanjiOnyomi.length > 0 && (
            <div className={`px-4 py-2 rounded-2xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
              <span className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>音 </span>
              <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                {data.kanjiOnyomi.slice(0, 2).join('・')}
              </span>
            </div>
          )}
          {data.kanjiKunyomi && data.kanjiKunyomi.length > 0 && (
            <div className={`px-4 py-2 rounded-2xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <span className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>訓 </span>
              <span className={`font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                {data.kanjiKunyomi.slice(0, 2).join('・')}
              </span>
            </div>
          )}
        </div>

        {/* Stroke Animation Toggle */}
        <button
          onClick={() => setShowStrokeAnimation(!showStrokeAnimation)}
          className={`w-full mt-4 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
            showStrokeAnimation
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
              : isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>✏️</span>
          <span>{showStrokeAnimation ? '書き順を隠す' : '書き順を見る'}</span>
        </button>
      </div>

      {/* Stroke Animation Panel */}
      {showStrokeAnimation && (
        <div className={`border-t ${theme.cardBorder} p-4 animate-fadeInUp`}>
          <StrokeAnimation character={data.kanji || ''} isDark={isDark} />
        </div>
      )}
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
  onMonthChange,
}: {
  year: number;
  month: number;
  selectedDate: Date;
  dayData: Record<string, DayData>;
  isDark: boolean;
  onDateSelect: (date: Date) => void;
  onMonthChange: (delta: number) => void;
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
    <div className={`mx-4 mt-2 rounded-3xl overflow-hidden border ${
      isDark ? 'bg-[#1a1a2e]/90 backdrop-blur-xl border-white/10' : 'bg-white/90 backdrop-blur-xl border-slate-200'
    } shadow-2xl animate-fadeInUp`}>
      {/* Month navigation */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        <button
          onClick={() => onMonthChange(-1)}
          className={`p-2 rounded-xl transition-all active:scale-90 ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {year}年 {month}月
        </h3>
        <button
          onClick={() => onMonthChange(1)}
          className={`p-2 rounded-xl transition-all active:scale-90 ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/10">
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-bold ${
              idx === 5 ? 'text-blue-500' : idx === 6 ? 'text-red-500' : isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 p-1">
        {days.map(({ date, day, isCurrentMonth }, idx) => {
          const dateKey = formatDateKey(date);
          const data = dayData[dateKey];
          const dayOfWeek = date.getDay();
          const hasData = data?.word || data?.kanji;

          return (
            <button
              key={idx}
              onClick={() => onDateSelect(date)}
              className={`aspect-square m-0.5 rounded-xl flex flex-col items-center justify-center transition-all active:scale-90 ${
                !isCurrentMonth ? 'opacity-30' : ''
              } ${isSelected(date)
                ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg'
                : isToday(date)
                ? isDark ? 'bg-violet-500/20 ring-1 ring-violet-500/50' : 'bg-violet-100 ring-1 ring-violet-300'
                : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
              }`}
            >
              <span className={`text-sm font-semibold ${
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
                  isSelected(date) ? 'bg-white/70' : 'bg-violet-500'
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
