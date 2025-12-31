import { useState, useEffect } from 'react';
import { KanaChart } from './KanaChart';
import { NotesPanel } from './NotesPanel';
import { GrammarGuide } from './GrammarGuide';
import { TodoWidget } from './TodoWidget';
import { TimerWidget } from './TimerWidget';
import { KanjiDictionary } from './Kanji/KanjiDictionary';

export function ToolboxButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isKanaChartOpen, setIsKanaChartOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isGrammarGuideOpen, setIsGrammarGuideOpen] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [fabHovered, setFabHovered] = useState(false);

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

  // Calendar is now a page - removed from toolbox
  const menuItems = [
    { icon: '漢', label: 'Kanji Dictionary', sublabel: '漢字辞典', onClick: handleDictionaryClick, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-200' },
    { icon: '📖', label: 'Grammar Guide', sublabel: '文法', onClick: handleGrammarGuideClick, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-200' },
    { icon: 'あ', label: 'Kana Chart', sublabel: '仮名', onClick: handleKanaChartClick, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-200' },
    { icon: '📝', label: 'Notes', sublabel: 'ノート', onClick: handleNotesClick, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200' },
    { icon: '✓', label: 'Todo List', sublabel: 'タスク', onClick: handleTodoClick, gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-200' },
    { icon: '⏱️', label: 'Timer', sublabel: 'タイマー', onClick: handleTimerClick, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-200' },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-30">
        {/* Menu Options */}
        {isMenuOpen && (
          <>
            {/* Backdrop with animation */}
            <div
              className={`fixed inset-0 transition-all duration-300 ${
                menuVisible ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-transparent backdrop-blur-0'
              }`}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Container */}
            <div className={`absolute bottom-16 right-0 transition-all duration-300 ease-out ${
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
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white/95 rotate-45 border-r border-b border-gray-100"></div>
            </div>
          </>
        )}

        {/* Decorative ring when hovered */}
        <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
          fabHovered && !isMenuOpen ? 'opacity-100 scale-[1.4]' : 'opacity-0 scale-100'
        }`}>
          <div className="w-full h-full rounded-2xl border-2 border-amber-300/50 animate-ping"></div>
        </div>

        {/* Main FAB with enhanced animations */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          onMouseEnter={() => setFabHovered(true)}
          onMouseLeave={() => setFabHovered(false)}
          className={`relative w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 ${
            isMenuOpen
              ? 'bg-gradient-to-br from-gray-700 to-gray-900 rotate-45 scale-95'
              : 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 hover:shadow-2xl hover:shadow-amber-200/50 hover:scale-110 active:scale-95'
          }`}
          aria-label="Toolbox"
        >
          {/* Shine effect */}
          {!isMenuOpen && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
            </div>
          )}

          <svg
            className={`w-6 h-6 text-white transition-all duration-300 ${isMenuOpen ? 'rotate-0' : ''}`}
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

        {/* Label tooltip */}
        {fabHovered && !isMenuOpen && (
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 animate-fadeInRight whitespace-nowrap">
            Toolbox
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
          </div>
        )}
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
