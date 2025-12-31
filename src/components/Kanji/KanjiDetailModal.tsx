import { useState, useEffect } from 'react';
import type { KanjiDetail, KanjiSummary } from '../../types/kanji';
import { getJlptColor, formatReading } from '../../types/kanji';
import { getKanjiDetail } from '../../services/kanjiApi';
import { useAuth } from '../../contexts/AuthContext';
import { StrokeAnimation } from './StrokeAnimation';
import { KanjiAudio } from './KanjiAudio';
import { RadicalDisplay } from './RadicalDisplay';

interface KanjiDetailModalProps {
  kanji: KanjiDetail | KanjiSummary;
  onClose: () => void;
  isDark: boolean;
}

export function KanjiDetailModal({ kanji, onClose, isDark }: KanjiDetailModalProps) {
  const { session } = useAuth();
  const [detail, setDetail] = useState<KanjiDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch full details
  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getKanjiDetail(kanji.character, session?.access_token);
        setDetail(result);
      } catch (err) {
        console.error('Failed to fetch kanji detail:', err);
        setError(err instanceof Error ? err.message : 'Failed to load details');
        // Use basic info if full detail fails
        setDetail(kanji as KanjiDetail);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [kanji.character, session?.access_token]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const displayKanji = detail || kanji;
  const jlptColor = getJlptColor(displayKanji.jlptLevel);

  const theme = {
    overlay: 'bg-black/60 backdrop-blur-sm',
    modal: isDark
      ? 'bg-gray-900 border-white/10'
      : 'bg-white border-stone-200',
    header: isDark
      ? 'border-white/10'
      : 'border-stone-200',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
    textSubtle: isDark ? 'text-gray-500' : 'text-gray-400',
    section: isDark
      ? 'bg-white/5 border-white/10'
      : 'bg-gray-50 border-stone-200',
    closeBtn: isDark
      ? 'text-gray-400 hover:text-white hover:bg-white/10'
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.overlay}`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl animate-scaleIn ${theme.modal}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors z-10 ${theme.closeBtn}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className={`p-6 border-b ${theme.header}`}>
          <div className="flex items-start gap-6">
            {/* Main character */}
            <div className="flex-shrink-0">
              <div className={`text-7xl md:text-8xl font-serif ${theme.text}`}>
                {displayKanji.character}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {displayKanji.jlptLevel && (
                  <span className={`px-2 py-1 text-sm font-bold rounded ${jlptColor}`}>
                    {displayKanji.jlptLevel}
                  </span>
                )}
                <span className={`text-sm ${theme.textSubtle}`}>
                  {displayKanji.strokeCount} strokes
                </span>
              </div>
            </div>

            {/* Readings and meaning */}
            <div className="flex-1 min-w-0">
              <h2 className={`text-xl md:text-2xl font-bold mb-2 ${theme.text}`}>
                {displayKanji.meaningEn}
              </h2>

              {/* On'yomi */}
              {displayKanji.onyomi && (
                <div className="mb-2">
                  <span className={`text-xs uppercase tracking-wide ${theme.textSubtle}`}>On'yomi</span>
                  <div className={`text-lg font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {formatReading(displayKanji.onyomi)}
                  </div>
                </div>
              )}

              {/* Kun'yomi */}
              {displayKanji.kunyomi && (
                <div>
                  <span className={`text-xs uppercase tracking-wide ${theme.textSubtle}`}>Kun'yomi</span>
                  <div className={`text-lg font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {formatReading(displayKanji.kunyomi)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className={`animate-spin w-8 h-8 border-2 border-t-transparent rounded-full ${
                isDark ? 'border-amber-500' : 'border-amber-600'
              }`} />
            </div>
          ) : error ? (
            <div className={`text-center py-8 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
              {error}
            </div>
          ) : (
            <>
              {/* Stroke Animation */}
              <section>
                <h3 className={`text-sm font-medium uppercase tracking-wide mb-3 ${theme.textSubtle}`}>
                  Stroke Order
                </h3>
                <div className="max-w-xs mx-auto">
                  <StrokeAnimation
                    videoUrl={detail?.videoUrl}
                    character={displayKanji.character}
                    isDark={isDark}
                  />
                </div>
              </section>

              {/* Audio */}
              {(detail?.audioOnyomiUrl || displayKanji.onyomi || displayKanji.kunyomi) && (
                <section>
                  <h3 className={`text-sm font-medium uppercase tracking-wide mb-3 ${theme.textSubtle}`}>
                    Pronunciation
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {displayKanji.onyomi && (
                      <KanjiAudio
                        audioUrl={detail?.audioOnyomiUrl}
                        label="On'yomi"
                        reading={displayKanji.onyomi.split(',')[0]}
                        isDark={isDark}
                      />
                    )}
                    {displayKanji.kunyomi && (
                      <KanjiAudio
                        label="Kun'yomi"
                        reading={displayKanji.kunyomi.split(',')[0].replace(/[.\-]/g, '')}
                        isDark={isDark}
                      />
                    )}
                  </div>
                </section>
              )}

              {/* Radicals */}
              {detail?.radicals && detail.radicals.length > 0 && (
                <section>
                  <h3 className={`text-sm font-medium uppercase tracking-wide mb-3 ${theme.textSubtle}`}>
                    {detail.radicals.length > 1 ? 'Radicals' : 'Main Radical'}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {detail.radicals.map((radicalInfo, index) => (
                      <RadicalDisplay
                        key={index}
                        radical={radicalInfo}
                        isDark={isDark}
                        size="lg"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Examples */}
              {detail?.examples && detail.examples.length > 0 && (
                <section>
                  <h3 className={`text-sm font-medium uppercase tracking-wide mb-3 ${theme.textSubtle}`}>
                    Example Words
                  </h3>
                  <div className={`rounded-xl border overflow-hidden ${theme.section}`}>
                    {detail.examples.slice(0, 5).map((example, index) => (
                      <div
                        key={index}
                        className={`p-3 flex items-center gap-4 ${
                          index !== 0 ? (isDark ? 'border-t border-white/5' : 'border-t border-stone-100') : ''
                        }`}
                      >
                        <div className={`text-xl font-serif ${theme.text}`}>
                          {example.word}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          {example.reading}
                        </div>
                        <div className={`flex-1 text-sm ${theme.textMuted}`}>
                          {example.meaning}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
