import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { KanaChart } from './KanaChart';
import { NotesPanel } from './NotesPanel';
import { GrammarGuide } from './GrammarGuide';
import { TodoWidget } from './TodoWidget';
import { TimerWidget } from './TimerWidget';
import { KanjiDictionary } from './Kanji/KanjiDictionary';

export function ToolboxButton() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isKanaChartOpen, setIsKanaChartOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isGrammarGuideOpen, setIsGrammarGuideOpen] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
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

  const handleTodoClick = () => {
    setIsTodoOpen(true);
    setIsMenuOpen(false);
  };

  const handleTimerClick = () => {
    setIsTimerOpen(true);
    setIsMenuOpen(false);
  };

  const handleDictionaryClick = () => {
    setIsDictionaryOpen(true);
    setIsMenuOpen(false);
  };

  const menuItems = [
    { icon: '📖', label: 'Grammar Guide', sublabel: '文法', onClick: handleGrammarGuideClick, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-200' },
    { icon: 'あ', label: 'Kana Chart', sublabel: '仮名', onClick: handleKanaChartClick, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-200' },
    { icon: '📝', label: 'Notes', sublabel: 'ノート', onClick: handleNotesClick, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200' },
    { icon: '✓', label: 'Todo List', sublabel: 'タスク', onClick: handleTodoClick, gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-200' },
    { icon: '⏱️', label: 'Timer', sublabel: 'タイマー', onClick: handleTimerClick, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-200' },
  ];

  return (
    <>
      {/* Menu Backdrop */}
      {isMenuOpen && (
        <div
          className={`fixed inset-0 z-30 transition-all duration-300 ${
            menuVisible ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-transparent backdrop-blur-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Fixed button stack - Desktop only (hidden on mobile) */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-40 hidden md:flex flex-col items-center gap-2">
        {/* Settings Button - Top */}
        <Link
          to="/settings"
          className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 ${
            location.pathname === '/settings'
              ? 'scale-90 opacity-50 pointer-events-none bg-gray-400'
              : 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 hover:shadow-xl hover:scale-105 active:scale-95'
          }`}
          title="Settings"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>

        {/* Kanji Dictionary Button - Middle */}
        <button
          onClick={handleDictionaryClick}
          className="w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 hover:shadow-xl hover:scale-105 active:scale-95"
          aria-label="Kanji Dictionary"
          title="Kanji Dictionary"
        >
          <span className="text-xl text-white font-bold">漢</span>
        </button>

        {/* Toolbox FAB - Bottom */}
        <div className="relative">
          {/* Menu Container */}
          {isMenuOpen && (
            <div className={`absolute bottom-14 right-0 transition-all duration-300 ease-out ${
              menuVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
            }`}>
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden p-2 min-w-[220px]">
                {/* Decorative header */}
                <div className="px-3 py-2 mb-1">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>🧰</span>
                    <span>Toolbox</span>
                    <span className="text-gray-300">道具箱</span>
                  </div>
                </div>

                {menuItems.map((item, index) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all group"
                    style={{
                      animation: menuVisible ? `slideInFromRight 0.3s ease-out ${index * 0.05}s forwards` : 'none',
                      opacity: 0,
                      transform: 'translateX(20px)',
                    }}
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white text-lg shadow-lg ${item.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-200`}>
                      {item.icon}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-800 text-sm group-hover:text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.sublabel}</p>
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              {/* Decorative pointer */}
              <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white/95 rotate-45 border-r border-b border-gray-100"></div>
            </div>
          )}

          {/* Main FAB */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`relative w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 ${
              isMenuOpen
                ? 'bg-gradient-to-br from-gray-700 to-gray-900 rotate-45 scale-95'
                : 'bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
            aria-label="Toolbox"
            title="Toolbox"
          >
            <svg
              className={`w-5 h-5 text-white transition-all duration-300`}
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
      </div>

      {/* Mobile Compact Toolbox - single button with popup */}
      <div className="fixed bottom-24 right-4 z-40 md:hidden flex flex-col items-center gap-2">
        {/* Settings Button */}
        <Link
          to="/settings"
          className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
            location.pathname === '/settings'
              ? 'scale-90 opacity-50 pointer-events-none bg-gray-400'
              : 'bg-white/90 backdrop-blur-sm border border-gray-200 hover:shadow-xl active:scale-95'
          }`}
          title="Settings"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>

        {/* Kanji Dictionary Button */}
        <button
          onClick={handleDictionaryClick}
          className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-xl active:scale-95"
          aria-label="Kanji Dictionary"
        >
          <span className="text-sm text-white font-bold">漢</span>
        </button>

        {/* Main Toolbox FAB */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`relative w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
              isMenuOpen
                ? 'bg-gray-700 rotate-45 scale-95'
                : 'bg-gradient-to-br from-pink-500 to-rose-500 hover:shadow-xl active:scale-95'
            }`}
            aria-label="Toolbox"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className={`absolute bottom-12 right-0 transition-all duration-300 ease-out ${
              menuVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
            }`}>
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden p-2 min-w-[200px]">
                {/* Header */}
                <div className="px-3 py-2 mb-1 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧰</span>
                    <span className="font-semibold text-gray-700">道具箱</span>
                  </div>
                </div>

                {/* Menu items */}
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md`}>
                      <span className="text-white text-sm">{item.icon}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.sublabel}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pointer */}
              <div className="absolute -bottom-2 right-3 w-4 h-4 bg-white/95 rotate-45 border-r border-b border-gray-100"></div>
            </div>
          )}
        </div>
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

      {/* Todo List Modal */}
      {isTodoOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsTodoOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="relative">
                <button
                  onClick={() => setIsTodoOpen(false)}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                >
                  ✕
                </button>
                <TodoWidget />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Timer Modal */}
      {isTimerOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsTimerOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="relative">
                <button
                  onClick={() => setIsTimerOpen(false)}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                >
                  ✕
                </button>
                <TimerWidget />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Kanji Dictionary */}
      <KanjiDictionary
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />
    </>
  );
}
