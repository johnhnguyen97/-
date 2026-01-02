import { useState, useCallback, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Settings } from './components/Settings';
import { SentenceInput } from './components/SentenceInput';
import { SentenceDisplay } from './components/SentenceDisplay';
import { GrammarSidebar } from './components/GrammarSidebar';
import { ToolboxButton } from './components/ToolboxButton';
import { Logo } from './components/Logo';
import { Button, IconButton } from './lib/gojun-ui';
import { parseEnglishSentence, describeSentenceStructure } from './services/englishParser';
import { translateSentence } from './services/japaneseApi';
import { handleKeepCallback } from './services/keepApi';
import { recordActivity } from './services/userStatsApi';
import type { WordSlot, SentenceStructure, GrammarNote } from './types';

// Fun Japanese loading phrases
const LOADING_PHRASES = [
  { japanese: '頑張って！', romaji: 'Ganbatte!', english: 'Do your best!' },
  { japanese: 'ちょっと待ってね', romaji: 'Chotto matte ne', english: 'Wait a moment~' },
  { japanese: '準備中...', romaji: 'Junbi-chū...', english: 'Preparing...' },
  { japanese: '考え中', romaji: 'Kangae-chū', english: 'Thinking...' },
  { japanese: 'もうすぐ！', romaji: 'Mō sugu!', english: 'Almost there!' },
  { japanese: '日本語は楽しい', romaji: 'Nihongo wa tanoshii', english: 'Japanese is fun!' },
  { japanese: '一緒に勉強しよう', romaji: 'Issho ni benkyō shiyō', english: "Let's study together!" },
  { japanese: 'わくわく', romaji: 'Waku waku', english: 'Excited!' },
];

// Split text into sentences
function splitIntoSentences(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences.length > 0 ? sentences : [text];
}

// State for each sentence
interface SentenceState {
  original: string;
  structure: SentenceStructure | null;
  wordSlots: WordSlot[];
  selectedSlotId: string | null;
  showAnswers: boolean;
  structureDescription: string;
  grammarNotes: GrammarNote[];
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
}

// Loading Screen Component
function LoadingScreen({ phrase, isDark = false }: { phrase: typeof LOADING_PHRASES[0]; isDark?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative mb-8">
        {/* Animated rings */}
        <div className={`absolute inset-0 w-24 h-24 rounded-full border-4 animate-ping opacity-20 ${
          isDark ? 'border-amber-400' : 'border-amber-200'
        }`}></div>
        <div className={`absolute inset-2 w-20 h-20 rounded-full border-4 animate-ping opacity-30 ${
          isDark ? 'border-amber-500' : 'border-amber-300'
        }`} style={{ animationDelay: '0.2s' }}></div>
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl">
          <span className="text-4xl animate-bounce">📝</span>
        </div>
      </div>

      <div className="text-center">
        <p className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{phrase.japanese}</p>
        <p className={`text-sm italic mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{phrase.romaji}</p>
        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>{phrase.english}</p>
      </div>

      <div className="mt-8 flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-amber-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

interface AppContentProps {
  embedded?: boolean;
  isDark?: boolean;
}

function AppContent({ embedded = false, isDark = false }: AppContentProps) {
  const { user, session, loading } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Theme classes for embedded mode
  const theme = {
    bg: embedded
      ? 'bg-transparent'
      : isDark
        ? 'bg-[#0f0f1a]'
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
    textSubtle: isDark ? 'text-gray-500' : 'text-gray-400',
    card: isDark ? 'bg-gray-800/80' : 'bg-white/80',
    cardBorder: isDark ? 'border-gray-700' : 'border-amber-200',
    input: isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300',
    button: isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white hover:bg-gray-50',
    buttonPrimary: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    success: isDark ? 'bg-green-600' : 'bg-gradient-to-r from-green-400 to-emerald-500',
    error: isDark ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-red-100 border-red-300 text-red-700',
  };

  // Multi-sentence state
  const [sentences, setSentences] = useState<SentenceState[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);

  // Track if game is active
  const [gameActive, setGameActive] = useState(false);

  // Loading phrase
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);

  // Pick random phrase when loading starts
  useEffect(() => {
    if (isLoadingAll) {
      setLoadingPhrase(LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);
    }
  }, [isLoadingAll]);

  // Handle Keep OAuth callback on app load
  useEffect(() => {
    console.log('App mount - checking for Keep callback...');
    console.log('Current URL:', window.location.href);
    try {
      const tokens = handleKeepCallback();
      if (tokens) {
        console.log('App.tsx: Keep connected successfully:', tokens.email);
        // Tokens are now stored in localStorage
        // User can open Settings to see the connected status
      }
    } catch (err) {
      console.error('Keep OAuth error:', err);
    }
  }, []);

  const loadSentence = useCallback(async (sentence: string, index: number): Promise<Partial<SentenceState>> => {
    if (!session?.access_token) {
      return { error: 'Please sign in to use the translator', isLoading: false };
    }

    try {
      const structure = parseEnglishSentence(sentence);
      const aiTranslation = await translateSentence(
        sentence,
        structure.parsedWords,
        session.access_token
      );

      structure.wordOrderDisplay = aiTranslation.wordOrderDisplay;
      structure.fullTranslation = aiTranslation.fullTranslation;

      const slots: WordSlot[] = aiTranslation.words.map((word, idx) => ({
        id: `sentence-${index}-slot-${idx}`,
        englishWord: {
          text: word.english,
          tag: word.partOfSpeech,
          role: word.role as 'subject' | 'verb' | 'object' | 'adjective' | 'adverb' | 'other'
        },
        japaneseWord: word,
        isFilledCorrectly: null,
        userAnswer: null
      }));

      return {
        structure,
        wordSlots: slots,
        structureDescription: describeSentenceStructure(structure),
        grammarNotes: aiTranslation.grammarNotes || [],
        isLoading: false,
        error: null
      };
    } catch (err) {
      console.error('Error processing sentence:', err);
      return {
        error: err instanceof Error ? err.message : 'Failed to translate sentence',
        isLoading: false
      };
    }
  }, [session]);

  const handleTextSubmit = useCallback(async (text: string) => {
    const sentenceTexts = splitIntoSentences(text).slice(0, 6);
    setIsLoadingAll(true);
    setGlobalError(null);
    setActiveSentenceIndex(0);
    setGameActive(true);
    setSidebarOpen(true); // Re-open grammar notes when new sentence is submitted

    const initialStates: SentenceState[] = sentenceTexts.map((s) => ({
      original: s,
      structure: null,
      wordSlots: [],
      selectedSlotId: null,
      showAnswers: false,
      structureDescription: '',
      grammarNotes: [],
      isLoading: true,
      error: null,
      isComplete: false
    }));
    setSentences(initialStates);

    const results = await Promise.all(
      sentenceTexts.map((sentence, index) => loadSentence(sentence, index))
    );

    setSentences(prev => prev.map((s, i) => ({
      ...s,
      ...results[i]
    })));

    setIsLoadingAll(false);
  }, [loadSentence]);

  const handleSlotClick = useCallback((sentenceIndex: number, slotId: string) => {
    setActiveSentenceIndex(sentenceIndex);
    setSentences(prev => prev.map((s, i) => {
      if (i === sentenceIndex) {
        return { ...s, selectedSlotId: s.selectedSlotId === slotId ? null : slotId };
      }
      return s;
    }));
  }, []);

  const handleWordBankClick = useCallback((sentenceIndex: number, targetSlotId: string, answerSlotId: string) => {
    setSentences(prev => prev.map((s, i) => {
      if (i !== sentenceIndex) return s;

      const newSlots = s.wordSlots.map(slot => {
        if (slot.id === targetSlotId) {
          if (!answerSlotId) {
            return { ...slot, userAnswer: null, isFilledCorrectly: null };
          }
          const isCorrect = slot.id === answerSlotId;
          return { ...slot, userAnswer: answerSlotId, isFilledCorrectly: isCorrect };
        }
        return slot;
      });

      const allCorrect = newSlots.length > 0 && newSlots.every(slot => slot.isFilledCorrectly === true);

      return {
        ...s,
        wordSlots: newSlots,
        selectedSlotId: null,
        isComplete: allCorrect
      };
    }));
  }, []);

  const handleNewSentence = useCallback(() => {
    setSentences([]);
    setGameActive(false);
    setActiveSentenceIndex(0);
  }, []);

  const handleReset = useCallback((sentenceIndex: number) => {
    setSentences(prev => prev.map((s, i) => {
      if (i !== sentenceIndex) return s;
      return {
        ...s,
        wordSlots: s.wordSlots.map(slot => ({ ...slot, userAnswer: null, isFilledCorrectly: null })),
        showAnswers: false,
        selectedSlotId: null,
        isComplete: false
      };
    }));
  }, []);

  const handleShowAnswers = useCallback((sentenceIndex: number) => {
    setSentences(prev => prev.map((s, i) => {
      if (i !== sentenceIndex) return s;
      return {
        ...s,
        showAnswers: true,
        wordSlots: s.wordSlots.map(slot => ({ ...slot, userAnswer: slot.id, isFilledCorrectly: true }))
      };
    }));
  }, []);

  const handleResetAll = useCallback(() => {
    setSentences(prev => prev.map(s => ({
      ...s,
      wordSlots: s.wordSlots.map(slot => ({ ...slot, userAnswer: null, isFilledCorrectly: null })),
      showAnswers: false,
      selectedSlotId: null,
      isComplete: false
    })));
  }, []);

  const completedCount = sentences.filter(s => s.isComplete).length;
  const totalCount = sentences.length;

  // Track if we've already recorded this session completion
  const hasRecordedCompletion = useRef(false);

  // Record activity when all sentences are completed
  useEffect(() => {
    if (
      totalCount > 0 &&
      completedCount === totalCount &&
      !sentences.some(s => s.showAnswers) &&
      session?.access_token &&
      !hasRecordedCompletion.current
    ) {
      hasRecordedCompletion.current = true;
      recordActivity(session.access_token, 'word_game').catch(err => {
        console.error('Failed to record word game activity:', err);
      });
    }
  }, [completedCount, totalCount, sentences, session?.access_token]);

  // Reset the completion tracking when starting a new game
  useEffect(() => {
    if (!gameActive) {
      hasRecordedCompletion.current = false;
    }
  }, [gameActive]);

  const allGrammarData = sentences.map((s, i) => ({
    sentenceIndex: i,
    original: s.original,
    wordSlots: s.wordSlots,
    structureDescription: s.structureDescription,
    grammarNotes: s.grammarNotes,
    isActive: i === activeSentenceIndex
  })).filter(s => s.grammarNotes.length > 0 || s.wordSlots.length > 0);

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mb-4"></div>
          <p className={theme.textMuted}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const hasSentences = sentences.length > 0 && !isLoadingAll;

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <div className="flex">
        <div className={`flex-1 py-8 px-4 transition-all duration-300 ${hasSentences && sidebarOpen ? 'lg:mr-80' : ''}`}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <header className={`text-center relative mb-6 ${gameActive ? 'mb-4' : 'mb-8'}`}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <Logo size={gameActive ? 'sm' : 'md'} />
                <span className={`${theme.textMuted} font-medium ${gameActive ? 'text-lg' : 'text-2xl'}`}>(Gojun)</span>
              </div>
              {!gameActive && (
                <p className={theme.textMuted}>
                  Learn Japanese word order by rearranging English sentences
                </p>
              )}

              {/* Only show settings button when not embedded */}
              {!embedded && (
                <IconButton
                  onClick={() => setShowSettings(true)}
                  className="absolute right-0 top-0"
                  variant="ghost"
                  size="md"
                  aria-label="Settings"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
              )}


            </header>

            {globalError && (
              <div className={`mb-6 p-4 rounded-lg border ${theme.error}`}>
                {globalError}
              </div>
            )}

            {/* Input Section - only show when not in game */}
            {!gameActive && (
              <div className="mb-8">
                <SentenceInput onSubmit={handleTextSubmit} isLoading={isLoadingAll} />

                <div className={`mt-6 text-center p-8 backdrop-blur-sm rounded-2xl border-2 border-dashed ${
                  isDark ? 'bg-gray-800/60 border-gray-600' : 'bg-white/60 border-amber-200'
                }`}>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg">
                    📝
                  </div>
                  <p className={`text-lg font-medium ${theme.textMuted}`}>
                    Enter English text above to get started!
                  </p>
                  <p className={`mt-2 ${theme.textSubtle}`}>
                    You can enter a single sentence or paste a paragraph (up to 6 sentences).
                  </p>
                  <p className="text-amber-600 mt-3 text-sm font-medium">
                    Try: "The weather is nice today." or "I want to eat sushi."
                  </p>
                </div>
              </div>
            )}

            {/* Loading Screen */}
            {isLoadingAll && (
              <div className={`backdrop-blur-sm rounded-2xl border shadow-sm ${
                isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-amber-200'
              }`}>
                <LoadingScreen phrase={loadingPhrase} isDark={isDark} />
              </div>
            )}

            {/* Game Section */}
            {hasSentences && (
              <div>
                {/* Progress bar for multiple sentences */}
                {sentences.length > 1 && (
                  <div className={`mb-6 p-4 backdrop-blur-sm rounded-xl border flex items-center justify-between shadow-sm ${
                    isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        Progress: <span className="text-amber-500">{completedCount}</span> / {totalCount}
                      </span>
                      <div className="flex gap-1">
                        {sentences.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveSentenceIndex(i)}
                            className={`w-3 h-3 rounded-full transition-all ${
                              s.isComplete ? 'bg-green-500' : 'bg-amber-300'
                            } ${i === activeSentenceIndex ? 'ring-2 ring-amber-500 ring-offset-1' : ''}`}
                            title={`Sentence ${i + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleResetAll}
                        variant="ghost"
                        size="sm"
                      >
                        Reset All
                      </Button>
                      <Button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        variant="ghost"
                        intent="primary"
                        size="sm"
                        className="hidden lg:flex"
                      >
                        {sidebarOpen ? 'Hide Notes' : 'Show Notes'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sentences */}
                <div className="space-y-8">
                  {sentences.map((sentence, index) => (
                    <div
                      key={index}
                      className="relative"
                      onClick={() => setActiveSentenceIndex(index)}
                    >
                      {sentences.length > 1 && (
                        <div className={`absolute -left-4 -top-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white z-10 shadow-lg ${
                          sentence.isComplete ? 'bg-green-500' : index === activeSentenceIndex ? 'bg-amber-600 ring-2 ring-amber-300' : 'bg-amber-500'
                        }`}>
                          {index + 1}
                        </div>
                      )}

                      {sentence.error ? (
                        <div className={`p-4 rounded-2xl border ${
                          isDark ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          <p className="font-medium">Error:</p>
                          <p>{sentence.error}</p>
                        </div>
                      ) : sentence.structure ? (
                        <div className={`${sentence.isComplete ? 'ring-2 ring-green-500 ring-offset-2 rounded-2xl' : index === activeSentenceIndex && sentences.length > 1 ? 'ring-2 ring-amber-300 ring-offset-2 rounded-2xl' : ''}`}>
                          <SentenceDisplay
                            originalSentence={sentence.structure.original}
                            wordSlots={sentence.wordSlots}
                            selectedSlotId={sentence.selectedSlotId}
                            onSlotClick={(slotId) => handleSlotClick(index, slotId)}
                            onWordBankClick={(targetSlotId, answerSlotId) => handleWordBankClick(index, targetSlotId, answerSlotId)}
                            showAnswers={sentence.showAnswers}
                            wordOrderDisplay={sentence.structure.wordOrderDisplay}
                            fullTranslation={sentence.structure.fullTranslation}
                          />

                          {/* Buttons - properly contained */}
                          <div className={`mt-6 p-4 rounded-xl flex flex-wrap justify-center gap-3 ${
                            isDark ? 'bg-gray-800/60' : 'bg-white/60'
                          }`}>
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleNewSentence(); }}
                              variant="outline"
                              leftIcon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                              }
                            >
                              New Sentence
                            </Button>
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleReset(index); }}
                              variant="outline"
                              intent="primary"
                              leftIcon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              }
                            >
                              Reset
                            </Button>
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleShowAnswers(index); }}
                              variant="solid"
                              intent="primary"
                              leftIcon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              }
                            >
                              Show Answers
                            </Button>
                            {/* Show Grammar Notes button - visible when sidebar is closed and grammar data exists */}
                            {!sidebarOpen && allGrammarData.length > 0 && (
                              <Button
                                onClick={(e) => { e.stopPropagation(); setSidebarOpen(true); }}
                                variant="outline"
                                intent="secondary"
                                leftIcon={
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                }
                              >
                                Grammar Notes
                              </Button>
                            )}
                          </div>

                          {sentence.isComplete && !sentence.showAnswers && (
                            <div className={`mt-4 p-4 rounded-xl text-center text-white ${
                              isDark ? 'bg-green-600' : 'bg-gradient-to-r from-green-400 to-emerald-500'
                            }`}>
                              <span className="text-lg font-bold">
                                🎉 正解！(Seikai!) - Correct!
                              </span>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* All Complete */}
                {totalCount > 0 && completedCount === totalCount && !sentences.some(s => s.showAnswers) && (
                  <div className={`mt-8 p-6 rounded-2xl text-center text-white shadow-xl ${
                    isDark ? 'bg-green-600' : 'bg-gradient-to-r from-green-400 to-emerald-500'
                  }`}>
                    <h2 className="text-2xl font-bold mb-2">
                      🎊 全部正解！(Zenbu Seikai!) 🎊
                    </h2>
                    <p className={isDark ? 'text-green-200 mb-4' : 'text-green-100 mb-4'}>
                      You completed all {totalCount} sentences!
                    </p>
                    <Button
                      onClick={handleNewSentence}
                      variant="solid"
                      size="lg"
                      className="bg-white text-green-600 hover:bg-gray-100"
                    >
                      Try Another Sentence →
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile grammar notes */}
            {hasSentences && allGrammarData.length > 0 && (
              <div className="lg:hidden mt-8">
                <GrammarSidebar
                  grammarData={allGrammarData}
                  activeSentenceIndex={activeSentenceIndex}
                  onSelectSentence={setActiveSentenceIndex}
                  isMobile={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        {hasSentences && sidebarOpen && allGrammarData.length > 0 && (
          <div className={`hidden lg:block fixed right-0 top-0 h-screen w-80 backdrop-blur-md border-l overflow-y-auto shadow-xl z-40 ${
            isDark ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'
          }`}>
            <GrammarSidebar
              grammarData={allGrammarData}
              activeSentenceIndex={activeSentenceIndex}
              onSelectSentence={setActiveSentenceIndex}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        )}
      </div>

      <ToolboxButton />
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

interface AppProps {
  embedded?: boolean;
  isDark?: boolean;
}

function App({ embedded = false, isDark = false }: AppProps) {
  return (
    <AuthProvider>
      <AppContent embedded={embedded} isDark={isDark} />
    </AuthProvider>
  );
}

export default App;
