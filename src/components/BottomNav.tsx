import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';

interface NavItem {
  path: string;
  label: string;
  kanji: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', kanji: '家', icon: '🏠' },
  { path: '/word-game', label: 'Word', kanji: '語', icon: '📝' },
  { path: '/pattern-drill', label: 'Drill', kanji: '練', icon: '🔄' },
  { path: '/radical-practice', label: 'Radical', kanji: '部', icon: '部' },
  { path: '/calendar', label: 'Calendar', kanji: '暦', icon: '📅' },
];

export function BottomNav() {
  const location = useLocation();
  const { isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Find active index based on current path
  useEffect(() => {
    const index = navItems.findIndex(item => item.path === location.pathname);
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname]);

  // Update indicator position
  useEffect(() => {
    const activeItem = itemRefs.current[activeIndex];
    if (activeItem && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      setIndicatorStyle({
        left: itemRect.left - navRect.left + (itemRect.width / 2) - 26,
        width: 52,
      });
    }
  }, [activeIndex]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-5 pt-2 pointer-events-none">
      {/* Floating pill container - Japanese paper texture feel */}
      <div
        ref={navRef}
        className={`relative mx-auto max-w-sm rounded-3xl pointer-events-auto transition-all duration-300 ${
          isDark
            ? 'bg-[#1a1625]/95 shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)]'
            : 'bg-white/90 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)]'
        } backdrop-blur-2xl`}
      >
        {/* Subtle top border - like ink wash */}
        <div className={`absolute inset-x-4 top-0 h-px ${
          isDark ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-200 to-transparent'
        }`} />

        {/* Active indicator - sakura/ink style */}
        <div
          className="absolute top-2 h-[calc(100%-16px)] rounded-2xl transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            background: isDark
              ? 'linear-gradient(180deg, #ec4899 0%, #db2777 100%)'
              : 'linear-gradient(180deg, #ec4899 0%, #be185d 100%)',
            boxShadow: isDark
              ? '0 4px 16px rgba(236, 72, 153, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 4px 16px rgba(219, 39, 119, 0.35)',
          }}
        />

        {/* Navigation items */}
        <div className="relative flex items-center justify-around px-1 py-2.5">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                ref={el => { itemRefs.current[index] = el; }}
                className={`relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200 active:scale-95'
                      : 'text-slate-500 hover:text-slate-700 active:scale-95'
                }`}
              >
                {/* Kanji character as icon */}
                <span className={`text-lg font-bold transition-all duration-200 ${
                  isActive ? 'scale-110' : ''
                } ${item.kanji === '部' ? 'font-serif' : ''}`}>
                  {item.kanji}
                </span>

                {/* Small label below */}
                <span className={`text-[9px] mt-0.5 font-medium transition-opacity ${
                  isActive ? 'opacity-90' : 'opacity-60'
                }`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default BottomNav;
