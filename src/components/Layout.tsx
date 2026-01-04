import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ToolboxButton } from './ToolboxButton';
import { BottomNav } from './BottomNav';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    // Load user's name from localStorage
    try {
      const saved = localStorage.getItem('gojun-user-profile');
      if (saved) {
        const profile = JSON.parse(saved);
        if (profile.firstName) {
          setDisplayName(profile.firstName);
        } else if (session?.user.email) {
          setDisplayName(session.user.email.split('@')[0]);
        }
      } else if (session?.user.email) {
        setDisplayName(session.user.email.split('@')[0]);
      }
    } catch (e) {
      if (session?.user.email) {
        setDisplayName(session.user.email.split('@')[0]);
      }
    }
  }, [session]);

  const navItems = [
    { path: '/', label: '🏠 Home' },
    { path: '/word-game', label: '📝 Word Game' },
    { path: '/pattern-drill', label: '🔄 Pattern Drill' },
    { path: '/radical-practice', label: '部 Radical Game' },
    { path: '/calendar', label: '📅 Calendar' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark
        ? 'bg-[#0f0f1a]'
        : 'bg-gradient-to-br from-slate-50 via-white to-pink-50/30'
    }`}>
      {/* Navigation Header */}
      <nav className={`sticky top-0 z-40 transition-colors duration-300 ${
        isDark
          ? 'bg-[#0f0f1a]/80 backdrop-blur-2xl border-b border-white/[0.08]'
          : 'bg-white/70 backdrop-blur-2xl border-b border-slate-200/50'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo - Japanese styled */}
            <Link
              to="/"
              className="flex items-center gap-2"
            >
              <span className={`text-lg font-bold ${
                isDark
                  ? 'text-pink-400'
                  : 'text-pink-600'
              }`}>
                語順
              </span>
              <span className={`text-sm font-medium ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Gojun
              </span>
            </Link>

            {/* Nav Links - Desktop only */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === item.path
                      ? isDark
                        ? 'bg-pink-500/20 text-pink-400'
                        : 'bg-pink-100 text-pink-700'
                      : isDark
                        ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right Side - Theme Toggle & Auth */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.05] hover:bg-white/10 text-amber-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? '🌙' : '☀️'}
              </button>

              {session ? (
                <Link
                  to="/settings"
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-full transition-all active:scale-95 ${
                    isDark
                      ? 'hover:bg-white/[0.05]'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${
                    isDark
                      ? 'bg-gradient-to-br from-pink-500 to-purple-600'
                      : 'bg-gradient-to-br from-pink-500 to-rose-500'
                  }`}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    {displayName}
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all active:scale-95 ${
                    isDark
                      ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
                      : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                  }`}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Add bottom padding on mobile for bottom nav */}
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Toolbox Button - Available on all pages */}
      <ToolboxButton />

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  );
};
