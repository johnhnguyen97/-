import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { LearningCalendar } from '../components/LearningCalendar/LearningCalendar';
import { FullCalendarView } from '../components/Calendar/FullCalendarView';
import { Banner, BannerTitle, BannerSubtitle, Calendar, type CalendarDayData } from '../lib/gojun-ui';
import { calendar as calendarTokens, formatJapaneseDate } from '../lib/gojun-ui/tokens';
import { KanjiDetailModal, WordDetailModal, EventsPanel, TaskPanel } from '../components/Calendar';
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

type ViewMode = 'japanese' | 'full' | 'word';

// Extended day data with word info
interface ExtendedDayData extends CalendarDayData {
  word?: string;
  wordReading?: string;
  wordMeaning?: string;
  wordPartOfSpeech?: string;
}

export function CalendarPage() {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewMode>('japanese');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [dayData, setDayData] = useState<Record<string, ExtendedDayData>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [jlptLevel, setJlptLevel] = useState<string>('N5');
  const [isMobile, setIsMobile] = useState(false);

  // Modal states
  const [showKanjiModal, setShowKanjiModal] = useState(false);
  const [showWordModal, setShowWordModal] = useState(false);
  const [selectedKanji, setSelectedKanji] = useState<KanjiData | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
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

      const newDayData: Record<string, ExtendedDayData> = {};

      // Process words
      data.words?.forEach((word: { date: string; word: string; reading?: string; meaning?: string; partOfSpeech?: string }) => {
        const key = word.date;
        if (!newDayData[key]) newDayData[key] = { events: [] };
        newDayData[key].word = word.word;
        newDayData[key].wordReading = word.reading;
        newDayData[key].wordMeaning = word.meaning;
        newDayData[key].wordPartOfSpeech = word.partOfSpeech;
        newDayData[key].events?.push({
          id: `word-${key}`,
          type: 'word',
          title: word.word,
        });
      });

      // Process kanji
      data.kanji?.forEach((kanji: { date: string; kanji: string; reading?: string; meaning?: string; onyomi?: string[]; kunyomi?: string[]; strokeCount?: number }) => {
        const key = kanji.date;
        if (!newDayData[key]) newDayData[key] = { events: [] };
        newDayData[key].kanji = kanji.kanji;
        newDayData[key].kanjiReading = kanji.reading;
        newDayData[key].kanjiMeaning = kanji.meaning;
        newDayData[key].events?.push({
          id: `kanji-${key}`,
          type: 'kanji',
          title: kanji.kanji,
        });
      });

      // Process holidays
      data.holidays?.forEach((holiday: { date: string; name: string; localName?: string }) => {
        const key = holiday.date;
        if (!newDayData[key]) newDayData[key] = { events: [] };
        newDayData[key].isHoliday = true;
        newDayData[key].holidayName = holiday.localName || holiday.name;
        newDayData[key].events?.push({
          id: `holiday-${key}`,
          type: 'holiday',
          title: holiday.name,
        });
      });

      setDayData(newDayData);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    }
  }, [session?.access_token, jlptLevel]);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    loadCalendarData(currentYear, currentMonth);
  }, [currentYear, currentMonth, loadCalendarData]);

  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleKanjiClick = (date: Date, _kanji: string) => {
    const dateKey = formatDateKey(date);
    const data = dayData[dateKey];
    if (data?.kanji) {
      setSelectedKanji({
        kanji: data.kanji,
        reading: data.kanjiReading,
        meaning: data.kanjiMeaning,
      });
      setShowKanjiModal(true);
    }
  };

  // Get current day's data for EventsPanel
  const getSelectedDayData = (): { word?: WordData; kanji?: KanjiData; holidays: HolidayData[] } => {
    if (!selectedDate) return { holidays: [] };
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
      } : undefined,
      holidays: data.isHoliday && data.holidayName ? [{ name: data.holidayName }] : [],
    };
  };

  const handleEventWordClick = () => {
    const { word } = getSelectedDayData();
    if (word) {
      setSelectedWord(word);
      setShowWordModal(true);
    }
  };

  const handleEventKanjiClick = () => {
    const { kanji } = getSelectedDayData();
    if (kanji) {
      setSelectedKanji(kanji);
      setShowKanjiModal(true);
    }
  };

  // Get formatted date for banner
  const dateInfo = formatJapaneseDate(currentYear, currentMonth);

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${theme.bg} transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]"></div>
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-100/40 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full blur-3xl"></div>
          </>
        )}
      </div>

      <div className="relative z-10">
        {/* Tab Navigation */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-pink-100 dark:border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Tabs - Japanese names */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('japanese')}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    activeTab === 'japanese' ? theme.tabActive : theme.tabInactive
                  }`}
                >
                  🌸 カレンダー
                </button>
                <button
                  onClick={() => setActiveTab('full')}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    activeTab === 'full' ? theme.tabActive : theme.tabInactive
                  }`}
                >
                  📅 全体表示
                </button>
                <button
                  onClick={() => setActiveTab('word')}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    activeTab === 'word' ? theme.tabActive : theme.tabInactive
                  }`}
                >
                  ✨ 今日の学習
                </button>
              </div>

              {/* JLPT Level Selector */}
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
        {activeTab === 'japanese' && (
          <div className="max-w-4xl mx-auto">
            {/* Seasonal Banner with Reiwa Era */}
            <Banner
              image={getSeasonalImage()}
              height={isMobile ? '160px' : '200px'}
              blend="bottom"
              animate
            >
              <BannerTitle>{dateInfo.western}</BannerTitle>
              <BannerSubtitle>{dateInfo.reiwa}</BannerSubtitle>
            </Banner>

            {/* Japanese Calendar Grid - overlaps banner slightly */}
            <div className="px-4 pb-6 -mt-6">
              <Calendar
                year={currentYear}
                month={currentMonth}
                variant={isMobile ? 'kawaii' : 'default'}
                startMonday={true}
                dayData={dayData}
                selectedDate={selectedDate}
                onDayClick={handleDayClick}
                onKanjiClick={handleKanjiClick}
                onMonthChange={handleMonthChange}
                showNavigation={true}
              />

              {/* Events Panel - Pill Style */}
              <EventsPanel
                selectedDate={selectedDate}
                wordOfTheDay={getSelectedDayData().word}
                kanjiOfTheDay={getSelectedDayData().kanji}
                holidays={getSelectedDayData().holidays}
                jlptLevel={jlptLevel}
                onWordClick={handleEventWordClick}
                onKanjiClick={handleEventKanjiClick}
                className="mt-4"
              />

              {/* Task Panel - Google Calendar Integration */}
              <TaskPanel
                jlptLevel={jlptLevel}
                className="mt-4"
              />

              {/* Legend */}
              <div className={`mt-4 flex flex-wrap gap-4 text-sm ${theme.textMuted}`}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-400"></span>
                  <span>単語</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-pink-400"></span>
                  <span>漢字</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span>祝日</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'full' && (
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className={`backdrop-blur-sm rounded-2xl shadow-lg border overflow-hidden ${theme.card}`}>
              <div className="p-4 md:p-6 h-[600px] md:h-[700px]">
                <FullCalendarView embedded />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'word' && (
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
