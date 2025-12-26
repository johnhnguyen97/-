import { useState, useEffect } from 'react';
import { KanaChart } from './KanaChart';
import { NotesPanel } from './NotesPanel';
import { GrammarGuide } from './GrammarGuide';
import { LearningCalendar } from './LearningCalendar/LearningCalendar';
import { FullCalendarView } from './Calendar';

export function ToolboxButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isKanaChartOpen, setIsKanaChartOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isGrammarGuideOpen, setIsGrammarGuideOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFullCalendarOpen, setIsFullCalendarOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      requestAnimationFrame(() => setMenuVisible(true));
    } else {
      setMenuVisible(false);
    }
  }, [isMenuOpen]);

  const handleKanaChartClick = () => {
    setIsKanaChartOpen(true);
    setIsMenuOpen(false);
  };

  const handleNotesClick = () => {
    setIsNotesOpen(true);
    setIsMenuOpen(false);
  };

  const handleGrammarGuideClick = () => {
    setIsGrammarGuideOpen(true);
    setIsMenuOpen(false);
  };

  const handleCalendarClick = () => {
    setIsCalendarOpen(true);
    setIsMenuOpen(false);
  };

  const handleFullCalendarClick = () => {
    setIsFullCalendarOpen(true);
    setIsMenuOpen(false);
  };

  const menuItems = [
    { icon: '🗓️', label: 'Full Calendar', sublabel: 'Month/Week/Day view', onClick: handleFullCalendarClick, color: 'from-blue-500 to-indigo-500' },
    { icon: '📅', label: 'Daily', sublabel: 'Word of the Day', onClick: handleCalendarClick, color: 'from-indigo-500 to-purple-500' },
    { icon: '📖', label: 'Grammar Guide', sublabel: 'Learn patterns', onClick: handleGrammarGuideClick, color: 'from-amber-500 to-orange-500' },
    { icon: 'あ', label: 'Kana Chart', sublabel: 'Hiragana & Katakana', onClick: handleKanaChartClick, color: 'from-pink-500 to-rose-500' },
    { icon: '📝', label: 'Notes', sublabel: 'Favorites & notes', onClick: handleNotesClick, color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30">
        {/* Menu Options */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200 ${
                menuVisible ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu */}
            <div className={`absolute bottom-16 right-0 transition-all duration-200 ${
              menuVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden p-2 min-w-[200px]">
                {menuItems.map((item, index) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all group"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: menuVisible ? 'staggerFadeIn 0.3s ease-out forwards' : 'none',
                      opacity: 0
                    }}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.sublabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 ${
            isMenuOpen
              ? 'bg-gray-800 rotate-45 scale-90'
              : 'bg-gradient-to-br from-amber-500 to-orange-500 hover:shadow-2xl hover:scale-105 active:scale-95'
          }`}
          aria-label="Toolbox"
        >
          <svg
            className="w-6 h-6 text-white transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
      </div>

      {/* Kana Chart Modal */}
      <KanaChart
        isOpen={isKanaChartOpen}
        onClose={() => setIsKanaChartOpen(false)}
      />

      {/* Notes Panel */}
      <NotesPanel
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
      />

      {/* Grammar Guide */}
      {isGrammarGuideOpen && (
        <GrammarGuide onClose={() => setIsGrammarGuideOpen(false)} />
      )}

      {/* Learning Calendar */}
      {isCalendarOpen && (
        <LearningCalendar onClose={() => setIsCalendarOpen(false)} />
      )}

      {/* Full Calendar View */}
      {isFullCalendarOpen && (
        <FullCalendarView onClose={() => setIsFullCalendarOpen(false)} />
      )}
    </>
  );
}
