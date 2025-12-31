import type { KanjiSummary } from '../../types/kanji';
import { KanjiCard } from './KanjiCard';

interface KanjiGridProps {
  kanji: KanjiSummary[];
  onKanjiClick: (kanji: KanjiSummary) => void;
  isDark: boolean;
}

export function KanjiGrid({ kanji, onKanjiClick, isDark }: KanjiGridProps) {
  if (kanji.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Found {kanji.length} kanji
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger-children">
        {kanji.map((k, index) => (
          <KanjiCard
            key={k.id || k.character}
            kanji={k}
            onClick={() => onKanjiClick(k)}
            isDark={isDark}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
