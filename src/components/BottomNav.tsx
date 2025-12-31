import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  activeIcon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: '🏠', activeIcon: '🏠' },
  { path: '/word-game', label: 'Word', icon: '📝', activeIcon: '📝' },
  { path: '/pattern-drill', label: 'Drill', icon: '🔄', activeIcon: '🔄' },
  { path: '/kanji', label: 'Kanji', icon: '漢', activeIcon: '漢' },
  { path: '/settings', label: 'Settings', icon: '⚙️', activeIcon: '⚙️' },
];

export function BottomNav() {
  const location = useLocation();
  const { isDark } = useTheme();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Backdrop blur effect */}
      <div className={`absolute inset-0 backdrop-blur-xl transition-colors duration-300 ${
        isDark
          ? 'bg-[#0f0f1a]/90 border-t border-white/10'
          : 'bg-white/80 border-t border-gray-200/50'
      }`} />

      {/* Navigation items */}
      <div className="relative flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? isDark
                    ? 'text-pink-400'
                    : 'text-pink-600'
                  : isDark
                    ? 'text-slate-500 hover:text-slate-300'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {/* Icon */}
              <span className={`text-xl mb-0.5 transition-transform duration-200 ${
                isActive ? 'scale-110' : ''
              }`}>
                {isActive ? item.activeIcon : item.icon}
              </span>

              {/* Label */}
              <span className={`text-[10px] font-medium transition-all duration-200 ${
                isActive
                  ? isDark
                    ? 'text-pink-400'
                    : 'text-pink-600'
                  : ''
              }`}>
                {item.label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <span className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${
                  isDark ? 'bg-pink-400' : 'bg-pink-500'
                }`} />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
