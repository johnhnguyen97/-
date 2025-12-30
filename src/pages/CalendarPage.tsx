import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { LearningCalendar } from '../components/LearningCalendar/LearningCalendar';
import { FullCalendarView } from '../components/Calendar/FullCalendarView';

export function CalendarPage() {
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'word'>('calendar');

  // Theme classes
  const theme = {
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-100',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-slate-400' : 'text-gray-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-gray-400',
    tabActive: isDark
      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md',
    tabInactive: isDark
      ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
      : 'bg-white/80 text-gray-600 hover:bg-gray-100',
    kanjiColor: isDark ? 'text-white/[0.03]' : 'text-emerald-200/30',
  };

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div className={`min-h-[calc(100vh-4rem)] transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-600/5 rounded-full blur-[120px]"></div>
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-teal-100/30 to-transparent rounded-full blur-3xl"></div>
          </>
        )}
        {/* Decorative kanji */}
        <div className={`absolute top-20 right-20 text-[150px] font-serif select-none ${theme.kanjiColor}`}>暦</div>
        <div className={`absolute bottom-40 left-10 text-[120px] font-serif select-none ${theme.kanjiColor}`}>日</div>
      </div>

      <div className="relative z-10 py-6 px-4 max-w-6xl mx-auto">
        {/* Page Header */}
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg ${
              isDark ? 'bg-gradient-to-br from-emerald-600 to-teal-600' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
            }`}>
              📅
            </div>
            <div className="text-left">
              <h1 className={`text-xl md:text-2xl font-bold ${theme.text}`}>Calendar</h1>
              <p className={`text-sm ${theme.textMuted}`}>Track progress & daily words</p>
            </div>
          </div>
        </header>

        {/* Tab Buttons */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'calendar' ? theme.tabActive : theme.tabInactive
            }`}
          >
            📅 Full Calendar
          </button>
          <button
            onClick={() => setActiveTab('word')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'word' ? theme.tabActive : theme.tabInactive
            }`}
          >
            🌸 Word of the Day
          </button>
        </div>

        {/* Content */}
        <div className={`backdrop-blur-sm rounded-2xl shadow-lg border overflow-hidden ${theme.card}`}>
          {activeTab === 'calendar' ? (
            <div className="p-4 md:p-6 h-[600px] md:h-[700px]">
              <FullCalendarView embedded />
            </div>
          ) : (
            <div className="p-4 md:p-6">
              <LearningCalendar embedded />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
