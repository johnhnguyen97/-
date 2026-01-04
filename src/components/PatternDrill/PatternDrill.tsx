import React, { useState, useCallback, useEffect } from 'react';
import { DrillSettingsPanel } from './DrillSettings';
import { DrillQuestionDisplay } from './DrillQuestion';
import { DrillAnswer } from './DrillAnswer';
import { DrillFeedback } from './DrillFeedback';
import { DrillProgress } from './DrillProgress';
import { GrammarSidebar } from './GrammarSidebar';
import { MobilePatternDrill } from './MobilePatternDrill';
import { getDrillSession, recordDrillAnswer } from '../../services/drillApi';
import {
  DEFAULT_DRILL_SETTINGS,
  checkAnswer,
  getDrillCategory,
  calculateAccuracy,
} from '../../types/drill';
import type {
  DrillSettings as DrillSettingsType,
  DrillGameState,
  DrillSessionStats,
} from '../../types/drill';
import { useAuth } from '../../contexts/AuthContext';

const initialStats: DrillSessionStats = {
  totalQuestions: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  skippedAnswers: 0,
  accuracy: 0,
  categoryStats: {},
  questionResults: [],
};

interface PatternDrillProps {
  onClose?: () => void;
}

export const PatternDrill: React.FC<PatternDrillProps> = ({ onClose }) => {
  const { session } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use mobile version on smaller screens
  if (isMobile) {
    return <MobilePatternDrill onClose={onClose} />;
  }

  const [gameState, setGameState] = useState<DrillGameState>({
    status: 'loading',
    questions: [],
    currentIndex: 0,
    userAnswer: '',
    isCorrect: null,
    isSkipped: false,
    sessionStats: initialStats,
    settings: DEFAULT_DRILL_SETTINGS,
  });
  const [showSettings, setShowSettings] = useState(true);
  const [showGrammarSidebar, setShowGrammarSidebar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const loadSession = useCallback(async (settings: DrillSettingsType) => {
    if (!session?.access_token) {
      setError('Please sign in to use the drill');
      return;
    }

    setGameState((prev) => ({ ...prev, status: 'loading' }));
    setError(null);

    try {
      const response = await getDrillSession(session.access_token, {
        phases: settings.selectedPhases,
        jlptLevel: settings.jlptLevel,
        wordTypes: settings.selectedWordTypes,
        count: settings.questionsPerSession,
        practiceMode: settings.practiceMode,
        bidirectional: settings.bidirectional,
        srsReviewMode: settings.srsReviewMode,
      });

      setGameState((prev) => ({
        ...prev,
        status: 'playing',
        questions: response.questions,
        currentIndex: 0,
        userAnswer: '',
        isCorrect: null,
      }));
      setQuestionStartTime(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
      setGameState((prev) => ({ ...prev, status: 'playing' }));
    }
  }, [session]);

  const handleStart = () => {
    setShowSettings(false);
    setGameState((prev) => ({
      ...prev,
      questions: [],
      currentIndex: 0,
      sessionStats: initialStats,
    }));
    loadSession(gameState.settings);
  };

  const handleAnswer = (answer: string) => {
    const currentQuestion = gameState.questions[gameState.currentIndex];
    if (!currentQuestion) return;

    const isCorrect = checkAnswer(answer, currentQuestion.correctAnswer);
    const category = getDrillCategory(
      currentQuestion.sentence.word_type,
      currentQuestion.prompt.from_form,
      currentQuestion.prompt.to_form
    );

    // Calculate response time for SRS quality scoring
    const responseTimeMs = Date.now() - questionStartTime;

    // Record answer for SRS tracking (fire and forget - don't block UI)
    if (session?.access_token && currentQuestion.sentence.id) {
      recordDrillAnswer(session.access_token, {
        verbId: currentQuestion.sentence.id,
        conjugationForm: currentQuestion.prompt.to_form,
        isCorrect,
        responseTimeMs,
      }).catch(() => {
        // Silently fail - SRS tracking is non-critical
      });
    }

    setGameState((prev) => {
      const newStats = { ...prev.sessionStats };
      newStats.totalQuestions++;
      if (isCorrect) {
        newStats.correctAnswers++;
      } else {
        newStats.incorrectAnswers++;
      }
      newStats.accuracy = calculateAccuracy(
        newStats.correctAnswers,
        newStats.totalQuestions
      );

      // Update category stats
      if (!newStats.categoryStats[category]) {
        newStats.categoryStats[category] = { correct: 0, total: 0 };
      }
      newStats.categoryStats[category].total++;
      if (isCorrect) {
        newStats.categoryStats[category].correct++;
      }

      return {
        ...prev,
        status: 'answered',
        userAnswer: answer,
        isCorrect,
        sessionStats: newStats,
      };
    });
  };

  const handleNext = () => {
    if (gameState.currentIndex + 1 >= gameState.questions.length) {
      setGameState((prev) => ({ ...prev, status: 'complete' }));
    } else {
      setGameState((prev) => ({
        ...prev,
        status: 'playing',
        currentIndex: prev.currentIndex + 1,
        userAnswer: '',
        isCorrect: null,
      }));
      // Reset timer for next question
      setQuestionStartTime(Date.now());
    }
  };

  const handleRestart = () => {
    setShowSettings(true);
  };

  const currentQuestion = gameState.questions[gameState.currentIndex];

  // Settings screen
  if (showSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Pattern Drill</h1>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
            <DrillSettingsPanel
              settings={gameState.settings}
              onSettingsChange={(settings: DrillSettingsType) =>
                setGameState((prev) => ({ ...prev, settings }))
              }
              onStart={handleStart}
            />
          </div>
        </div>
      </div>
    );
  }

  // Complete screen
  if (gameState.status === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Session Complete!
          </h2>
          <p className="text-gray-600 mb-6">Great job practicing!</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-600">
                {gameState.sessionStats.correctAnswers}
              </div>
              <div className="text-sm text-green-700">Correct</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-red-600">
                {gameState.sessionStats.incorrectAnswers}
              </div>
              <div className="text-sm text-red-700">Incorrect</div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-indigo-600">
                {gameState.sessionStats.accuracy}%
              </div>
              <div className="text-sm text-indigo-700">Accuracy</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Practice Again
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="py-3 px-6 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">Pattern Drill</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrammarSidebar(true)}
              className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
              title="Grammar Guide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        <DrillProgress
          current={gameState.currentIndex + 1}
          total={gameState.settings.questionsPerSession}
          stats={gameState.sessionStats}
        />

        {/* Main content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          {gameState.status === 'loading' && (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading question...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">{error}</div>
              <button
                onClick={() => loadSession(gameState.settings)}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {gameState.status === 'playing' && currentQuestion && (
            <div className="space-y-6">
              <DrillQuestionDisplay
                sentence={currentQuestion.sentence}
                prompt={currentQuestion.prompt}
                practiceMode={gameState.settings.practiceMode}
                exampleSentence={currentQuestion.exampleSentence}
                showFurigana={gameState.settings.showFurigana}
                showRomaji={gameState.settings.showRomaji}
              />
              <DrillAnswer
                mode={gameState.settings.mode}
                mcOptions={currentQuestion.mcOptions}
                onSubmit={handleAnswer}
                showFurigana={gameState.settings.showFurigana}
              />
            </div>
          )}

          {gameState.status === 'answered' && currentQuestion && (
            <DrillFeedback
              isCorrect={gameState.isCorrect!}
              userAnswer={gameState.userAnswer}
              correctAnswer={currentQuestion.correctAnswer}
              explanation={currentQuestion.prompt.explanation}
              onNext={handleNext}
              isLast={gameState.currentIndex + 1 >= gameState.settings.questionsPerSession}
            />
          )}
        </div>
      </div>

      {/* Grammar Sidebar - shown as a modal when toggled */}
      {showGrammarSidebar && currentQuestion && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowGrammarSidebar(false)}
          />
          <div className="fixed right-4 top-20 w-80 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="relative">
              <button
                onClick={() => setShowGrammarSidebar(false)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700 z-10"
              >
                ✕
              </button>
              <GrammarSidebar
                prompt={currentQuestion.prompt}
                sentence={currentQuestion.sentence}
                isAnswered={gameState.status === 'answered'}
                showFurigana={gameState.settings.showFurigana}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
