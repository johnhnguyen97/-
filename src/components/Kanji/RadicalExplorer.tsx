import { useState, useEffect, useMemo } from 'react';
import type { Radical, KanjiSummary, RadicalPosition } from '../../types/kanji';
import { getAllRadicals, getRadicalWithKanji, getPositionInfo } from '../../services/radicalsApi';
import { RadicalGrid } from './RadicalGrid';
import { KanjiGrid } from './KanjiGrid';

interface RadicalExplorerProps {
  onRadicalClick?: (radical: Radical) => void;
  selectedRadical?: Radical | null;
  isDark: boolean;
}

type ViewMode = 'all' | 'by-stroke' | 'by-position';
type PositionFilter = 'all' | RadicalPosition;

const POSITION_OPTIONS: { value: PositionFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'All Positions', emoji: '📍' },
  { value: 'hen', label: 'Left (偏)', emoji: '⬅️' },
  { value: 'tsukuri', label: 'Right (旁)', emoji: '➡️' },
  { value: 'kanmuri', label: 'Top (冠)', emoji: '⬆️' },
  { value: 'ashi', label: 'Bottom (脚)', emoji: '⬇️' },
  { value: 'tare', label: 'Top-Left (垂)', emoji: '↖️' },
  { value: 'nyou', label: 'Bottom-Left (繞)', emoji: '↙️' },
  { value: 'kamae', label: 'Enclosure (構)', emoji: '⬜' },
];

export function RadicalExplorer({ onRadicalClick, selectedRadical, isDark }: RadicalExplorerProps) {
  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('by-stroke');
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('all');
  const [strokeFilter, setStrokeFilter] = useState<number | null>(null);

  // Selected radical's kanji
  const [relatedKanji, setRelatedKanji] = useState<KanjiSummary[]>([]);
  const [isLoadingKanji, setIsLoadingKanji] = useState(false);

  // Fetch all radicals on mount
  useEffect(() => {
    const fetchRadicals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAllRadicals();
        setRadicals(data);
      } catch (err) {
        console.error('Failed to fetch radicals:', err);
        setError(err instanceof Error ? err.message : 'Failed to load radicals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRadicals();
  }, []);

  // Fetch kanji when radical is selected
  useEffect(() => {
    if (!selectedRadical) {
      setRelatedKanji([]);
      return;
    }

    const fetchKanji = async () => {
      setIsLoadingKanji(true);
      try {
        const data = await getRadicalWithKanji(selectedRadical.radicalNumber);
        if (data) {
          setRelatedKanji(data.kanjiList || []);
        } else {
          setRelatedKanji([]);
        }
      } catch (err) {
        console.error('Failed to fetch related kanji:', err);
        setRelatedKanji([]);
      } finally {
        setIsLoadingKanji(false);
      }
    };

    fetchKanji();
  }, [selectedRadical]);

  // Local search filter function
  const filterBySearch = (rads: Radical[], query: string): Radical[] => {
    const lowerQuery = query.toLowerCase();
    return rads.filter(r =>
      r.nameEn.toLowerCase().includes(lowerQuery) ||
      r.meaning?.toLowerCase().includes(lowerQuery) ||
      r.character === query ||
      r.nameJp?.includes(query)
    );
  };

  // Filter and group radicals
  const filteredRadicals = useMemo(() => {
    let result = radicals;

    // Search filter
    if (searchQuery) {
      result = filterBySearch(result, searchQuery);
    }

    // Position filter
    if (positionFilter !== 'all') {
      result = result.filter((r) => r.position === positionFilter);
    }

    // Stroke filter
    if (strokeFilter !== null) {
      result = result.filter((r) => r.strokeCount === strokeFilter);
    }

    return result;
  }, [radicals, searchQuery, positionFilter, strokeFilter]);

  // Group by stroke count
  const groupedByStroke = useMemo(() => {
    const groups: Record<number, Radical[]> = {};
    filteredRadicals.forEach((r) => {
      if (!groups[r.strokeCount]) {
        groups[r.strokeCount] = [];
      }
      groups[r.strokeCount].push(r);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([stroke, rads]) => ({ stroke: parseInt(stroke), radicals: rads }));
  }, [filteredRadicals]);

  // Unique stroke counts for filter
  const strokeCounts = useMemo(() => {
    const counts = [...new Set(radicals.map((r) => r.strokeCount))].sort((a, b) => a - b);
    return counts;
  }, [radicals]);

  const handleRadicalClick = (radical: Radical) => {
    onRadicalClick?.(radical);
  };

  const theme = {
    input: isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
      : 'bg-white border-stone-200 text-gray-800 placeholder-gray-400',
    select: isDark
      ? 'bg-white/5 border-white/10 text-white'
      : 'bg-white border-stone-200 text-gray-800',
    tab: (active: boolean) =>
      active
        ? isDark
          ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
          : 'bg-amber-100 text-amber-700 border-amber-300'
        : isDark
          ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
          : 'bg-white text-gray-600 border-stone-200 hover:bg-gray-50',
    chip: (active: boolean) =>
      active
        ? isDark
          ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
          : 'bg-amber-100 text-amber-700 border-amber-300'
        : isDark
          ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
          : 'bg-gray-100 text-gray-600 border-stone-200 hover:bg-gray-200',
    section: isDark ? 'border-white/10' : 'border-stone-200',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`animate-spin w-8 h-8 border-2 border-t-transparent rounded-full ${
          isDark ? 'border-amber-500' : 'border-amber-600'
        }`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
        <div className="text-4xl mb-4">⚠️</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search radicals by name, meaning, or character..."
          className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme.input}`}
        />

        {/* View Mode Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all' as ViewMode, label: 'All', icon: '📋' },
            { id: 'by-stroke' as ViewMode, label: 'By Stroke', icon: '✍️' },
            { id: 'by-position' as ViewMode, label: 'By Position', icon: '📍' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${theme.tab(viewMode === mode.id)}`}
            >
              <span className="mr-1">{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>

        {/* Position Filter (when by-position mode) */}
        {viewMode === 'by-position' && (
          <div className="flex flex-wrap gap-2">
            {POSITION_OPTIONS.map((pos) => (
              <button
                key={pos.value}
                onClick={() => setPositionFilter(pos.value)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${theme.chip(positionFilter === pos.value)}`}
              >
                <span className="mr-1">{pos.emoji}</span>
                {pos.label}
              </button>
            ))}
          </div>
        )}

        {/* Stroke Filter Chips */}
        {viewMode === 'all' && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStrokeFilter(null)}
              className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${theme.chip(strokeFilter === null)}`}
            >
              All
            </button>
            {strokeCounts.map((count) => (
              <button
                key={count}
                onClick={() => setStrokeFilter(count)}
                className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${theme.chip(strokeFilter === count)}`}
              >
                {count}画
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className={`text-sm ${theme.textMuted}`}>
        Showing {filteredRadicals.length} of 214 radicals
      </div>

      {/* Radical Display */}
      {viewMode === 'by-stroke' ? (
        <div className="space-y-6">
          {groupedByStroke.map(({ stroke, radicals: rads }) => (
            <div key={stroke} className={`pb-6 border-b last:border-b-0 ${theme.section}`}>
              <RadicalGrid
                radicals={rads}
                onRadicalClick={handleRadicalClick}
                selectedRadical={selectedRadical}
                isDark={isDark}
                title={`${stroke} Stroke${stroke > 1 ? 's' : ''}`}
              />
            </div>
          ))}
        </div>
      ) : (
        <RadicalGrid
          radicals={filteredRadicals}
          onRadicalClick={handleRadicalClick}
          selectedRadical={selectedRadical}
          isDark={isDark}
        />
      )}

      {/* Selected Radical Detail */}
      {selectedRadical && (
        <div className={`mt-8 pt-6 border-t ${theme.section}`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`text-6xl font-serif ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {selectedRadical.character}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme.text}`}>
                {selectedRadical.nameEn}
              </h3>
              {selectedRadical.nameJp && (
                <p className={theme.textMuted}>{selectedRadical.nameJp}</p>
              )}
              {selectedRadical.meaning && (
                <p className={`text-sm mt-1 ${theme.textMuted}`}>{selectedRadical.meaning}</p>
              )}
              <div className="flex gap-2 mt-2">
                <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  #{selectedRadical.radicalNumber}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  {selectedRadical.strokeCount} strokes
                </span>
                {selectedRadical.position && (
                  <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                    {getPositionInfo(selectedRadical.position)?.english}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Related Kanji */}
          <div>
            <h4 className={`text-sm font-medium mb-3 ${theme.textMuted}`}>
              Kanji containing this radical
            </h4>
            {isLoadingKanji ? (
              <div className="flex items-center gap-2">
                <div className={`animate-spin w-4 h-4 border-2 border-t-transparent rounded-full ${
                  isDark ? 'border-amber-500' : 'border-amber-600'
                }`} />
                <span className={theme.textMuted}>Loading kanji...</span>
              </div>
            ) : relatedKanji.length > 0 ? (
              <KanjiGrid
                kanji={relatedKanji}
                onKanjiClick={() => {}}
                isDark={isDark}
              />
            ) : (
              <p className={theme.textMuted}>No kanji data available yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
