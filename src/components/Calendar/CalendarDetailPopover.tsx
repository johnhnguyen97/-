import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { WordOfTheDay, KanjiOfTheDay, JapaneseHoliday } from '../../types/calendar';

interface CalendarDetailPopoverProps {
  type: 'wotd' | 'kotd' | 'holiday';
  data: WordOfTheDay | KanjiOfTheDay | JapaneseHoliday;
  onClose: () => void;
}

// Color palette for strokes (like KanjiVG viewer)
const STROKE_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#be185d', // pink
  '#854d0e', // brown
  '#4f46e5', // indigo
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
];

export function CalendarDetailPopover({ type, data, onClose }: CalendarDetailPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loadingSvg, setLoadingSvg] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<{ cancel: boolean }>({ cancel: false });

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Fetch KanjiVG SVG for kanji
  useEffect(() => {
    if (type === 'kotd') {
      const kanji = (data as KanjiOfTheDay).kanji;
      setLoadingSvg(true);

      const kanjiCode = kanji.charCodeAt(0).toString(16).padStart(5, '0');
      const svgUrl = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${kanjiCode}.svg`;

      fetch(svgUrl)
        .then(res => {
          if (res.ok) return res.text();
          throw new Error('SVG not found');
        })
        .then(svg => {
          setSvgContent(svg);
        })
        .catch(() => {
          setSvgContent(null);
        })
        .finally(() => {
          setLoadingSvg(false);
        });
    }
  }, [type, data]);

  // Apply colors to strokes after SVG is loaded
  useEffect(() => {
    if (svgContent && svgContainerRef.current) {
      const paths = svgContainerRef.current.querySelectorAll('path');
      const texts = svgContainerRef.current.querySelectorAll('text');

      paths.forEach((path, index) => {
        const color = STROKE_COLORS[index % STROKE_COLORS.length];
        path.style.stroke = color;
        path.style.strokeWidth = '4';
        path.style.fill = 'none';
        path.style.strokeLinecap = 'round';
        path.style.strokeLinejoin = 'round';
      });

      // Style stroke numbers
      texts.forEach((text, index) => {
        const color = STROKE_COLORS[index % STROKE_COLORS.length];
        text.style.fill = color;
        text.style.fontSize = '10px';
        text.style.fontWeight = 'bold';
      });
    }
  }, [svgContent]);

  // KanjivgAnimate-style stroke animation
  const playAnimation = useCallback(async () => {
    if (!svgContainerRef.current || isAnimating) return;

    const paths = svgContainerRef.current.querySelectorAll('path');
    const texts = svgContainerRef.current.querySelectorAll('text');

    if (paths.length === 0) return;

    setIsAnimating(true);
    animationRef.current.cancel = false;

    // Hide all paths and numbers initially
    paths.forEach(path => {
      path.style.display = 'none';
    });
    texts.forEach(text => {
      text.style.display = 'none';
    });

    // Animate each stroke sequentially
    for (let i = 0; i < paths.length; i++) {
      if (animationRef.current.cancel) break;

      const path = paths[i];
      const text = texts[i];
      const length = path.getTotalLength();

      // Show the path and number
      path.style.display = 'block';
      if (text) text.style.display = 'block';

      // Set up the dash animation
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.style.transition = 'none';

      // Force reflow
      path.getBoundingClientRect();

      // Animate the stroke
      path.style.transition = `stroke-dashoffset ${300 + length * 0.5}ms ease-out`;
      path.style.strokeDashoffset = '0';

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 350 + length * 0.5));
    }

    setIsAnimating(false);
  }, [isAnimating]);

  // Reset animation (show all strokes)
  const resetAnimation = useCallback(() => {
    animationRef.current.cancel = true;
    setIsAnimating(false);

    if (svgContainerRef.current) {
      const paths = svgContainerRef.current.querySelectorAll('path');
      const texts = svgContainerRef.current.querySelectorAll('text');

      paths.forEach(path => {
        path.style.display = 'block';
        path.style.strokeDasharray = 'none';
        path.style.strokeDashoffset = '0';
        path.style.transition = 'none';
      });

      texts.forEach(text => {
        text.style.display = 'block';
      });
    }
  }, []);

  const handleClose = () => {
    animationRef.current.cancel = true;
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const renderWordContent = () => {
    const word = data as WordOfTheDay;
    return (
      <div className="space-y-4">
        {/* Main word display */}
        <div className="text-center py-4">
          <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {word.word}
          </div>
          <div className="text-2xl text-indigo-600 dark:text-indigo-400">
            {word.reading}
          </div>
        </div>

        {/* Meaning */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            意味 Meaning
          </div>
          <div className="text-lg text-gray-900 dark:text-white">
            {word.meaning}
          </div>
        </div>

        {/* Part of speech & JLPT */}
        <div className="flex gap-2 flex-wrap justify-center">
          {word.partOfSpeech && (
            <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full">
              {word.partOfSpeech}
            </span>
          )}
          {word.jlptLevel && (
            <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full font-bold">
              {word.jlptLevel}
            </span>
          )}
          {word.isLearned && (
            <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
              ✓ 習得済み
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderKanjiContent = () => {
    const kanji = data as KanjiOfTheDay;
    return (
      <div className="space-y-4">
        {/* Main kanji display with stroke animation */}
        <div className="text-center">
          <div className="relative inline-block bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
            {svgContent ? (
              <div
                ref={svgContainerRef}
                className="w-40 h-40 mx-auto"
                dangerouslySetInnerHTML={{ __html: svgContent }}
                style={{
                  transform: 'scale(1.5)',
                  transformOrigin: 'center center'
                }}
              />
            ) : loadingSvg ? (
              <div className="w-40 h-40 mx-auto flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-3 border-purple-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="text-8xl font-bold text-gray-900 dark:text-white py-4">
                {kanji.kanji}
              </div>
            )}
          </div>

          {/* Animation controls */}
          {svgContent && (
            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={playAnimation}
                disabled={isAnimating}
                className={`px-4 py-2 text-sm rounded-full transition-all flex items-center gap-2 ${
                  isAnimating
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
                }`}
              >
                <span>{isAnimating ? '⏳' : '▶'}</span>
                <span>{isAnimating ? '再生中...' : '書き順を再生'}</span>
              </button>
              {isAnimating && (
                <button
                  onClick={resetAnimation}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  リセット
                </button>
              )}
            </div>
          )}
        </div>

        {/* Readings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
            <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
              音読み On'yomi
            </div>
            <div className="text-purple-700 dark:text-purple-300 font-bold text-lg">
              {kanji.onyomi?.length > 0 ? kanji.onyomi.join('、') : '—'}
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
            <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              訓読み Kun'yomi
            </div>
            <div className="text-indigo-700 dark:text-indigo-300 font-bold text-lg">
              {kanji.kunyomi?.length > 0 ? kanji.kunyomi.join('、') : '—'}
            </div>
          </div>
        </div>

        {/* Meaning */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            意味 Meaning
          </div>
          <div className="text-lg text-gray-900 dark:text-white">
            {kanji.meaning}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 flex-wrap justify-center">
          {kanji.strokeCount && (
            <span className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm rounded-full font-medium">
              {kanji.strokeCount} 画
            </span>
          )}
          {kanji.jlptLevel && (
            <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full font-bold">
              {kanji.jlptLevel}
            </span>
          )}
          {kanji.isLearned && (
            <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
              ✓ 習得済み
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderHolidayContent = () => {
    const holiday = data as JapaneseHoliday;
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-2">
            {holiday.localName}
          </div>
          <div className="text-xl text-gray-600 dark:text-gray-300">
            {holiday.nameEnglish}
          </div>
        </div>

        {holiday.description && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
            <div className="text-gray-700 dark:text-gray-200">
              {holiday.description}
            </div>
          </div>
        )}

        {holiday.traditions && holiday.traditions.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              伝統 Traditions
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {holiday.traditions.map((tradition, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm rounded-full"
                >
                  {tradition}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getTitle = () => {
    switch (type) {
      case 'wotd': return '今日の単語';
      case 'kotd': return '今日の漢字';
      case 'holiday': return '日本の祝日';
    }
  };

  const getSubtitle = () => {
    switch (type) {
      case 'wotd': return 'Word of the Day';
      case 'kotd': return 'Kanji of the Day';
      case 'holiday': return 'Japanese Holiday';
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'wotd': return 'from-indigo-500 to-purple-500';
      case 'kotd': return 'from-purple-500 to-pink-500';
      case 'holiday': return 'from-amber-500 to-orange-500';
    }
  };

  const popoverContent = (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[9998] transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Centered Modal */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <div
          ref={popoverRef}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[85vh] overflow-hidden pointer-events-auto"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${getTitleColor()} px-5 py-4 flex items-center justify-between`}>
            <div>
              <h3 className="text-white font-bold text-lg">{getTitle()}</h3>
              <p className="text-white/70 text-sm">{getSubtitle()}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
            {type === 'wotd' && renderWordContent()}
            {type === 'kotd' && renderKanjiContent()}
            {type === 'holiday' && renderHolidayContent()}
          </div>
        </div>
      </div>

      {/* SVG Styles */}
      <style>{`
        .stroke-animation-container svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
      `}</style>
    </>
  );

  return createPortal(popoverContent, document.body);
}
