import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import App from '../App';

export function WordGamePage() {
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Theme classes - match HomePage style
  const theme = {
    bg: isDark ? 'bg-[#0f0f1a]' : 'bg-gradient-to-br from-slate-50 via-white to-pink-50/30',
    kanjiColor: isDark ? 'text-white/[0.03]' : 'text-pink-200/30',
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
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

        {/* Decorative kanji - word/sentence themed */}
        <div className={`absolute top-20 right-16 text-[150px] font-serif select-none ${theme.kanjiColor}`}>語</div>
        <div className={`absolute bottom-32 left-10 text-[120px] font-serif select-none ${theme.kanjiColor}`}>順</div>
      </div>

      {/* App Content */}
      <div className="relative z-10">
        <App embedded isDark={isDark} />
      </div>
    </div>
  );
}

export default WordGamePage;
