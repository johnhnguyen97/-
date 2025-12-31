import type { Radical } from '../../types/kanji';
import { RadicalCard } from './RadicalCard';

interface RadicalGridProps {
  radicals: Radical[];
  onRadicalClick: (radical: Radical) => void;
  selectedRadical?: Radical | null;
  isDark: boolean;
  title?: string;
}

export function RadicalGrid({
  radicals,
  onRadicalClick,
  selectedRadical,
  isDark,
  title,
}: RadicalGridProps) {
  if (radicals.length === 0) {
    return (
      <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        No radicals found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && (
        <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {title} ({radicals.length})
        </h3>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 stagger-children">
        {radicals.map((radical, index) => (
          <RadicalCard
            key={radical.id || radical.radicalNumber}
            radical={radical}
            onClick={() => onRadicalClick(radical)}
            isDark={isDark}
            isSelected={selectedRadical?.radicalNumber === radical.radicalNumber}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
