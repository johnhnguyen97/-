import type { RadicalInfo, RadicalPosition } from '../../types/kanji';
import { getPositionInfo } from '../../services/radicalsApi';

interface RadicalDisplayProps {
  radical: RadicalInfo;
  isDark: boolean;
  size?: 'sm' | 'md' | 'lg';
  showPosition?: boolean;
  onClick?: () => void;
}

export function RadicalDisplay({
  radical,
  isDark,
  size = 'md',
  showPosition = true,
  onClick,
}: RadicalDisplayProps) {
  // Get the actual radical data from the RadicalInfo wrapper
  const radicalData = radical.radical;

  // Use the position from RadicalInfo if available, otherwise from the radical itself
  const position = (radical.position || radicalData.position) as RadicalPosition | undefined;
  const positionInfo = position ? getPositionInfo(position) : null;

  const sizeClasses = {
    sm: {
      container: 'p-2',
      character: 'text-2xl',
      name: 'text-xs',
      meaning: 'text-xs',
    },
    md: {
      container: 'p-3',
      character: 'text-3xl',
      name: 'text-sm',
      meaning: 'text-xs',
    },
    lg: {
      container: 'p-4',
      character: 'text-4xl',
      name: 'text-base',
      meaning: 'text-sm',
    },
  };

  const classes = sizeClasses[size];

  const theme = {
    container: isDark
      ? 'bg-white/5 hover:bg-white/10 border-white/10'
      : 'bg-amber-50/50 hover:bg-amber-100/50 border-amber-200/50',
    character: isDark ? 'text-amber-400' : 'text-amber-600',
    name: isDark ? 'text-white' : 'text-gray-800',
    meaning: isDark ? 'text-gray-400' : 'text-gray-600',
    position: isDark ? 'text-gray-500 bg-white/5' : 'text-gray-500 bg-gray-100',
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

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border transition-all duration-200 ${classes.container} ${theme.container} ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      }`}
    >
      {/* Radical character */}
      <div className={`font-serif ${classes.character} ${theme.character}`}>
        {radicalData.character}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className={`font-medium truncate ${classes.name} ${theme.name}`}>
          {radicalData.nameEn}
        </div>
        {radicalData.meaning && (
          <div className={`truncate ${classes.meaning} ${theme.meaning}`}>
            {radicalData.meaning}
          </div>
        )}
      </div>

      {/* Position indicator */}
      {showPosition && positionInfo && position && (
        <div
          className={`px-2 py-1 rounded text-xs ${theme.position}`}
          title={positionInfo.japanese}
        >
          {positionEmojis[position] || '•'}
        </div>
      )}

      {/* Stroke count */}
      <div className={`text-xs ${theme.meaning}`}>
        {radicalData.strokeCount}画
      </div>

      {/* Primary indicator */}
      {radical.isPrimary && (
        <div className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
          Main
        </div>
      )}
    </Component>
  );
}
