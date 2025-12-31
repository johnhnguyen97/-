import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { RadicalDrill } from '../components/Kanji/RadicalGame/RadicalDrill';
import { RadicalInfoSidebar } from '../components/Kanji/RadicalGame/RadicalInfoSidebar';
import type { RadicalDrillQuestion } from '../types/kanji';

export function RadicalPracticePage() {
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<RadicalDrillQuestion | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Theme classes
  const theme = {
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-slate-400' : 'text-gray-500',
    kanjiColor: isDark ? 'text-white/[0.03]' : 'text-purple-200/30',
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-100',
  };

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleQuestionChange = useCallback((question: RadicalDrillQuestion | null, answered: boolean) => {
    setCurrentQuestion(question);
    setIsAnswered(answered);
  }, []);

  const showSidebar = currentQuestion !== null;

  return (
    <div className={`min-h-[calc(100vh-4rem)] transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/5 rounded-full blur-[120px]"></div>
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-100/40 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-pink-100/30 to-transparent rounded-full blur-3xl"></div>
          </>
        )}
        {/* Decorative radicals */}
        <div className={`absolute top-20 right-20 text-[150px] font-serif select-none ${theme.kanjiColor}`}>部</div>
        <div className={`absolute bottom-40 left-10 text-[120px] font-serif select-none ${theme.kanjiColor}`}>首</div>
      </div>

      <div className={`relative z-10 py-6 px-4 mx-auto ${showSidebar ? 'max-w-5xl' : 'max-w-3xl'}`}>
        {/* Page Header */}
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg ${
              isDark ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              <span className="text-white font-bold">部</span>
            </div>
            <div className="text-left">
              <h1 className={`text-xl md:text-2xl font-bold ${theme.text}`}>Radical Practice</h1>
              <p className={`text-sm ${theme.textMuted}`}>Master the 214 Kangxi radicals through focused drills</p>
            </div>
          </div>
        </header>

        {/* Main Content with optional sidebar */}
        <div className={`flex flex-col ${showSidebar ? 'lg:flex-row' : ''} gap-6`}>
          {/* Drill Component */}
          <div className={`flex-1 backdrop-blur-sm rounded-2xl shadow-lg border overflow-hidden ${theme.card}`}>
            <div className="p-4 md:p-6">
              <RadicalDrill
                isDark={isDark}
                onQuestionChange={handleQuestionChange}
              />
            </div>
          </div>

          {/* Sidebar - Only show during gameplay */}
          {showSidebar && currentQuestion && (
            <div className="lg:w-72 flex-shrink-0">
              <RadicalInfoSidebar
                question={currentQuestion}
                isAnswered={isAnswered}
                isDark={isDark}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RadicalPracticePage;
