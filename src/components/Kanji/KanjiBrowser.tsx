import { useState, useEffect } from 'react';
import { KanjiGrid } from './KanjiGrid';
import type { Kanji, KanjiSummary } from '../../types/kanji';
import { getKanjiByJLPT, getKanjiByGrade, getDictionaryStats } from '../../services/kanjiApi';

interface KanjiBrowserProps {
  onKanjiClick: (kanji: KanjiSummary) => void;
  isDark: boolean;
}

type BrowseMode = 'jlpt' | 'grade' | 'stroke';
type JLPTLevel = 1 | 2 | 3 | 4 | 5;
type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 'secondary';

interface Stats {
  kanji: {
    total: number;
    byJLPT: Record<string, number>;
    byGrade: Record<string, number>;
  };
  vocabulary: {
    total: number;
    common: number;
  };
}

const JLPT_LEVELS: { level: JLPTLevel; label: string; color: string }[] = [
  { level: 5, label: 'N5', color: 'from-green-500 to-emerald-500' },
  { level: 4, label: 'N4', color: 'from-blue-500 to-cyan-500' },
  { level: 3, label: 'N3', color: 'from-yellow-500 to-amber-500' },
  { level: 2, label: 'N2', color: 'from-orange-500 to-red-500' },
  { level: 1, label: 'N1', color: 'from-purple-500 to-pink-500' },
];

const GRADE_LEVELS: { grade: GradeLevel; label: string; sublabel: string }[] = [
  { grade: 1, label: '1年', sublabel: '80 kanji' },
  { grade: 2, label: '2年', sublabel: '160 kanji' },
  { grade: 3, label: '3年', sublabel: '200 kanji' },
  { grade: 4, label: '4年', sublabel: '202 kanji' },
  { grade: 5, label: '5年', sublabel: '193 kanji' },
  { grade: 6, label: '6年', sublabel: '191 kanji' },
  { grade: 'secondary', label: '中学', sublabel: '1110 kanji' },
];

export function KanjiBrowser({ onKanjiClick, isDark }: KanjiBrowserProps) {
  const [mode, setMode] = useState<BrowseMode>('jlpt');
  const [selectedJLPT, setSelectedJLPT] = useState<JLPTLevel | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | null>(null);
  const [kanji, setKanji] = useState<Kanji[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  // Load stats on mount
  useEffect(() => {
    getDictionaryStats().then(s => setStats(s as Stats | null));
  }, []);

  // Load kanji when selection changes
  useEffect(() => {
    const loadKanji = async () => {
      setIsLoading(true);
      try {
        if (mode === 'jlpt' && selectedJLPT) {
          const data = await getKanjiByJLPT(selectedJLPT);
          setKanji(data);
        } else if (mode === 'grade' && selectedGrade) {
          const data = await getKanjiByGrade(selectedGrade);
          setKanji(data);
        } else {
          setKanji([]);
        }
      } catch (error) {
        console.error('Failed to load kanji:', error);
        setKanji([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadKanji();
  }, [mode, selectedJLPT, selectedGrade]);

  // Group kanji by stroke count for stroke mode
  const kanjiByStroke = kanji.reduce((acc, k) => {
    const stroke = k.strokeCount;
    if (!acc[stroke]) acc[stroke] = [];
    acc[stroke].push(k);
    return acc;
  }, {} as Record<number, Kanji[]>);

  const theme = {
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200',
    cardHover: isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50',
    tab: (active: boolean) =>
      active
        ? isDark
          ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
          : 'bg-amber-100 text-amber-700 border-amber-300'
        : isDark
          ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
    badge: isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600',
  };

  const handleModeChange = (newMode: BrowseMode) => {
    setMode(newMode);
    setSelectedJLPT(null);
    setSelectedGrade(null);
    setKanji([]);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex gap-2">
        {[
          { id: 'jlpt' as BrowseMode, label: 'JLPT Level', icon: '🎌' },
          { id: 'grade' as BrowseMode, label: 'School Grade', icon: '🏫' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${theme.tab(mode === m.id)}`}
          >
            <span className="mr-1">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className={`flex gap-4 text-sm ${theme.textMuted}`}>
          <span>📚 {stats.kanji.total.toLocaleString()} kanji</span>
          <span>📖 {stats.vocabulary.common.toLocaleString()} vocab</span>
        </div>
      )}

      {/* Level Selection */}
      {mode === 'jlpt' && (
        <div className="grid grid-cols-5 gap-2">
          {JLPT_LEVELS.map(({ level, label, color }) => (
            <button
              key={level}
              onClick={() => setSelectedJLPT(level)}
              className={`relative overflow-hidden rounded-xl p-4 border transition-all ${
                selectedJLPT === level
                  ? `bg-gradient-to-br ${color} text-white border-transparent shadow-lg scale-105`
                  : `${theme.card} ${theme.cardHover} ${theme.text}`
              }`}
            >
              <div className="text-2xl font-bold">{label}</div>
              <div className={`text-xs ${selectedJLPT === level ? 'text-white/70' : theme.textMuted}`}>
                {stats?.kanji.byJLPT[`N${level}`] || '...'} kanji
              </div>
              {selectedJLPT === level && (
                <div className="absolute top-1 right-1 text-xs">✓</div>
              )}
            </button>
          ))}
        </div>
      )}

      {mode === 'grade' && (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {GRADE_LEVELS.map(({ grade, label, sublabel }) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`rounded-xl p-3 border transition-all ${
                selectedGrade === grade
                  ? isDark
                    ? 'bg-amber-600/20 text-amber-400 border-amber-500/50 shadow-lg'
                    : 'bg-amber-500 text-white border-amber-600 shadow-lg'
                  : `${theme.card} ${theme.cardHover} ${theme.text}`
              }`}
            >
              <div className="text-lg font-bold">{label}</div>
              <div className={`text-xs ${selectedGrade === grade ? (isDark ? 'text-amber-300' : 'text-white/80') : theme.textMuted}`}>
                {sublabel}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className={`animate-spin w-8 h-8 border-2 border-t-transparent rounded-full ${
            isDark ? 'border-amber-500' : 'border-amber-600'
          }`} />
        </div>
      )}

      {/* Kanji Grid */}
      {!isLoading && kanji.length > 0 && (
        <div className="space-y-4">
          {/* Count Header */}
          <div className={`flex items-center justify-between ${theme.textMuted}`}>
            <span className="text-sm">
              {kanji.length} kanji
              {selectedJLPT && ` • JLPT N${selectedJLPT}`}
              {selectedGrade && ` • Grade ${typeof selectedGrade === 'number' ? selectedGrade : 'Secondary'}`}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${theme.badge}`}>
              Sorted by stroke count
            </span>
          </div>

          {/* Grouped by Stroke */}
          {Object.entries(kanjiByStroke)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([stroke, kanjis]) => (
              <div key={stroke} className="space-y-2">
                <div className={`text-xs font-medium ${theme.textMuted}`}>
                  {stroke} stroke{parseInt(stroke) !== 1 ? 's' : ''} ({kanjis.length})
                </div>
                <KanjiGrid
                  kanji={kanjis as KanjiSummary[]}
                  onKanjiClick={onKanjiClick}
                  isDark={isDark}
                />
              </div>
            ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && kanji.length === 0 && (selectedJLPT || selectedGrade) && (
        <div className={`text-center py-12 ${theme.textMuted}`}>
          <div className="text-5xl mb-4">📚</div>
          <p className="text-lg">No kanji found</p>
          <p className="text-sm mt-2">This level may not have data available yet</p>
        </div>
      )}

      {/* Initial State */}
      {!isLoading && !selectedJLPT && !selectedGrade && (
        <div className={`text-center py-12 ${theme.textMuted}`}>
          <div className="text-5xl mb-4">
            {mode === 'jlpt' ? '🎌' : '🏫'}
          </div>
          <p className="text-lg">
            {mode === 'jlpt' ? 'Select a JLPT level to browse' : 'Select a grade level to browse'}
          </p>
          <p className="text-sm mt-2">
            {mode === 'jlpt'
              ? 'N5 is beginner, N1 is advanced'
              : 'Start with Grade 1 for the most common kanji'}
          </p>
        </div>
      )}
    </div>
  );
}

export default KanjiBrowser;
