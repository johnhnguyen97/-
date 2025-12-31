import type { Radical } from '../../types/kanji';
import { getPositionInfo } from '../../services/radicalsApi';

interface RadicalCardProps {
  radical: Radical;
  onClick: () => void;
  isDark: boolean;
  isSelected?: boolean;
  index?: number;
}

export function RadicalCard({ radical, onClick, isDark, isSelected = false, index = 0 }: RadicalCardProps) {
  const positionInfo = radical.position ? getPositionInfo(radical.position) : null;

  const theme = {
    card: isDark
      ? isSelected
        ? 'bg-amber-600/20 border-amber-500/50 ring-2 ring-amber-500/30'
        : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-amber-500/30'
      : isSelected
        ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-200'
        : 'bg-white hover:bg-amber-50/50 border-stone-200 hover:border-amber-300',
    character: isDark
      ? isSelected ? 'text-amber-400' : 'text-white'
      : isSelected ? 'text-amber-700' : 'text-gray-800',
    name: isDark ? 'text-gray-300' : 'text-gray-700',
    meaning: isDark ? 'text-gray-500' : 'text-gray-500',
    stroke: isDark ? 'text-gray-600' : 'text-gray-400',
    position: isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500',
  };

  // Position emojis for visual indication
  const positionEmojis: Record<string, string> = {
    hen: '⬅️',
    tsukuri: '➡️',
    kanmuri: '⬆️',
    ashi: '⬇️',
    tare: '↖️',
    nyou: '↙️',
    kamae: '⬜',
    other: '•',
  };

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${theme.card}`}
      style={{
        animationDelay: `${index * 30}ms`,
      }}
    >
      {/* Radical number badge */}
      <div className={`absolute top-1 left-1 text-[10px] font-mono ${theme.stroke}`}>
        #{radical.radicalNumber}
      </div>

      {/* Position indicator */}
      {positionInfo && radical.position && (
        <div
          className={`absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded text-xs ${theme.position}`}
          title={`${positionInfo.english} (${positionInfo.japanese})`}
        >
          {positionEmojis[radical.position] || '•'}
        </div>
      )}

      {/* Main character */}
      <div className={`text-3xl md:text-4xl font-serif mt-2 mb-1 transition-transform group-hover:scale-110 ${theme.character}`}>
        {radical.character}
      </div>

      {/* Name */}
      <div className={`text-xs font-medium text-center line-clamp-1 ${theme.name}`}>
        {radical.nameEn}
      </div>

      {/* Japanese name */}
      {radical.nameJp && (
        <div className={`text-[10px] text-center ${theme.meaning}`}>
          {radical.nameJp}
        </div>
      )}

      {/* Stroke count */}
      <div className={`absolute bottom-1 right-1 text-[10px] ${theme.stroke}`}>
        {radical.strokeCount}画
      </div>
    </button>
  );
}
