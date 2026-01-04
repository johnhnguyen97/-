import React, { useState, useRef, useEffect } from 'react';
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
 */
export function KanjiPopover({ character, children }: KanjiPopoverProps) {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<KanjiDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<'above' | 'below'>('above');
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Calculate position (above or below)
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceAbove > spaceBelow ? 'above' : 'below');
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
    hoverTimeoutRef.current = setTimeout(() => setIsOpen(true), 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Small delay before closing to allow moving to popover
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
    bg: isDark ? 'bg-gray-800' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    shadow: isDark ? 'shadow-xl shadow-black/30' : 'shadow-lg',
  };

  return (
    <span className="relative inline">
      <span
        ref={triggerRef}
        className="cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded px-0.5 transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </span>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute z-[100] ${position === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 min-w-[200px] max-w-[280px] rounded-lg border ${theme.bg} ${theme.border} ${theme.shadow} animate-fadeInUp`}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={() => setIsOpen(false)}
        >
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : detail ? (
            <div className="p-3 space-y-2">
              {/* Character & readings */}
              <div className="flex items-start gap-3">
                <span className={`text-3xl font-bold ${theme.text}`}>{detail.character}</span>
                <div className="flex-1 min-w-0">
                  {detail.onyomi && (
                    <div className={`text-sm ${theme.textMuted}`}>
                      <span className="font-medium">音:</span> {detail.onyomi}
                    </div>
                  )}
                  {detail.kunyomi && (
                    <div className={`text-sm ${theme.textMuted}`}>
                      <span className="font-medium">訓:</span> {detail.kunyomi}
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
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                  }`}>
                    N{detail.jlptLevel}
                  </span>
                )}
                {detail.strokeCount && (
                  <span className={`text-xs ${theme.textMuted}`}>
                    {detail.strokeCount} strokes
                  </span>
                )}
                {detail.grade && (
                  <span className={`text-xs ${theme.textMuted}`}>
                    Grade {detail.grade}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className={`p-3 text-sm ${theme.textMuted}`}>
              No data found for {character}
            </div>
          )}
        </div>
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
