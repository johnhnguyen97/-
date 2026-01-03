import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

import { formatJapaneseDate, calendar } from '../lib/gojun-ui/tokens';
import { Banner, BannerTitle, BannerSubtitle } from '../lib/gojun-ui/components/Banner/Banner';
import { TaskPanel } from '../components/Calendar';
import { StrokeAnimation } from '../components/Kanji/StrokeAnimation';
import { FavoriteButton } from '../components/FavoriteButton';
import { WordNoteButton } from '../components/WordNoteButton';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

// Format date as YYYY-MM-DD
function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Get seasonal image based on given month (0-indexed: 0=Jan, 11=Dec)
function getSeasonalImage(month: number): string {
  if (month >= 2 && month <= 4) return calendar.seasons.spring;   // Mar, Apr, May
  if (month >= 5 && month <= 7) return calendar.seasons.summer;   // Jun, Jul, Aug
  if (month >= 8 && month <= 10) return calendar.seasons.autumn;  // Sep, Oct, Nov
  return calendar.seasons.winter;                                  // Dec, Jan, Feb
}

// Day data with word and kanji info
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

// Task Creation Overlay Popup Component
function TaskCreationPopup({
  date,
  isDark,
  onClose,
  onSave,
  anchorPosition,
}: {
  date: Date;
  isDark: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  anchorPosition: { x: number; y: number };
}) {
  const [taskText, setTaskText] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const popupWidth = 300;
    const popupHeight = 200;

    let top = anchorPosition.y;
    let left = anchorPosition.x - popupWidth / 2;

    // Keep within viewport
    if (left < 10) left = 10;
    if (left + popupWidth > window.innerWidth - 10) {
      left = window.innerWidth - popupWidth - 10;
    }
    if (top + popupHeight > window.innerHeight - 10) {
      top = anchorPosition.y - popupHeight - 10;
    }

    setPosition({ top, left });

    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [anchorPosition]);

  const handleSave = () => {
    if (taskText.trim()) {
      onSave(taskText.trim());
      onClose();
    }
  };

  const formattedDate = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/20"
        onClick={onClose}
      />
      {/* Popup */}
      <div
        className={`fixed z-[9999] w-[300px] rounded-2xl shadow-2xl overflow-hidden animate-scaleIn ${
          isDark ? 'bg-gray-900 border border-white/20' : 'bg-white border border-purple-200'
        }`}
        style={{ top: position.top, left: position.left }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDark
            ? 'border-white/10 bg-gradient-to-r from-purple-600/30 to-pink-600/30'
            : 'border-purple-100 bg-gradient-to-r from-purple-500 to-pink-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <div>
              <h3 className="font-bold text-white text-sm">New Task</h3>
              <p className="text-xs text-white/70">{formattedDate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            placeholder="What do you need to do?"
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!taskText.trim()}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                taskText.trim()
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                  : isDark
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Add Task
            </button>
          </div>

          <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Syncs with your To-Do List
          </p>
        </div>
      </div>
    </>,
    document.body
  );
}

// Stroke Animation Overlay Popup Component
function StrokeOverlayPopup({
  kanji,
  meaning,
  isDark,
  onClose,
  anchorRef,
}: {
  kanji: string;
  meaning: string;
  isDark: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const popupWidth = 280;
      const popupHeight = 350;

      // Position popup above the button if there's room, otherwise below
      let top = rect.top - popupHeight - 10;
      let left = rect.left + (rect.width / 2) - (popupWidth / 2);

      // If not enough room above, position below
      if (top < 10) {
        top = rect.bottom + 10;
      }

      // Keep within viewport horizontally
      if (left < 10) left = 10;
      if (left + popupWidth > window.innerWidth - 10) {
        left = window.innerWidth - popupWidth - 10;
      }

      // Keep within viewport vertically
      if (top + popupHeight > window.innerHeight - 10) {
        top = window.innerHeight - popupHeight - 10;
      }

      setPosition({ top, left });
    }
  }, [anchorRef]);

  return createPortal(
    <>
      {/* Backdrop - click to close */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />
      {/* Popup */}
      <div
        className={`fixed z-[9999] w-[280px] rounded-2xl shadow-2xl overflow-hidden animate-scaleIn ${
          isDark ? 'bg-gray-900 border border-white/20' : 'bg-white border border-indigo-200'
        }`}
        style={{ top: position.top, left: position.left }}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 pointer-events-none rounded-2xl ${
          isDark ? 'shadow-[0_0_40px_rgba(139,92,246,0.4)]' : 'shadow-[0_0_40px_rgba(99,102,241,0.3)]'
        }`} />

        {/* Header */}
        <div className={`relative flex items-center justify-between px-4 py-3 border-b ${
          isDark
            ? 'border-white/10 bg-gradient-to-r from-indigo-600/30 to-purple-600/30'
            : 'border-indigo-100 bg-gradient-to-r from-indigo-500 to-purple-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <div>
              <h3 className="font-bold text-white text-sm">Stroke Order</h3>
              <p className="text-xs text-white/70">書き順</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Kanji Display */}
          <div className="text-center mb-3">
            <p className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {kanji}
            </p>
            <p className={`mt-1 text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {meaning}
            </p>
          </div>

          {/* Stroke Animation Component */}
          <StrokeAnimation
            character={kanji}
            isDark={isDark}
          />
        </div>
      </div>
    </>,
    document.body
  );
}

export function CalendarPage() {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [dayData, setDayData] = useState<Record<string, DayData>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [jlptLevel, setJlptLevel] = useState<string>('N5');
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Expanded card states
  const [wordExpanded, setWordExpanded] = useState(true);
  const [kanjiExpanded, setKanjiExpanded] = useState(true);

  // Stroke animation overlay state
  const [showStrokeOverlay, setShowStrokeOverlay] = useState(false);
  const strokeButtonRef = useRef<HTMLButtonElement>(null);

  // Task creation popup state (long-press on calendar day)
  const [showTaskPopup, setShowTaskPopup] = useState(false);
  const [taskPopupDate, setTaskPopupDate] = useState<Date>(new Date());
  const [taskPopupPosition, setTaskPopupPosition] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Word audio
  const { speak: speakWord, isSpeaking } = useSpeechSynthesis({ lang: 'ja-JP', rate: 0.8 });

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Theme classes
  const theme = {
    bg: isDark
      ? 'bg-gradient-to-br from-[#1A1625] via-[#1E1B2E] to-[#252033]'
      : 'bg-gradient-to-br from-pink-50 via-white to-purple-50',
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-pink-100',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-slate-400' : 'text-gray-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-slate-400',
    tabActive: isDark
      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/20'
      : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30',
    tabInactive: isDark
      ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
      : 'bg-white/80 text-gray-600 hover:bg-pink-50 border border-pink-100',
    kanjiColor: isDark ? 'text-white/10' : 'text-pink-300/40',
  };

  // Load calendar data
  const loadCalendarData = useCallback(async (year: number, month: number) => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const response = await fetch(
        `/api/calendar?action=range&start=${startStr}&end=${endStr}&jlpt=${jlptLevel}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch calendar data');

      const data = await response.json();
      const newDayData: Record<string, DayData> = {};

      // Process words
      data.words?.forEach((item: { date: string; word: { word: string; reading?: string; meaning?: string; partOfSpeech?: string } }) => {
        const key = item.date;
        const wordData = item.word;
        if (!newDayData[key]) newDayData[key] = {};
        newDayData[key].word = wordData.word;
        newDayData[key].wordReading = wordData.reading;
        newDayData[key].wordMeaning = wordData.meaning;
        newDayData[key].wordPartOfSpeech = wordData.partOfSpeech;
      });

      // Process kanji
      data.kanji?.forEach((item: { date: string; kanji: { kanji: string; onyomi?: string[]; kunyomi?: string[]; meaning?: string; strokeCount?: number } }) => {
        const key = item.date;
        const kanjiData = item.kanji;
        if (!newDayData[key]) newDayData[key] = {};
        newDayData[key].kanji = kanjiData.kanji;
        newDayData[key].kanjiReading = kanjiData.onyomi?.[0] || kanjiData.kunyomi?.[0];
        newDayData[key].kanjiMeaning = kanjiData.meaning;
        newDayData[key].kanjiOnyomi = kanjiData.onyomi;
        newDayData[key].kanjiKunyomi = kanjiData.kunyomi;
        newDayData[key].kanjiStrokeCount = kanjiData.strokeCount;
      });

      // Process holidays
      data.holidays?.forEach((holiday: { date: string; name: string; localName?: string }) => {
        const key = holiday.date;
        if (!newDayData[key]) newDayData[key] = {};
        newDayData[key].isHoliday = true;
        newDayData[key].holidayName = holiday.localName || holiday.name;
      });

      setDayData(newDayData);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, jlptLevel]);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    loadCalendarData(currentYear, currentMonth);
  }, [currentYear, currentMonth, loadCalendarData]);

  const handleMonthChange = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Long-press handlers for task creation
  const handleDayPressStart = (date: Date, event: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    longPressTimerRef.current = setTimeout(() => {
      setTaskPopupDate(date);
      setTaskPopupPosition({ x: clientX, y: clientY });
      setShowTaskPopup(true);
    }, 500); // 500ms long press
  };

  const handleDayPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Save task to database (syncs with TodoWidget)
  const handleSaveTask = async (text: string) => {
    const dateStr = taskPopupDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    const taskWithDate = `[${dateStr}] ${text}`;
    const dueDateStr = taskPopupDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    if (!session?.access_token) {
      // Fallback to localStorage for non-logged-in users
      const existingTodos = JSON.parse(localStorage.getItem('gojun-todos') || '[]');
      const newTodo = {
        id: Date.now().toString(),
        text: taskWithDate,
        completed: false,
        createdAt: Date.now(),
      };
      const updatedTodos = [newTodo, ...existingTodos];
      localStorage.setItem('gojun-todos', JSON.stringify(updatedTodos));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'gojun-todos',
        newValue: JSON.stringify(updatedTodos),
      }));
      return;
    }

    try {
      const response = await fetch('/api/calendar?action=todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: taskWithDate,
          task_type: 'custom',
          due_date: dueDateStr,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  // Get selected day's data
  const getSelectedDayData = () => {
    const dateKey = formatDateKey(selectedDate);
    return dayData[dateKey] || {};
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: Array<{ date: Date; day: number; isCurrentMonth: boolean }> = [];

    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(currentYear, currentMonth - 2, day);
      days.push({ date, day, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      days.push({ date, day, isCurrentMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({ date, day, isCurrentMonth: false });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const dateInfo = formatJapaneseDate(currentYear, currentMonth);
  const weekDays = ['月', '火', '水', '木', '金', '土', '日'];
  const selectedDayData = getSelectedDayData();

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${theme.bg} transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]" />
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-100/40 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full blur-3xl" />
          </>
        )}
        {/* Background kanji watermarks */}
        <div className={`absolute top-20 right-20 text-[150px] font-serif select-none ${theme.kanjiColor}`}>暦</div>
        <div className={`absolute bottom-40 left-10 text-[120px] font-serif select-none ${theme.kanjiColor}`}>日</div>
      </div>

      <div className="relative z-10">
        {/* Content */}
        {(
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Dashboard Layout */}
            <div className={`${isMobile ? '' : 'flex gap-6'}`}>
              {/* Calendar Grid with Banner */}
              <div className={`${isMobile ? 'w-full' : 'flex-1'}`}>
                <div className={`rounded-2xl overflow-hidden border shadow-lg ${theme.card}`}>
                  {/* Banner inside calendar card */}
                  <Banner
                    image={getSeasonalImage(currentMonth)}
                    height="140px"
                    blend="bottom"
                    animate={true}
                    month={currentMonth}
                  >
                    <BannerTitle>{dateInfo.western}</BannerTitle>
                    <BannerSubtitle>{dateInfo.reiwa}</BannerSubtitle>
                  </Banner>

                  {/* Calendar Header */}
                  <div className={`flex items-center justify-between px-4 py-3 border-b -mt-4 relative z-10 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-pink-100 bg-white/90'
                  }`}>
                    <button
                      onClick={() => handleMonthChange(-1)}
                      className="p-2 rounded-lg hover:bg-pink-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setCurrentYear(new Date().getFullYear()); setCurrentMonth(new Date().getMonth() + 1); }}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-pink-500 text-white hover:bg-pink-600 transition-colors"
                      >
                        今日
                      </button>
                      <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {currentYear}年 {currentMonth}月
                      </h2>
                    </div>
                    <button
                      onClick={() => handleMonthChange(1)}
                      className="p-2 rounded-lg hover:bg-pink-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Week Days Header */}
                  <div className="grid grid-cols-7 border-b border-pink-100 dark:border-white/10">
                    {weekDays.map((day, idx) => (
                      <div
                        key={day}
                        className={`py-2 text-center text-sm font-semibold ${
                          idx === 5 ? 'text-blue-500' : idx === 6 ? 'text-red-500' : theme.textMuted
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days Grid */}
                  <div className={`grid grid-cols-7 ${isLoading ? 'opacity-50' : ''}`}>
                    {calendarDays.map(({ date, day, isCurrentMonth }, idx) => {
                      const dateKey = formatDateKey(date);
                      const data = dayData[dateKey];
                      const dayOfWeek = date.getDay();
                      const isSunday = dayOfWeek === 0;
                      const isSaturday = dayOfWeek === 6;

                      return (
                        <div
                          key={idx}
                          onClick={() => handleDayClick(date)}
                          onMouseDown={(e) => handleDayPressStart(date, e)}
                          onMouseUp={handleDayPressEnd}
                          onMouseLeave={handleDayPressEnd}
                          onTouchStart={(e) => handleDayPressStart(date, e)}
                          onTouchEnd={handleDayPressEnd}
                          onTouchCancel={handleDayPressEnd}
                          className={`
                            min-h-[90px] p-1.5 border-b border-r border-pink-100/50 dark:border-white/5
                            cursor-pointer transition-all hover:bg-pink-50 dark:hover:bg-white/5
                            select-none
                            ${!isCurrentMonth ? 'opacity-40' : ''}
                            ${isSelected(date) ? 'bg-pink-100 dark:bg-pink-900/30 ring-2 ring-inset ring-pink-400' : ''}
                            ${isToday(date) ? 'bg-pink-50 dark:bg-pink-900/20' : ''}
                          `}
                        >
                          {/* Day Number */}
                          <div className={`text-sm font-semibold mb-1 ${
                            isSunday || data?.isHoliday ? 'text-red-500' :
                            isSaturday ? 'text-blue-500' :
                            isDark ? 'text-gray-200' : 'text-gray-700'
                          } ${isToday(date) ? 'bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''}`}>
                            {day}
                          </div>

                          {/* Kanji - larger and more visible */}
                          {data?.kanji && (
                            <div className="text-center text-3xl font-bold text-pink-600 dark:text-pink-400 drop-shadow-sm">
                              {data.kanji}
                            </div>
                          )}

                          {/* Word Pill */}
                          {data?.word && (
                            <div className={`mt-1 px-1 py-0.5 rounded text-[10px] font-medium truncate text-center ${
                              isDark ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {data.word}
                            </div>
                          )}

                          {/* Holiday */}
                          {data?.isHoliday && data.holidayName && (
                            <div className={`mt-1 px-1 py-0.5 rounded text-[9px] font-medium truncate ${
                              isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {data.holidayName}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className={`mt-4 flex flex-wrap gap-4 text-sm ${theme.textMuted}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-400" />
                    <span>単語</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-pink-400" />
                    <span>漢字</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span>祝日</span>
                  </div>
                </div>
              </div>

              {/* Sidebar - Selected Day Details */}
              <div className={`${isMobile ? 'mt-4' : 'w-96'}`}>
                {/* Selected Day Header */}
                <div className={`rounded-t-2xl border border-b-0 px-4 py-3 ${theme.card} ${
                  isDark ? 'bg-gradient-to-r from-pink-900/30 to-purple-900/30' : 'bg-gradient-to-r from-pink-50 to-purple-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-bold text-lg ${theme.text}`}>
                        {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })}
                      </h3>
                      <p className={`text-xs ${theme.textMuted}`}>
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <select
                      value={jlptLevel}
                      onChange={(e) => setJlptLevel(e.target.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-pink-200 text-gray-700'
                      }`}
                    >
                      <option value="N5">N5</option>
                      <option value="N4">N4</option>
                      <option value="N3">N3</option>
                      <option value="N2">N2</option>
                      <option value="N1">N1</option>
                    </select>
                  </div>
                </div>

                {/* Expandable Cards Container */}
                <div className={`rounded-b-2xl border shadow-lg overflow-hidden ${theme.card}`}>
                  {/* Word of the Day Card */}
                  <div className={`border-b ${isDark ? 'border-white/10' : 'border-pink-100'} relative`}>
                    {/* Favorite/Note buttons - top right */}
                    {selectedDayData.word && (
                      <div className="absolute top-3 right-3 flex gap-1 z-10">
                        <FavoriteButton
                          word={selectedDayData.word}
                          reading={selectedDayData.wordReading || ''}
                          english={selectedDayData.wordMeaning || ''}
                          partOfSpeech={selectedDayData.wordPartOfSpeech?.toLowerCase() as 'noun' | 'verb' | 'adjective' | 'adverb' | 'particle' | 'expression'}
                        />
                        <WordNoteButton
                          word={selectedDayData.word}
                          reading={selectedDayData.wordReading || ''}
                          english={selectedDayData.wordMeaning || ''}
                        />
                      </div>
                    )}

                    <button
                      onClick={() => setWordExpanded(!wordExpanded)}
                      className={`w-full px-4 py-3 flex items-center justify-between ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-pink-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isDark ? 'text-white' : 'text-pink-500'}>🌸</span>
                        <span className={`font-medium ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>今日の単語</span>
                        {selectedDayData.wordPartOfSpeech && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isDark ? 'bg-white/10' : 'bg-pink-100'
                          } ${theme.textMuted}`}>
                            {selectedDayData.wordPartOfSpeech}
                          </span>
                        )}
                      </div>
                      <svg className={`w-5 h-5 transition-transform ${wordExpanded ? 'rotate-180' : ''} ${theme.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {wordExpanded && selectedDayData.word && (
                      <div className="px-4 pb-4">
                        {/* Word Display with inline audio */}
                        <div className="text-center py-4">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {selectedDayData.word}
                            </p>
                            <button
                              onClick={() => speakWord(selectedDayData.word || '')}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all text-lg ${
                                isSpeaking(selectedDayData.word || '')
                                  ? 'bg-pink-500 text-white scale-110'
                                  : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                              }`}
                            >
                              🔊
                            </button>
                          </div>
                          <p className={`text-lg ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>
                            {selectedDayData.wordReading}
                          </p>
                          <p className={`mt-2 ${theme.textMuted}`}>
                            {selectedDayData.wordMeaning}
                          </p>
                        </div>
                      </div>
                    )}

                    {wordExpanded && !selectedDayData.word && (
                      <div className="px-4 pb-4">
                        <p className={`text-sm text-center py-4 ${theme.textMuted}`}>この日の単語はありません</p>
                      </div>
                    )}
                  </div>

                  {/* Kanji of the Day Card */}
                  <div className={`border-b ${isDark ? 'border-white/10' : 'border-pink-100'} relative`}>
                    {/* Favorite/Note buttons - top right */}
                    {selectedDayData.kanji && (
                      <div className="absolute top-3 right-3 flex gap-1 z-10">
                        <FavoriteButton
                          word={selectedDayData.kanji}
                          reading={selectedDayData.kanjiReading || ''}
                          english={selectedDayData.kanjiMeaning || ''}
                          partOfSpeech="kanji"
                        />
                        <WordNoteButton
                          word={selectedDayData.kanji}
                          reading={selectedDayData.kanjiReading || ''}
                          english={selectedDayData.kanjiMeaning || ''}
                        />
                      </div>
                    )}

                    <button
                      onClick={() => setKanjiExpanded(!kanjiExpanded)}
                      className={`w-full px-4 py-3 flex items-center justify-between ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-pink-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isDark ? 'text-indigo-400' : 'text-indigo-500'}>漢</span>
                        <span className={`font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>今日の漢字</span>
                        {selectedDayData.kanjiStrokeCount && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isDark ? 'bg-white/10' : 'bg-indigo-100'
                          } ${theme.textMuted}`}>
                            {selectedDayData.kanjiStrokeCount} strokes
                          </span>
                        )}
                      </div>
                      <svg className={`w-5 h-5 transition-transform ${kanjiExpanded ? 'rotate-180' : ''} ${theme.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {kanjiExpanded && selectedDayData.kanji && (
                      <div className="px-4 pb-4">
                        {/* Kanji Display with inline audio */}
                        <div className="text-center py-2">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <p className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {selectedDayData.kanji}
                            </p>
                            <button
                              onClick={() => speakWord(selectedDayData.kanji || '')}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all text-lg ${
                                isSpeaking(selectedDayData.kanji || '')
                                  ? 'bg-indigo-500 text-white scale-110'
                                  : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                              }`}
                            >
                              🔊
                            </button>
                          </div>
                          <p className={`text-base font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            {selectedDayData.kanjiMeaning}
                          </p>
                        </div>

                        {/* Readings Grid - like HomePage */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {selectedDayData.kanjiOnyomi && selectedDayData.kanjiOnyomi.length > 0 && (
                            <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-lg p-2 text-center`}>
                              <p className={`text-xs ${theme.textSubtle} mb-0.5`}>On'yomi</p>
                              <p className={`text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                {selectedDayData.kanjiOnyomi.slice(0, 2).join(', ')}
                              </p>
                            </div>
                          )}
                          {selectedDayData.kanjiKunyomi && selectedDayData.kanjiKunyomi.length > 0 && (
                            <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-lg p-2 text-center`}>
                              <p className={`text-xs ${theme.textSubtle} mb-0.5`}>Kun'yomi</p>
                              <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                {selectedDayData.kanjiKunyomi.slice(0, 2).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Stroke Animation Button - triggers overlay popup */}
                        <button
                          ref={strokeButtonRef}
                          onClick={() => setShowStrokeOverlay(true)}
                          className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            isDark
                              ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          }`}
                        >
                          <span>✏️</span>
                          <span>See Stroke Animation</span>
                        </button>
                      </div>
                    )}

                    {kanjiExpanded && !selectedDayData.kanji && (
                      <div className="px-4 pb-4">
                        <p className={`text-sm text-center py-4 ${theme.textMuted}`}>この日の漢字はありません</p>
                      </div>
                    )}
                  </div>

                  {/* Holiday Card */}
                  {selectedDayData.isHoliday && selectedDayData.holidayName && (
                    <div className={`px-4 py-4 ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🎌</span>
                        <span className={`font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>祝日</span>
                      </div>
                      <p className={`text-lg font-bold ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>
                        {selectedDayData.holidayName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Google Calendar Sync */}
                <TaskPanel jlptLevel={jlptLevel} className="mt-4" />
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Stroke Animation Overlay Popup */}
      {showStrokeOverlay && selectedDayData.kanji && (
        <StrokeOverlayPopup
          kanji={selectedDayData.kanji}
          meaning={selectedDayData.kanjiMeaning || ''}
          isDark={isDark}
          onClose={() => setShowStrokeOverlay(false)}
          anchorRef={strokeButtonRef}
        />
      )}

      {/* Task Creation Popup (long-press on calendar day) */}
      {showTaskPopup && (
        <TaskCreationPopup
          date={taskPopupDate}
          isDark={isDark}
          onClose={() => setShowTaskPopup(false)}
          onSave={handleSaveTask}
          anchorPosition={taskPopupPosition}
        />
      )}
    </div>
  );
}

export default CalendarPage;
