import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  theme: {
    bg: string;
    card: string;
    cardHover: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    border: string;
    input: string;
    accent: string;
    accentBg: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('gojun-dark-mode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('gojun-dark-mode', String(isDark));
    // Update document class for global styles
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const theme = {
    bg: isDark ? 'bg-[#0f0f1a]' : 'bg-gradient-to-br from-slate-50 via-white to-pink-50/30',
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200/60 shadow-sm',
    cardHover: isDark ? 'hover:bg-white/10 hover:border-white/20' : 'hover:shadow-md hover:border-slate-300/60',
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-slate-400',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    input: isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400',
    accent: isDark ? 'text-pink-400' : 'text-pink-600',
    accentBg: isDark ? 'bg-pink-500/20' : 'bg-pink-50',
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
