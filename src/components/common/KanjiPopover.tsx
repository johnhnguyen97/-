import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getKanjiDetail } from '../../services/kanjiApi';
import type { KanjiDetail } from '../../types/kanji';

interface KanjiPopoverProps {
  character: string;
  children: React.ReactNode;
}

/**
 * Wraps a kanji character and shows dictionary info on hover/tap
 * Uses portal on mobile for proper z-index handling
 */
export function KanjiPopover({ character, children }: KanjiPopoverProps) {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<KanjiDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch kanji detail when opened
  useEffect(() => {
    if (isOpen && !detail && !isLoading) {
      setIsLoading(true);
      getKanjiDetail(character, session?.access_token)
        .then(setDetail)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, character, detail, session?.access_token]);

  // Calculate position for portal (used for both mobile and desktop now)
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 260;
      const popoverHeight = 200;

      // Calculate left position (centered, but clamped to viewport)
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      left = Math.max(16, Math.min(left, window.innerWidth - popoverWidth - 16));

      // Calculate top position (above or below based on space)
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      let top: number;

      if (spaceAbove > spaceBelow && spaceAbove > popoverHeight) {
        // Position above
        top = rect.top - popoverHeight - 8;
      } else {
        // Position below
        top = rect.bottom + 8;
      }

      setPopoverPosition({ top, left });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Desktop: hover with delay
  const handleMouseEnter = () => {
    if (isMobile) return;
    hoverTimeoutRef.current = setTimeout(() => setIsOpen(true), 300);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setTimeout(() => {
      if (!popoverRef.current?.matches(':hover')) {
        setIsOpen(false);
      }
    }, 100);
  };

  // Mobile: tap to toggle
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const theme = {
    bg: isDark ? 'bg-[#1a1a2e]' : 'bg-white',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    shadow: isDark ? 'shadow-2xl shadow-black/50' : 'shadow-xl',
  };

  const popoverContent = (
    <div
      ref={popoverRef}
      className={`fixed z-[9999] min-w-[240px] max-w-[280px] rounded-2xl border backdrop-blur-xl ${theme.bg} ${theme.border} ${theme.shadow} animate-fadeInUp`}
      style={{ top: popoverPosition.top, left: popoverPosition.left }}
      onMouseEnter={() => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      }}
      onMouseLeave={() => !isMobile && setIsOpen(false)}
    >
      {isLoading ? (
        <div className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : detail ? (
        <div className="p-4 space-y-3">
          {/* Character & readings */}
          <div className="flex items-start gap-3">
            <span className={`text-4xl font-bold ${theme.text}`}>{detail.character}</span>
            <div className="flex-1 min-w-0">
              {detail.onyomi && (
                <div className={`text-sm ${theme.textMuted}`}>
                  <span className={`font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>音:</span> {detail.onyomi}
                </div>
              )}
              {detail.kunyomi && (
                <div className={`text-sm ${theme.textMuted}`}>
                  <span className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>訓:</span> {detail.kunyomi}
                </div>
              )}
            </div>
          </div>

          {/* Meanings */}
          {detail.meaningEn && (
            <div className={`text-sm ${theme.text}`}>
              {detail.meaningEn}
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-2 flex-wrap">
            {detail.jlptLevel && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
              }`}>
                N{detail.jlptLevel}
              </span>
            )}
            {detail.strokeCount && (
              <span className={`px-2.5 py-1 rounded-lg text-xs ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                {detail.strokeCount}画
              </span>
            )}
            {detail.grade && (
              <span className={`px-2.5 py-1 rounded-lg text-xs ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                Grade {detail.grade}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className={`p-4 text-sm ${theme.textMuted}`}>
          No data found for {character}
        </div>
      )}

      {/* Close button on mobile */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(false)}
          className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center ${isDark ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'} shadow-lg`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <span className="relative inline">
      <span
        ref={triggerRef}
        className={`cursor-pointer rounded px-0.5 transition-colors ${isDark ? 'hover:bg-amber-500/20' : 'hover:bg-amber-100'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </span>

      {isOpen && createPortal(
        <>
          {/* Backdrop - only on mobile */}
          {isMobile && (
            <div className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          )}
          {popoverContent}
        </>,
        document.body
      )}
    </span>
  );
}

/**
 * Checks if a character is a kanji (CJK Unified Ideographs)
 */
function isKanji(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9faf) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf)    // CJK Unified Ideographs Extension A
  );
}

interface InteractiveTextProps {
  text: string;
  className?: string;
}

/**
 * Renders Japanese text with interactive kanji that show dictionary popups
 */
export function InteractiveText({ text, className = '' }: InteractiveTextProps) {
  const elements: React.ReactNode[] = [];
  let currentRun = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (isKanji(char)) {
      // Flush non-kanji run
      if (currentRun) {
        elements.push(<span key={`text-${i}`}>{currentRun}</span>);
        currentRun = '';
      }
      // Add interactive kanji
      elements.push(
        <KanjiPopover key={`kanji-${i}`} character={char}>
          {char}
        </KanjiPopover>
      );
    } else {
      currentRun += char;
    }
  }

  // Flush remaining
  if (currentRun) {
    elements.push(<span key="text-end">{currentRun}</span>);
  }

  return <span className={className}>{elements}</span>;
}
