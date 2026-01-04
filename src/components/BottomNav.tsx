import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

// SVG Icons for cleaner look
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
      d={active
        ? "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      }
    />
  </svg>
);

const GameIcon = ({ active }: { active: boolean }) => (
  <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const DrillIcon = ({ active }: { active: boolean }) => (
  <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const RadicalIcon = ({ active }: { active: boolean }) => (
  <div className={`w-6 h-6 flex items-center justify-center text-base font-bold ${active ? '' : 'font-normal'}`}>
    部
  </div>
);

const CalendarIcon = ({ active }: { active: boolean }) => (
  <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <HomeIcon active={false} /> },
  { path: '/word-game', label: 'Word', icon: <GameIcon active={false} /> },
  { path: '/pattern-drill', label: 'Drill', icon: <DrillIcon active={false} /> },
  { path: '/radical-practice', label: 'Radical', icon: <RadicalIcon active={false} /> },
  { path: '/calendar', label: 'Calendar', icon: <CalendarIcon active={false} /> },
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
        left: itemRect.left - navRect.left + (itemRect.width / 2) - 24,
        width: 48,
      });
    }
  }, [activeIndex]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-6 pt-2 pointer-events-none">
      {/* Floating pill container */}
      <div
        ref={navRef}
        className={`relative mx-auto max-w-md rounded-[28px] pointer-events-auto transition-all duration-300 ${
          isDark
            ? 'bg-[#1a1a2e]/95 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)]'
            : 'bg-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.05)]'
        } backdrop-blur-xl`}
      >
        {/* Active indicator pill - animated background */}
        <div
          className="absolute top-2 h-[calc(100%-16px)] rounded-2xl transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            background: isDark
              ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
              : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
          }}
        />

        {/* Navigation items */}
        <div className="relative flex items-center justify-around px-2 py-3">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                ref={el => { itemRefs.current[index] = el; }}
                className={`relative flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-white scale-105'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200 active:scale-95'
                      : 'text-slate-500 hover:text-slate-700 active:scale-95'
                }`}
              >
                {/* Icon */}
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {item.path === '/' && <HomeIcon active={isActive} />}
                  {item.path === '/word-game' && <GameIcon active={isActive} />}
                  {item.path === '/pattern-drill' && <DrillIcon active={isActive} />}
                  {item.path === '/radical-practice' && <RadicalIcon active={isActive} />}
                  {item.path === '/calendar' && <CalendarIcon active={isActive} />}
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Safe area spacer for iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}

export default BottomNav;
