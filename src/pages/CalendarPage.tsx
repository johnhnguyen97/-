import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { LearningCalendar } from '../components/LearningCalendar/LearningCalendar';
import { formatJapaneseDate } from '../lib/gojun-ui/tokens';
import { TaskPanel } from '../components/Calendar';
import { StrokeAnimation } from '../components/Kanji/StrokeAnimation';
import { KanjiAudio } from '../components/Kanji/KanjiAudio';
import { FavoriteButton } from '../components/FavoriteButton';
import { WordNoteButton } from '../components/WordNoteButton';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

// Format date as YYYY-MM-DD
function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

type ViewMode = 'calendar' | 'learning';

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

export function CalendarPage() {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewMode>('calendar');
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

  // Word audio
  const { speak: speakWord, speaking: speakingWord } = useSpeechSynthesis({ lang: 'ja-JP', rate: 0.8 });

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
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white/90 border-pink-100',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-slate-400' : 'text-gray-500',
    tabActive: isDark
      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/20'
      : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30',
    tabInactive: isDark
      ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
      : 'bg-white/80 text-gray-600 hover:bg-pink-50 border border-pink-100',
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
      </div>

      <div className="relative z-10">
        {/* Tab Navigation */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-pink-100 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    activeTab === 'calendar' ? theme.tabActive : theme.tabInactive
                  }`}
                >
                  🌸 カレンダー
                </button>
                <button
                  onClick={() => setActiveTab('learning')}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    activeTab === 'learning' ? theme.tabActive : theme.tabInactive
                  }`}
                >
                  ✨ 今日の学習
                </button>
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
        </div>

        {/* Content */}
        {activeTab === 'calendar' && (
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Header with month/year */}
            <div className="text-center mb-4">
              <h1 className={`text-3xl font-bold ${theme.text}`}>{dateInfo.western}</h1>
              <p className={`text-sm ${theme.textMuted}`}>{dateInfo.reiwa}</p>
            </div>

            {/* Dashboard Layout */}
            <div className={`${isMobile ? '' : 'flex gap-6'}`}>
              {/* Calendar Grid */}
              <div className={`${isMobile ? 'w-full' : 'flex-1'}`}>
                <div className={`rounded-2xl overflow-hidden border shadow-lg ${theme.card}`}>
                  {/* Calendar Header */}
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-pink-100 bg-pink-50/50'
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
                          className={`
                            min-h-[90px] p-1.5 border-b border-r border-pink-100/50 dark:border-white/5
                            cursor-pointer transition-all hover:bg-pink-50 dark:hover:bg-white/5
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

                          {/* Kanji */}
                          {data?.kanji && (
                            <div className="text-center text-2xl font-bold text-pink-600 dark:text-pink-400">
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
                  <h3 className={`font-bold text-lg ${theme.text}`}>
                    {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Expandable Cards Container */}
                <div className={`rounded-b-2xl border shadow-lg overflow-hidden ${theme.card}`}>
                  {/* Word of the Day Card */}
                  <div className={`border-b ${isDark ? 'border-white/10' : 'border-pink-100'}`}>
                    <button
                      onClick={() => setWordExpanded(!wordExpanded)}
                      className={`w-full px-4 py-3 flex items-center justify-between ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-pink-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📚</span>
                        <span className={`font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>今日の単語</span>
                        {selectedDayData.wordPartOfSpeech && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
                          }`}>
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
                        {/* Word Display */}
                        <div className="text-center py-4">
                          <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {selectedDayData.word}
                          </p>
                          <p className={`text-lg mt-1 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                            {selectedDayData.wordReading}
                          </p>
                          <p className={`mt-2 ${theme.textMuted}`}>
                            {selectedDayData.wordMeaning}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-3 pt-2 border-t border-pink-100 dark:border-white/10">
                          {/* Audio Button */}
                          <button
                            onClick={() => speakWord(selectedDayData.word || '')}
                            disabled={speakingWord}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                              speakingWord
                                ? 'bg-indigo-500 text-white'
                                : isDark
                                  ? 'bg-white/10 hover:bg-white/20 text-white'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                            </svg>
                            <span className="text-sm font-medium">聴く</span>
                          </button>

                          {/* Favorite */}
                          <div className="scale-150">
                            <FavoriteButton
                              word={selectedDayData.word}
                              reading={selectedDayData.wordReading || ''}
                              english={selectedDayData.wordMeaning || ''}
                              partOfSpeech={selectedDayData.wordPartOfSpeech}
                            />
                          </div>

                          {/* Note */}
                          <div className="scale-150">
                            <WordNoteButton
                              word={selectedDayData.word}
                              reading={selectedDayData.wordReading || ''}
                              english={selectedDayData.wordMeaning || ''}
                            />
                          </div>
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
                  <div className={`border-b ${isDark ? 'border-white/10' : 'border-pink-100'}`}>
                    <button
                      onClick={() => setKanjiExpanded(!kanjiExpanded)}
                      className={`w-full px-4 py-3 flex items-center justify-between ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-pink-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">漢</span>
                        <span className={`font-medium ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>今日の漢字</span>
                        {selectedDayData.kanjiStrokeCount && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isDark ? 'bg-pink-900/50 text-pink-300' : 'bg-pink-100 text-pink-600'
                          }`}>
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
                        {/* Kanji Display */}
                        <div className="text-center py-2">
                          <p className={`text-6xl font-bold ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>
                            {selectedDayData.kanji}
                          </p>
                          <p className={`text-lg mt-1 ${theme.textMuted}`}>
                            {selectedDayData.kanjiReading}
                          </p>
                          <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {selectedDayData.kanjiMeaning}
                          </p>
                        </div>

                        {/* Stroke Animation */}
                        <div className="mt-4">
                          <StrokeAnimation
                            character={selectedDayData.kanji}
                            isDark={isDark}
                          />
                        </div>

                        {/* Audio & Readings */}
                        <div className="mt-4 flex flex-wrap gap-3 justify-center">
                          {selectedDayData.kanjiOnyomi && selectedDayData.kanjiOnyomi.length > 0 && (
                            <KanjiAudio
                              label="On'yomi"
                              reading={selectedDayData.kanjiOnyomi[0]}
                              isDark={isDark}
                            />
                          )}
                          {selectedDayData.kanjiKunyomi && selectedDayData.kanjiKunyomi.length > 0 && (
                            <KanjiAudio
                              label="Kun'yomi"
                              reading={selectedDayData.kanjiKunyomi[0].replace(/[.\-]/g, '')}
                              isDark={isDark}
                            />
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-3 pt-4 mt-4 border-t border-pink-100 dark:border-white/10">
                          {/* Favorite */}
                          <div className="scale-150">
                            <FavoriteButton
                              word={selectedDayData.kanji}
                              reading={selectedDayData.kanjiReading || ''}
                              english={selectedDayData.kanjiMeaning || ''}
                              partOfSpeech="kanji"
                            />
                          </div>

                          {/* Note */}
                          <div className="scale-150">
                            <WordNoteButton
                              word={selectedDayData.kanji}
                              reading={selectedDayData.kanjiReading || ''}
                              english={selectedDayData.kanjiMeaning || ''}
                            />
                          </div>
                        </div>
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

        {activeTab === 'learning' && (
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className={`backdrop-blur-sm rounded-2xl shadow-lg border overflow-hidden ${theme.card}`}>
              <div className="p-4 md:p-6">
                <LearningCalendar embedded />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarPage;
