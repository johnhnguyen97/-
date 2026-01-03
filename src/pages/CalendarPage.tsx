import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { LearningCalendar } from '../components/LearningCalendar/LearningCalendar';
import { Banner, BannerTitle, BannerSubtitle } from '../lib/gojun-ui';
import { calendar as calendarTokens, formatJapaneseDate } from '../lib/gojun-ui/tokens';
import { KanjiDetailModal, WordDetailModal, TaskPanel } from '../components/Calendar';
import type { WordData, KanjiData, HolidayData } from '../components/Calendar';

// Get seasonal image path
function getSeasonalImage(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return calendarTokens.seasons.spring;
  if (month >= 6 && month <= 8) return calendarTokens.seasons.summer;
  if (month >= 9 && month <= 11) return calendarTokens.seasons.autumn;
  return calendarTokens.seasons.winter;
}

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

  // Modal states
  const [showKanjiModal, setShowKanjiModal] = useState(false);
  const [showWordModal, setShowWordModal] = useState(false);
  const [selectedKanji, setSelectedKanji] = useState<KanjiData | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);

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

      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }

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
  const getSelectedDayData = (): { word?: WordData; kanji?: KanjiData; holidays: HolidayData[] } => {
    const dateKey = formatDateKey(selectedDate);
    const data = dayData[dateKey];
    if (!data) return { holidays: [] };

    return {
      word: data.word ? {
        word: data.word,
        reading: data.wordReading || '',
        meaning: data.wordMeaning || '',
        partOfSpeech: data.wordPartOfSpeech,
      } : undefined,
      kanji: data.kanji ? {
        kanji: data.kanji,
        reading: data.kanjiReading,
        meaning: data.kanjiMeaning,
        onyomi: data.kanjiOnyomi,
        kunyomi: data.kanjiKunyomi,
        strokeCount: data.kanjiStrokeCount,
      } : undefined,
      holidays: data.isHoliday && data.holidayName ? [{ name: data.holidayName }] : [],
    };
  };

  const handleWordClick = (word: WordData) => {
    setSelectedWord(word);
    setShowWordModal(true);
  };

  const handleKanjiClick = (kanji: KanjiData) => {
    setSelectedKanji(kanji);
    setShowKanjiModal(true);
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    let startDayOfWeek = firstDay.getDay();
    // Adjust for Monday start
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

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

    // Next month days
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
                  isDark
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-pink-200 text-gray-700'
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
          <div className="max-w-7xl mx-auto">
            {/* Seasonal Banner */}
            <Banner
              image={getSeasonalImage()}
              height={isMobile ? '140px' : '180px'}
              blend="bottom"
              animate
            >
              <BannerTitle>{dateInfo.western}</BannerTitle>
              <BannerSubtitle>{dateInfo.reiwa}</BannerSubtitle>
            </Banner>

            {/* Dashboard Layout */}
            <div className={`px-4 pb-6 -mt-6 ${isMobile ? '' : 'flex gap-6'}`}>
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
                            min-h-[100px] p-1.5 border-b border-r border-pink-100/50 dark:border-white/5
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
                            <button
                              onClick={(e) => { e.stopPropagation(); handleKanjiClick({ kanji: data.kanji!, reading: data.kanjiReading, meaning: data.kanjiMeaning, onyomi: data.kanjiOnyomi, kunyomi: data.kanjiKunyomi, strokeCount: data.kanjiStrokeCount }); }}
                              className="block w-full text-center text-2xl font-bold text-pink-600 dark:text-pink-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors hover:scale-110"
                            >
                              {data.kanji}
                            </button>
                          )}

                          {/* Word Pill */}
                          {data?.word && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleWordClick({ word: data.word!, reading: data.wordReading || '', meaning: data.wordMeaning || '', partOfSpeech: data.wordPartOfSpeech }); }}
                              className={`
                                mt-1 w-full px-1 py-0.5 rounded text-[10px] font-medium truncate
                                bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300
                                hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors
                              `}
                              title={`${data.word} - ${data.wordMeaning}`}
                            >
                              {data.word}
                            </button>
                          )}

                          {/* Holiday */}
                          {data?.isHoliday && data.holidayName && (
                            <div className="mt-1 px-1 py-0.5 rounded text-[9px] font-medium truncate bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                              {data.holidayName}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend - Desktop */}
                {!isMobile && (
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
                )}
              </div>

              {/* Sidebar - Selected Day Details */}
              <div className={`${isMobile ? 'mt-4' : 'w-80'}`}>
                {/* Selected Day Info */}
                <div className={`rounded-2xl border shadow-lg overflow-hidden ${theme.card}`}>
                  <div className={`px-4 py-3 border-b ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50'
                  }`}>
                    <h3 className={`font-bold ${theme.text}`}>
                      {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })}
                    </h3>
                    <p className={`text-xs ${theme.textMuted}`}>
                      {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Word of the Day */}
                    {selectedDayData.word ? (
                      <div
                        onClick={() => handleWordClick(selectedDayData.word!)}
                        className={`p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                          isDark ? 'bg-indigo-900/30 hover:bg-indigo-900/40' : 'bg-indigo-50 hover:bg-indigo-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">📚</span>
                          <span className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>今日の単語</span>
                        </div>
                        <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {selectedDayData.word.word}
                        </p>
                        <p className={`text-sm ${theme.textMuted}`}>
                          {selectedDayData.word.reading}
                        </p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {selectedDayData.word.meaning}
                        </p>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <p className={`text-sm ${theme.textMuted}`}>この日の単語はありません</p>
                      </div>
                    )}

                    {/* Kanji of the Day */}
                    {selectedDayData.kanji ? (
                      <div
                        onClick={() => handleKanjiClick(selectedDayData.kanji!)}
                        className={`p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                          isDark ? 'bg-pink-900/30 hover:bg-pink-900/40' : 'bg-pink-50 hover:bg-pink-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">漢</span>
                          <span className={`text-xs font-medium ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>今日の漢字</span>
                        </div>
                        <p className={`text-5xl font-bold text-center py-2 ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>
                          {selectedDayData.kanji.kanji}
                        </p>
                        <p className={`text-sm text-center ${theme.textMuted}`}>
                          {selectedDayData.kanji.reading}
                        </p>
                        <p className={`text-sm text-center mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {selectedDayData.kanji.meaning}
                        </p>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <p className={`text-sm ${theme.textMuted}`}>この日の漢字はありません</p>
                      </div>
                    )}

                    {/* Holidays */}
                    {selectedDayData.holidays.length > 0 && (
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🎌</span>
                          <span className={`text-xs font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>祝日</span>
                        </div>
                        {selectedDayData.holidays.map((holiday, idx) => (
                          <p key={idx} className={`font-medium ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>
                            {holiday.name}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
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

      {/* Kanji Detail Modal */}
      <KanjiDetailModal
        isOpen={showKanjiModal}
        onClose={() => setShowKanjiModal(false)}
        kanji={selectedKanji?.kanji || ''}
        reading={selectedKanji?.reading}
        meaning={selectedKanji?.meaning}
        onyomi={selectedKanji?.onyomi}
        kunyomi={selectedKanji?.kunyomi}
        strokeCount={selectedKanji?.strokeCount}
        jlptLevel={jlptLevel}
      />

      {/* Word Detail Modal */}
      <WordDetailModal
        isOpen={showWordModal}
        onClose={() => setShowWordModal(false)}
        word={selectedWord?.word || ''}
        reading={selectedWord?.reading || ''}
        meaning={selectedWord?.meaning || ''}
        partOfSpeech={selectedWord?.partOfSpeech}
        jlptLevel={jlptLevel}
      />
    </div>
  );
}

export default CalendarPage;
