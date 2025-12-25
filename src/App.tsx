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

// Split text into sentences
function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation, keeping the punctuation
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences.length > 0 ? sentences : [text];
}

function AppContent() {
  const { user, session, loading, hasApiKey } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Multi-sentence support
  const [allSentences, setAllSentences] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [completedSentences, setCompletedSentences] = useState<Set<number>>(new Set());

  const [sentenceStructure, setSentenceStructure] = useState<SentenceStructure | null>(null);
  const [wordSlots, setWordSlots] = useState<WordSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [structureDescription, setStructureDescription] = useState('');
  const [grammarNotes, setGrammarNotes] = useState<GrammarNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadSentence = useCallback(async (sentence: string) => {
    if (!session?.access_token) {
      setError('Please sign in to use the translator');
      return;
    }

    setIsLoading(true);
    setShowAnswers(false);
    setSelectedSlotId(null);
    setError(null);

    try {
      const structure = parseEnglishSentence(sentence);
      const aiTranslation = await translateSentence(
        sentence,
        structure.parsedWords,
        session.access_token
      );

      structure.wordOrderDisplay = aiTranslation.wordOrderDisplay;
      structure.fullTranslation = aiTranslation.fullTranslation;

      setSentenceStructure(structure);
      setStructureDescription(describeSentenceStructure(structure));
      setGrammarNotes(aiTranslation.grammarNotes || []);

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
  }, [session]);

  const handleTextSubmit = useCallback(async (text: string) => {
    if (!hasApiKey) {
      setError('Please add your Anthropic API key in Settings');
      setShowSettings(true);
      return;
    }

    const sentences = splitIntoSentences(text);
    setAllSentences(sentences);
    setCurrentSentenceIndex(0);
    setCompletedSentences(new Set());

    await loadSentence(sentences[0]);
  }, [hasApiKey, loadSentence]);

  const handleNextSentence = useCallback(async () => {
    const nextIndex = currentSentenceIndex + 1;
    if (nextIndex < allSentences.length) {
      setCurrentSentenceIndex(nextIndex);
      await loadSentence(allSentences[nextIndex]);
    }
  }, [currentSentenceIndex, allSentences, loadSentence]);

  const handlePrevSentence = useCallback(async () => {
    const prevIndex = currentSentenceIndex - 1;
    if (prevIndex >= 0) {
      setCurrentSentenceIndex(prevIndex);
      await loadSentence(allSentences[prevIndex]);
    }
  }, [currentSentenceIndex, allSentences, loadSentence]);

  const handleSelectSentence = useCallback(async (index: number) => {
    setCurrentSentenceIndex(index);
    await loadSentence(allSentences[index]);
  }, [allSentences, loadSentence]);

  const handleSlotClick = useCallback((slotId: string) => {
    setSelectedSlotId(prev => prev === slotId ? null : slotId);
  }, []);

  const handleWordBankClick = useCallback((targetSlotId: string, answerSlotId: string) => {
    setWordSlots(prevSlots => {
      return prevSlots.map(slot => {
        if (slot.id === targetSlotId) {
          if (!answerSlotId) {
            return { ...slot, userAnswer: null, isFilledCorrectly: null };
          }
          const isCorrect = slot.id === answerSlotId;
          return { ...slot, userAnswer: answerSlotId, isFilledCorrectly: isCorrect };
        }
        return slot;
      });
    });
    setSelectedSlotId(null);
  }, []);

  const handleReset = useCallback(() => {
    setWordSlots(prevSlots =>
      prevSlots.map(slot => ({ ...slot, userAnswer: null, isFilledCorrectly: null }))
    );
    setShowAnswers(false);
    setSelectedSlotId(null);
  }, []);

  const handleShowAnswers = useCallback(() => {
    setShowAnswers(true);
    setWordSlots(prevSlots =>
      prevSlots.map(slot => ({ ...slot, userAnswer: slot.id, isFilledCorrectly: true }))
    );
  }, []);

  const allCorrect = wordSlots.length > 0 && wordSlots.every(slot => slot.isFilledCorrectly === true);

  // Mark sentence as completed when all correct
  const handleMarkComplete = useCallback(() => {
    setCompletedSentences(prev => new Set([...prev, currentSentenceIndex]));
    if (currentSentenceIndex < allSentences.length - 1) {
      handleNextSentence();
    }
  }, [currentSentenceIndex, allSentences.length, handleNextSentence]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

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

          {!hasApiKey && (
            <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg text-amber-800 text-sm">
              <button onClick={() => setShowSettings(true)} className="font-medium underline hover:no-underline">
                Add your Anthropic API key
              </button>
              {' '}to start translating sentences.
            </div>
          )}
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="mb-8">
          <SentenceInput onSubmit={handleTextSubmit} isLoading={isLoading} />
        </div>

        {/* Sentence Progress Bar (for multiple sentences) */}
        {allSentences.length > 1 && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Sentence {currentSentenceIndex + 1} of {allSentences.length}
              </span>
              <span className="text-sm text-gray-500">
                {completedSentences.size} completed
              </span>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2 flex-wrap">
              {allSentences.map((sentence, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSentence(index)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                    index === currentSentenceIndex
                      ? 'bg-amber-500 text-white'
                      : completedSentences.has(index)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title={sentence.substring(0, 50) + (sentence.length > 50 ? '...' : '')}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-3">
              <button
                onClick={handlePrevSentence}
                disabled={currentSentenceIndex === 0 || isLoading}
                className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={handleNextSentence}
                disabled={currentSentenceIndex === allSentences.length - 1 || isLoading}
                className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}

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
                {allSentences.length > 1 && currentSentenceIndex < allSentences.length - 1 && (
                  <button
                    onClick={handleMarkComplete}
                    className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Next Sentence →
                  </button>
                )}
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
              Enter English text above to get started!
            </p>
            <p className="text-gray-400 mt-2">
              You can enter a single sentence or a whole paragraph.
            </p>
            <p className="text-gray-400 mt-1 text-sm">
              Try: "I'm hungry. It's tiring to talk to people."
            </p>
          </div>
        )}
      </div>

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
