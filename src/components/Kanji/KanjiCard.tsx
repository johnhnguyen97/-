import type { KanjiSummary } from '../../types/kanji';
import { getJlptColor } from '../../types/kanji';

interface KanjiCardProps {
  kanji: KanjiSummary;
  onClick: () => void;
  isDark: boolean;
  index?: number;
}

export function KanjiCard({ kanji, onClick, isDark, index = 0 }: KanjiCardProps) {
  const jlptColor = getJlptColor(kanji.jlptLevel);

  const theme = {
    card: isDark
      ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-amber-500/30'
      : 'bg-white hover:bg-amber-50/50 border-stone-200 hover:border-amber-300',
    character: isDark ? 'text-white' : 'text-gray-800',
    reading: isDark ? 'text-amber-400' : 'text-amber-600',
    meaning: isDark ? 'text-gray-400' : 'text-gray-600',
    stroke: isDark ? 'text-gray-500' : 'text-gray-400',
  };

  return (
    <button
      onClick={onClick}
      className={`group relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${theme.card}`}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* JLPT Badge */}
      {kanji.jlptLevel && (
        <div
          className={`absolute top-2 right-2 px-1.5 py-0.5 text-xs font-bold rounded ${jlptColor}`}
        >
          {kanji.jlptLevel}
        </div>
      )}

      {/* Main Character */}
      <div className={`text-4xl md:text-5xl font-serif mb-2 ${theme.character}`}>
        {kanji.character}
      </div>

      {/* Readings */}
      <div className={`text-sm font-medium mb-1 ${theme.reading}`}>
        {kanji.onyomi && <span className="mr-2">{kanji.onyomi.split(',')[0]}</span>}
        {kanji.kunyomi && <span className="opacity-75">{kanji.kunyomi.split(',')[0]}</span>}
      </div>

      {/* Meaning */}
      <div className={`text-xs line-clamp-2 ${theme.meaning}`}>
        {kanji.meaningEn}
      </div>

      {/* Stroke count */}
      <div className={`absolute bottom-2 right-2 text-xs ${theme.stroke}`}>
        {kanji.strokeCount}画
      </div>

      {/* Hover indicator */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
        isDark ? 'bg-gradient-to-br from-amber-500/5 to-transparent' : 'bg-gradient-to-br from-amber-100/30 to-transparent'
      }`} />
    </button>
  );
}
