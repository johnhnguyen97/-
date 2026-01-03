import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { KanjiSearch } from '../components/Kanji/KanjiSearch';
import { KanjiGrid } from '../components/Kanji/KanjiGrid';
import { KanjiDetailModal } from '../components/Kanji/KanjiDetailModal';
import { KanjiBrowser } from '../components/Kanji/KanjiBrowser';
import { RadicalExplorer } from '../components/Kanji/RadicalExplorer';
import { RadicalDrill } from '../components/Kanji/RadicalGame/RadicalDrill';
import type { KanjiPageTab, KanjiSummary, KanjiDetail, Radical } from '../types/kanji';
import { searchKanji } from '../services/kanjiApi';

export function KanjiPage() {
  const { session } = useAuth();
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<KanjiPageTab>('dictionary');

  // Dictionary state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KanjiSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Detail modal state
  const [selectedKanji, setSelectedKanji] = useState<KanjiDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Radical explorer state
  const [selectedRadical, setSelectedRadical] = useState<Radical | null>(null);

  // Dictionary mode (search vs browse)
  const [dictMode, setDictMode] = useState<'search' | 'browse'>('search');

  // Theme classes
  const theme = {
    bg: isDark
      ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800'
      : 'bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100',
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-stone-200',
    cardSolid: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-200',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-slate-400' : 'text-gray-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-gray-400',
    accent: isDark ? 'text-amber-400' : 'text-amber-600',
    kanjiColor: isDark ? 'text-white/10' : 'text-amber-300/40',
  };

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

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
    // For now, just set basic info - detail will be fetched in modal
    setSelectedKanji(kanji as KanjiDetail);
    setIsDetailOpen(true);
  };

  // Handle radical click (from explorer)
  const handleRadicalClick = (radical: Radical) => {
    setSelectedRadical(radical);
  };

  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dictionary':
        return (
          <div className="space-y-6">
            {/* Dictionary Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setDictMode('search')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  dictMode === 'search'
                    ? isDark
                      ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
                      : 'bg-amber-100 text-amber-700 border-amber-300'
                    : isDark
                      ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>🔍</span>
                <span>Search</span>
              </button>
              <button
                onClick={() => setDictMode('browse')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  dictMode === 'browse'
                    ? isDark
                      ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
                      : 'bg-amber-100 text-amber-700 border-amber-300'
                    : isDark
                      ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>📚</span>
                <span>Browse by Level</span>
              </button>
            </div>

            {/* Search Mode */}
            {dictMode === 'search' && (
              <>
                <KanjiSearch
                  value={searchQuery}
                  onChange={handleSearch}
                  isLoading={isSearching}
                  isDark={isDark}
                />

                {searchError && (
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {searchError}
                  </div>
                )}

                {searchResults.length > 0 ? (
                  <KanjiGrid
                    kanji={searchResults}
                    onKanjiClick={handleKanjiClick}
                    isDark={isDark}
                  />
                ) : searchQuery && !isSearching ? (
                  <div className={`text-center py-12 ${theme.textMuted}`}>
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-lg">No kanji found for "{searchQuery}"</p>
                    <p className="text-sm mt-2">Try searching by character, reading, or meaning</p>
                  </div>
                ) : !searchQuery ? (
                  <div className={`text-center py-12 ${theme.textMuted}`}>
                    <div className="text-6xl mb-4">漢</div>
                    <p className="text-lg">Search for kanji</p>
                    <p className="text-sm mt-2">Enter a kanji character, reading (hiragana/katakana), or English meaning</p>
                  </div>
                ) : null}
              </>
            )}

            {/* Browse Mode */}
            {dictMode === 'browse' && (
              <KanjiBrowser
                onKanjiClick={handleKanjiClick}
                isDark={isDark}
              />
            )}
          </div>
        );

      case 'radicals':
        return (
          <RadicalExplorer
            onRadicalClick={handleRadicalClick}
            selectedRadical={selectedRadical}
            isDark={isDark}
          />
        );

      case 'drill':
        return (
          <RadicalDrill isDark={isDark} />
        );

      default:
        return null;
    }
  };

  const tabs: { id: KanjiPageTab; label: string; icon: string }[] = [
    { id: 'dictionary', label: 'Dictionary', icon: '📖' },
    { id: 'radicals', label: 'Radicals', icon: '部' },
    { id: 'drill', label: 'Practice', icon: '🎮' },
  ];

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${theme.bg} transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-[120px]"></div>
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-amber-100/40 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-orange-100/30 to-transparent rounded-full blur-3xl"></div>
          </>
        )}
        {/* Decorative kanji */}
        <div className={`absolute top-20 right-20 text-[150px] font-serif select-none ${theme.kanjiColor}`}>漢</div>
        <div className={`absolute bottom-40 left-10 text-[120px] font-serif select-none ${theme.kanjiColor}`}>字</div>
      </div>

      <div className="relative z-10 py-6 px-4 mx-auto max-w-5xl">
        {/* Page Header */}
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg ${
              isDark ? 'bg-gradient-to-br from-amber-600 to-orange-600' : 'bg-gradient-to-br from-amber-500 to-orange-500'
            }`}>
              <span className="text-white font-bold">漢</span>
            </div>
            <div className="text-left">
              <h1 className={`text-xl md:text-2xl font-bold ${theme.text}`}>Kanji & Radicals</h1>
              <p className={`text-sm ${theme.textMuted}`}>Learn kanji through radical patterns</p>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className={`mb-6 p-1 rounded-xl backdrop-blur-sm border ${theme.card}`}>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? isDark
                      ? 'bg-amber-600/20 text-amber-400 shadow-sm'
                      : 'bg-amber-500 text-white shadow-md'
                    : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`backdrop-blur-sm rounded-2xl shadow-lg border overflow-hidden ${theme.cardSolid}`}>
          <div className="p-4 md:p-6">
            {renderTabContent()}
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
    </div>
  );
}

export default KanjiPage;
