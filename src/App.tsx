import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Settings } from './components/Settings';
import { SentenceInput } from './components/SentenceInput';
import { SentenceDisplay } from './components/SentenceDisplay';
import { GrammarPanel } from './components/GrammarPanel';
import { parseEnglishSentence, describeSentenceStructure } from './services/englishParser';
import { translateSentence } from './services/japaneseApi';
import type { WordSlot, SentenceStructure, GrammarNote } from './types';

function AppContent() {
  const { user, session, loading, hasApiKey } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sentenceStructure, setSentenceStructure] = useState<SentenceStructure | null>(null);
  const [wordSlots, setWordSlots] = useState<WordSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [structureDescription, setStructureDescription] = useState('');
  const [grammarNotes, setGrammarNotes] = useState<GrammarNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSentenceSubmit = useCallback(async (sentence: string) => {
    if (!session?.access_token) {
      setError('Please sign in to use the translator');
      return;
    }

    if (!hasApiKey) {
      setError('Please add your Anthropic API key in Settings');
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setShowAnswers(false);
    setSelectedSlotId(null);
    setError(null);

    try {
      // Parse the English sentence first (for basic structure)
      const structure = parseEnglishSentence(sentence);

      // Get AI translation for the full sentence
      const aiTranslation = await translateSentence(
        sentence,
        structure.parsedWords,
        session.access_token
      );

      // Update structure with AI results
      structure.wordOrderDisplay = aiTranslation.wordOrderDisplay;
      structure.fullTranslation = aiTranslation.fullTranslation;

      setSentenceStructure(structure);
      setStructureDescription(describeSentenceStructure(structure));
      setGrammarNotes(aiTranslation.grammarNotes || []);

      // Create word slots from AI translation (already in Japanese order)
      const slots: WordSlot[] = aiTranslation.words.map((word, index) => ({
        id: `slot-${index}`,
        englishWord: {
          text: word.english,
          tag: word.partOfSpeech,
          role: word.role as 'subject' | 'verb' | 'object' | 'adjective' | 'adverb' | 'other'
        },
        japaneseWord: word,
        isFilledCorrectly: null,
        userAnswer: null
      }));

      setWordSlots(slots);
    } catch (err) {
      console.error('Error processing sentence:', err);
      setError(err instanceof Error ? err.message : 'Failed to translate sentence');
    } finally {
      setIsLoading(false);
    }
  }, [session, hasApiKey]);

  const handleSlotClick = useCallback((slotId: string) => {
    setSelectedSlotId(prev => prev === slotId ? null : slotId);
  }, []);

  const handleWordBankClick = useCallback((slotId: string, japanese: string) => {
    setWordSlots(prevSlots =>
      prevSlots.map(slot => {
        if (slot.id === slotId) {
          // If japanese is empty, clear the slot
          if (!japanese) {
            return {
              ...slot,
              userAnswer: null,
              isFilledCorrectly: null
            };
          }
          const isCorrect = slot.japaneseWord?.japanese === japanese;
          return {
            ...slot,
            userAnswer: japanese,
            isFilledCorrectly: isCorrect
          };
        }
        return slot;
      })
    );
    setSelectedSlotId(null);
  }, []);

  const handleReset = useCallback(() => {
    setWordSlots(prevSlots =>
      prevSlots.map(slot => ({
        ...slot,
        userAnswer: null,
        isFilledCorrectly: null
      }))
    );
    setShowAnswers(false);
    setSelectedSlotId(null);
  }, []);

  const handleShowAnswers = useCallback(() => {
    setShowAnswers(true);
    setWordSlots(prevSlots =>
      prevSlots.map(slot => ({
        ...slot,
        userAnswer: slot.japaneseWord?.japanese || null,
        isFilledCorrectly: true
      }))
    );
  }, []);

  const allCorrect = wordSlots.length > 0 &&
    wordSlots.every(slot => slot.isFilledCorrectly === true);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 relative">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            語順 <span className="text-2xl text-gray-500">(Gojun)</span>
          </h1>
          <p className="text-gray-600">
            Learn Japanese word order by rearranging English sentences
          </p>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="absolute right-0 top-0 p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* API Key Warning */}
          {!hasApiKey && (
            <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg text-amber-800 text-sm">
              <button
                onClick={() => setShowSettings(true)}
                className="font-medium underline hover:no-underline"
              >
                Add your Anthropic API key
              </button>
              {' '}to start translating sentences.
            </div>
          )}
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="mb-8">
          <SentenceInput onSubmit={handleSentenceSubmit} isLoading={isLoading} />
        </div>

        {/* Sentence Display */}
        {sentenceStructure && (
          <>
            <SentenceDisplay
              originalSentence={sentenceStructure.original}
              wordSlots={wordSlots}
              selectedSlotId={selectedSlotId}
              onSlotClick={handleSlotClick}
              onWordBankClick={handleWordBankClick}
              showAnswers={showAnswers}
              wordOrderDisplay={sentenceStructure.wordOrderDisplay}
              fullTranslation={sentenceStructure.fullTranslation}
            />

            {/* Controls */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleShowAnswers}
                className="px-4 py-2 text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
              >
                Show Answers
              </button>
            </div>

            {/* Success message */}
            {allCorrect && !showAnswers && (
              <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
                <span className="text-green-800 font-medium text-lg">
                  正解！(Seikai!) - Correct!
                </span>
              </div>
            )}

            {/* Grammar Panel */}
            <GrammarPanel
              wordSlots={wordSlots}
              structureDescription={structureDescription}
              grammarNotes={grammarNotes}
            />
          </>
        )}

        {/* Instructions when no sentence */}
        {!sentenceStructure && !isLoading && (
          <div className="text-center p-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">
              Enter an English sentence above to get started!
            </p>
            <p className="text-gray-400 mt-2">
              Try: "I eat sushi" or "She reads a book"
            </p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
