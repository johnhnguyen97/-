import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ToolboxButton } from './ToolboxButton';
import { BottomNav } from './BottomNav';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState<string>('');

  // Redirect to login if not authenticated and not already on login page
  useEffect(() => {
    if (!user && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [user, location.pathname, navigate]);

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
    { path: '/calendar', label: '📅 Calendar' },
    { path: '/settings', label: '⚙️ Settings' },
  ];

  // If not authenticated, show minimal layout with centered login
  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? 'bg-[#0f0f1a]'
          : 'bg-gradient-to-br from-slate-50 via-white to-pink-50/30'
      }`}>
        <main className="min-h-screen flex items-center justify-center py-12 px-4">
          <Outlet />
        </main>
      </div>
    );
  }

  // Full authenticated layout
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark
        ? 'bg-[#0f0f1a]'
        : 'bg-gradient-to-br from-slate-50 via-white to-pink-50/30'
    }`}>
      {/* Navigation Header - Desktop */}
      <nav className={`sticky top-0 z-40 transition-colors duration-300 ${
        isDark
          ? 'bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-white/10'
          : 'bg-white/80 backdrop-blur-sm border-b border-pink-200/30'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link
              to="/"
              className={`text-xl font-bold bg-clip-text text-transparent ${
                isDark
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400'
                  : 'bg-gradient-to-r from-pink-600 to-purple-600'
              }`}
            >
              語順 Gojun
            </Link>

            {/* Nav Links - Desktop only */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 text-yellow-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              {session ? (
                <Link
                  to="/settings"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    isDark
                      ? 'hover:bg-white/10'
                      : 'hover:bg-pink-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    isDark
                      ? 'bg-gradient-to-br from-pink-500 to-purple-500'
                      : 'bg-gradient-to-br from-pink-500 to-pink-600'
                  }`}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    {displayName}
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isDark
                      ? 'text-pink-400 hover:bg-pink-500/20'
                      : 'text-pink-600 hover:bg-pink-50'
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

      {/* Settings FAB - Fixed on right side above toolbox */}
      <Link
        to="/settings"
        className={`fixed z-30 transition-all duration-300 hover:scale-105 ${
          location.pathname === '/settings' ? 'scale-95 opacity-50 pointer-events-none' : ''
        } ${
          isDark
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
            : 'bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400'
        } text-white rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center bottom-40 right-4 md:bottom-32 md:right-6 w-14 h-14`}
        title="Settings"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Link>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  );
};
