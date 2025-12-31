import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { KanjiSearch } from './KanjiSearch';
import { KanjiGrid } from './KanjiGrid';
import { KanjiDetailModal } from './KanjiDetailModal';
import { RadicalExplorer } from './RadicalExplorer';
import type { KanjiSummary, KanjiDetail, Radical } from '../../types/kanji';
import { searchKanji } from '../../services/kanjiApi';

interface KanjiDictionaryProps {
  isOpen: boolean;
  onClose: () => void;
}

type DictionaryTab = 'search' | 'radicals';

export function KanjiDictionary({ isOpen, onClose }: KanjiDictionaryProps) {
  const { session } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<DictionaryTab>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KanjiSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Detail modal state
  const [selectedKanji, setSelectedKanji] = useState<KanjiDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Radical explorer state
  const [selectedRadical, setSelectedRadical] = useState<Radical | null>(null);

  const theme = {
    bg: isDark ? 'bg-slate-900' : 'bg-white',
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-slate-400' : 'text-gray-500',
    border: isDark ? 'border-white/10' : 'border-gray-200',
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await searchKanji(query, session?.access_token);
      setSearchResults(result.kanji);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle kanji click
  const handleKanjiClick = (kanji: KanjiSummary) => {
    setSelectedKanji(kanji as KanjiDetail);
    setIsDetailOpen(true);
  };

  // Handle radical click
  const handleRadicalClick = (radical: Radical) => {
    setSelectedRadical(radical);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden ${theme.bg} animate-scaleIn`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${theme.border}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                isDark ? 'bg-gradient-to-br from-amber-600 to-orange-600' : 'bg-gradient-to-br from-amber-500 to-orange-500'
              }`}>
                <span className="text-white font-bold">漢</span>
              </div>
              <div>
                <h2 className={`text-lg font-bold ${theme.text}`}>Kanji Dictionary</h2>
                <p className={`text-xs ${theme.textMuted}`}>漢字辞典</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex gap-1 px-6 py-2 border-b ${theme.border}`}>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'search'
                  ? isDark
                    ? 'bg-amber-600/20 text-amber-400'
                    : 'bg-amber-500 text-white'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">🔍</span>
              Search
            </button>
            <button
              onClick={() => setActiveTab('radicals')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'radicals'
                  ? isDark
                    ? 'bg-amber-600/20 text-amber-400'
                    : 'bg-amber-500 text-white'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">部</span>
              Radicals
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {activeTab === 'search' ? (
              <div className="space-y-4">
                <KanjiSearch
                  value={searchQuery}
                  onChange={handleSearch}
                  isLoading={isSearching}
                  isDark={isDark}
                />

                {searchError && (
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <p className="font-medium">{searchError}</p>
                        {searchError.includes('Radicals') && (
                          <button
                            onClick={() => setActiveTab('radicals')}
                            className={`mt-2 text-sm underline ${isDark ? 'text-amber-300' : 'text-amber-600'}`}
                          >
                            Go to Radicals tab →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {searchResults.length > 0 ? (
                  <KanjiGrid
                    kanji={searchResults}
                    onKanjiClick={handleKanjiClick}
                    isDark={isDark}
                  />
                ) : searchQuery && !isSearching && !searchError ? (
                  <div className={`text-center py-12 ${theme.textMuted}`}>
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-lg">No kanji found for "{searchQuery}"</p>
                    <p className="text-sm mt-2">Try searching by character, reading, or meaning</p>
                  </div>
                ) : !searchQuery && !searchError ? (
                  <div className={`text-center py-12 ${theme.textMuted}`}>
                    <div className="text-5xl mb-4">漢</div>
                    <p className="text-lg">Search for kanji</p>
                    <p className="text-sm mt-2">Enter a kanji, reading (hiragana/katakana), or meaning</p>
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <p className="text-xs">💡 Tip: Use the <strong>Radicals</strong> tab to browse all 214 Kangxi radicals</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <RadicalExplorer
                onRadicalClick={handleRadicalClick}
                selectedRadical={selectedRadical}
                isDark={isDark}
              />
            )}
          </div>
        </div>
      </div>

      {/* Kanji Detail Modal */}
      {isDetailOpen && selectedKanji && (
        <KanjiDetailModal
          kanji={selectedKanji}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedKanji(null);
          }}
          isDark={isDark}
        />
      )}
    </>
  );
}

export default KanjiDictionary;
