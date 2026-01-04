import React, { useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { DrillSettingsPanel } from './DrillSettings';
import { DrillAnswer } from './DrillAnswer';
import { GrammarSidebar } from './GrammarSidebar';
import { FavoriteButton } from '../FavoriteButton';
import { WordNoteButton } from '../WordNoteButton';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { Furigana } from '../common/Furigana';
import { KanjiPopover } from '../common/KanjiPopover';
import { getDrillSession, recordDrillAnswer } from '../../services/drillApi';
import {
  DEFAULT_DRILL_SETTINGS,
  checkAnswer,
  getDrillCategory,
  calculateAccuracy,
  getVerbGroupDisplayName,
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

interface MobilePatternDrillProps {
  onClose?: () => void;
}

// Check if character is kanji
function isKanji(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 0x4e00 && code <= 0x9faf) || (code >= 0x3400 && code <= 0x4dbf);
}

// Make kanji interactive
function makeKanjiInteractive(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let currentRun = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (isKanji(char)) {
      if (currentRun) {
        elements.push(<span key={`t-${i}`}>{currentRun}</span>);
        currentRun = '';
      }
      elements.push(
        <KanjiPopover key={`k-${i}`} character={char}>
          {char}
        </KanjiPopover>
      );
    } else {
      currentRun += char;
    }
  }

  if (currentRun) {
    elements.push(<span key="t-end">{currentRun}</span>);
  }

  return <>{elements}</>;
}

// Highlight target word in sentence
function highlightTargetWord(sentence: string, targetWord: string, isDark: boolean): React.ReactNode {
  if (!targetWord || !sentence) return makeKanjiInteractive(sentence);

  const stem = targetWord.endsWith('る') ? targetWord.slice(0, -1) : targetWord.slice(0, -1);
  let matchIndex = sentence.indexOf(targetWord);
  let matchLength = targetWord.length;

  if (matchIndex === -1 && stem.length >= 2) {
    const stemIndex = sentence.indexOf(stem);
    if (stemIndex !== -1) {
      const afterStem = sentence.slice(stemIndex + stem.length);
      const endMatch = afterStem.match(/^[ぁ-ん]{0,4}(?=[はがをにでとのかもやへ、。！？]|$)/);
      if (endMatch) {
        matchIndex = stemIndex;
        matchLength = stem.length + endMatch[0].length;
      }
    }
  }

  if (matchIndex === -1) return makeKanjiInteractive(sentence);

  const before = sentence.slice(0, matchIndex);
  const match = sentence.slice(matchIndex, matchIndex + matchLength);
  const after = sentence.slice(matchIndex + matchLength);

  return (
    <>
      {makeKanjiInteractive(before)}
      <span className={`underline decoration-2 underline-offset-4 ${isDark ? 'decoration-amber-400' : 'decoration-amber-500'}`}>
        {makeKanjiInteractive(match)}
      </span>
      {makeKanjiInteractive(after)}
    </>
  );
}

export const MobilePatternDrill: React.FC<MobilePatternDrillProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const { speak, isSpeaking } = useSpeechSynthesis();

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
  const [showGrammarGuide, setShowGrammarGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Theme
  const theme = {
    bg: isDark
      ? 'bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#12121f]'
      : 'bg-gradient-to-br from-violet-50 via-white to-purple-50',
    card: isDark
      ? 'bg-white/[0.03] backdrop-blur-xl'
      : 'bg-white/70 backdrop-blur-xl',
    cardBorder: isDark ? 'border-white/[0.08]' : 'border-white/60',
    cardShadow: isDark
      ? 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
      : 'shadow-[0_8px_32px_rgba(139,92,246,0.1)]',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-slate-400',
  };

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

    const responseTimeMs = Date.now() - questionStartTime;

    if (session?.access_token && currentQuestion.sentence.id) {
      recordDrillAnswer(session.access_token, {
        verbId: currentQuestion.sentence.id,
        conjugationForm: currentQuestion.prompt.to_form,
        isCorrect,
        responseTimeMs,
      }).catch(() => {});
    }

    setGameState((prev) => {
      const newStats = { ...prev.sessionStats };
      newStats.totalQuestions++;
      if (isCorrect) {
        newStats.correctAnswers++;
      } else {
        newStats.incorrectAnswers++;
      }
      newStats.accuracy = calculateAccuracy(newStats.correctAnswers, newStats.totalQuestions);

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
      setQuestionStartTime(Date.now());
    }
  };

  const handleRestart = () => {
    setShowSettings(true);
  };

  const currentQuestion = gameState.questions[gameState.currentIndex];
  const showSentence = gameState.settings.practiceMode === 'sentence' && currentQuestion?.exampleSentence;

  // Settings Screen
  if (showSettings) {
    return (
      <div className={`min-h-screen ${theme.bg} pb-24`}>
        {/* Header */}
        <div className={`sticky top-0 z-40 px-4 py-3 ${isDark ? 'bg-[#0a0a12]/80' : 'bg-white/80'} backdrop-blur-2xl border-b ${theme.cardBorder}`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-xl font-bold ${theme.text}`}>練習設定</h1>
            {onClose && (
              <button
                onClick={onClose}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className={`${theme.card} rounded-3xl border ${theme.cardBorder} ${theme.cardShadow} p-6`}>
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

  // Complete Screen
  if (gameState.status === 'complete') {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`}>
        <div className={`w-full max-w-md ${theme.card} rounded-3xl border ${theme.cardBorder} ${theme.cardShadow} p-8 text-center`}>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>完了!</h2>
          <p className={`${theme.textMuted} mb-6`}>Session Complete</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
              <div className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {gameState.sessionStats.correctAnswers}
              </div>
              <div className={`text-xs ${isDark ? 'text-emerald-400/70' : 'text-emerald-700'}`}>正解</div>
            </div>
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
              <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {gameState.sessionStats.incorrectAnswers}
              </div>
              <div className={`text-xs ${isDark ? 'text-red-400/70' : 'text-red-700'}`}>不正解</div>
            </div>
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`}>
              <div className={`text-2xl font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                {gameState.sessionStats.accuracy}%
              </div>
              <div className={`text-xs ${isDark ? 'text-violet-400/70' : 'text-violet-700'}`}>正答率</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="flex-1 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              もう一度
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className={`py-4 px-6 rounded-2xl font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                閉じる
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  return (
    <div className={`min-h-screen ${theme.bg} pb-24`}>
      {/* Ambient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] ${isDark ? 'bg-violet-600/20' : 'bg-violet-400/30'}`} />
        <div className={`absolute bottom-32 -left-32 w-48 h-48 rounded-full blur-[80px] ${isDark ? 'bg-purple-600/15' : 'bg-purple-300/25'}`} />
      </div>

      {/* Header */}
      <div className={`sticky top-0 z-40 px-4 py-3 ${isDark ? 'bg-[#0a0a12]/80' : 'bg-white/80'} backdrop-blur-2xl border-b ${theme.cardBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className={`text-lg font-bold ${theme.text}`}>練習</h1>
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>
              {gameState.currentIndex + 1}/{gameState.settings.questionsPerSession}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrammarGuide(true)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'}`}
            >
              <span className="text-lg">📖</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-300"
            style={{ width: `${((gameState.currentIndex + 1) / gameState.settings.questionsPerSession) * 100}%` }}
          />
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mt-2">
          <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            ✓ {gameState.sessionStats.correctAnswers}
          </span>
          <span className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            ✗ {gameState.sessionStats.incorrectAnswers}
          </span>
          <span className={`text-xs ${theme.textMuted}`}>
            {gameState.sessionStats.accuracy}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 relative z-10">
        {/* Loading */}
        {gameState.status === 'loading' && (
          <div className={`${theme.card} rounded-3xl border ${theme.cardBorder} ${theme.cardShadow} p-12 text-center`}>
            <div className="w-12 h-12 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className={theme.textMuted}>読み込み中...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={`${theme.card} rounded-3xl border ${theme.cardBorder} ${theme.cardShadow} p-8 text-center`}>
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => loadSession(gameState.settings)}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium"
            >
              再試行
            </button>
          </div>
        )}

        {/* Question Card */}
        {gameState.status === 'playing' && currentQuestion && (
          <div className={`${theme.card} rounded-3xl border ${theme.cardBorder} ${theme.cardShadow} overflow-hidden`}>
            {/* Question content */}
            <div className="p-6 text-center space-y-4">
              {/* Prompt */}
              <p className={`text-lg ${theme.textMuted}`}>{currentQuestion.prompt.prompt_en}</p>

              {showSentence ? (
                <>
                  {/* Sentence mode */}
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <span className={`text-2xl font-bold ${theme.text}`}>
                      {highlightTargetWord(
                        currentQuestion.exampleSentence!.japanese,
                        currentQuestion.sentence.dictionary_form || currentQuestion.sentence.japanese_base,
                        isDark
                      )}
                    </span>
                    <button
                      onClick={() => speak(currentQuestion.exampleSentence!.japanese)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isSpeaking(currentQuestion.exampleSentence!.japanese)
                          ? 'bg-violet-500 text-white animate-pulse'
                          : isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      🔊
                    </button>
                  </div>
                  <p className={`text-base ${theme.textMuted}`}>"{currentQuestion.exampleSentence!.english}"</p>

                  {/* Target word highlight box with favorite/note buttons */}
                  <div className={`relative inline-block px-4 py-3 rounded-2xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                    {/* Favorite & Note buttons - positioned on the box */}
                    <div className={`absolute -top-3 -right-3 flex gap-0.5 z-20 p-1 rounded-lg shadow-sm border ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <FavoriteButton
                        word={currentQuestion.sentence.dictionary_form || currentQuestion.sentence.japanese_base}
                        reading={currentQuestion.sentence.reading || ''}
                        english={currentQuestion.sentence.english}
                        partOfSpeech={currentQuestion.sentence.word_type === 'verb' ? 'verb' : 'adjective'}
                      />
                      <WordNoteButton
                        word={currentQuestion.sentence.dictionary_form || currentQuestion.sentence.japanese_base}
                        reading={currentQuestion.sentence.reading || ''}
                        english={currentQuestion.sentence.english}
                      />
                    </div>

                    <p className={`text-xs mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Conjugate this word:</p>
                    <div className="flex items-center justify-center gap-2">
                      {gameState.settings.showFurigana && currentQuestion.sentence.reading ? (
                        <Furigana
                          text={currentQuestion.sentence.japanese_base}
                          reading={currentQuestion.sentence.reading}
                          showFurigana={true}
                          textClassName={`text-xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}
                          furiganaClassName={`text-[0.5em] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                        />
                      ) : (
                        <span className={`text-xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                          {currentQuestion.sentence.japanese_base}
                        </span>
                      )}
                      <button
                        onClick={() => speak(currentQuestion.sentence.japanese_base)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isSpeaking(currentQuestion.sentence.japanese_base)
                            ? 'bg-amber-500 text-white animate-pulse'
                            : isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        🔊
                      </button>
                    </div>
                    <p className={`text-sm mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      ({currentQuestion.sentence.english})
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Word mode - with conjugate box */}
                  <div className={`relative inline-block px-6 py-4 rounded-2xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                    {/* Favorite & Note buttons - positioned on the box */}
                    <div className={`absolute -top-3 -right-3 flex gap-0.5 z-20 p-1 rounded-lg shadow-sm border ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <FavoriteButton
                        word={currentQuestion.sentence.dictionary_form || currentQuestion.sentence.japanese_base}
                        reading={currentQuestion.sentence.reading || ''}
                        english={currentQuestion.sentence.english}
                        partOfSpeech={currentQuestion.sentence.word_type === 'verb' ? 'verb' : 'adjective'}
                      />
                      <WordNoteButton
                        word={currentQuestion.sentence.dictionary_form || currentQuestion.sentence.japanese_base}
                        reading={currentQuestion.sentence.reading || ''}
                        english={currentQuestion.sentence.english}
                      />
                    </div>

                    <p className={`text-xs mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Conjugate this word:</p>
                    <div className="flex items-center justify-center gap-3">
                      {gameState.settings.showFurigana && currentQuestion.sentence.reading ? (
                        <Furigana
                          text={currentQuestion.sentence.japanese_base}
                          reading={currentQuestion.sentence.reading}
                          showFurigana={true}
                          textClassName={`text-3xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}
                          furiganaClassName={`text-[0.5em] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                        />
                      ) : (
                        <span className={`text-3xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                          {currentQuestion.sentence.japanese_base}
                        </span>
                      )}
                      <button
                        onClick={() => speak(currentQuestion.sentence.japanese_base)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isSpeaking(currentQuestion.sentence.japanese_base)
                            ? 'bg-amber-500 text-white animate-pulse'
                            : isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        🔊
                      </button>
                    </div>
                    <p className={`text-sm mt-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      ({currentQuestion.sentence.english})
                    </p>
                  </div>
                </>
              )}

              {/* Tags */}
              <div className="flex flex-wrap justify-center gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  currentQuestion.sentence.word_type === 'verb'
                    ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                    : isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                }`}>
                  {currentQuestion.sentence.word_type === 'verb' ? '動詞' : '形容詞'}
                  {currentQuestion.sentence.verb_group && ` (${getVerbGroupDisplayName(currentQuestion.sentence.verb_group, 'short')})`}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                  {currentQuestion.sentence.jlpt_level}
                </span>
              </div>
            </div>

            {/* Answer section */}
            <div className={`p-4 border-t ${theme.cardBorder}`}>
              <DrillAnswer
                mode={gameState.settings.mode}
                mcOptions={currentQuestion.mcOptions}
                onSubmit={handleAnswer}
                showFurigana={gameState.settings.showFurigana}
              />
            </div>
          </div>
        )}

        {/* Feedback Card */}
        {gameState.status === 'answered' && currentQuestion && (
          <div className={`${theme.card} rounded-3xl border ${theme.cardBorder} ${theme.cardShadow} overflow-hidden animate-fadeInUp`}>
            {/* Result header */}
            <div className={`p-6 text-center ${gameState.isCorrect ? (isDark ? 'bg-emerald-500/10' : 'bg-emerald-50') : (isDark ? 'bg-red-500/10' : 'bg-red-50')}`}>
              <div className="text-5xl mb-2">{gameState.isCorrect ? '🎉' : '😢'}</div>
              <h3 className={`text-xl font-bold ${gameState.isCorrect ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-red-400' : 'text-red-700')}`}>
                {gameState.isCorrect ? '正解!' : '不正解'}
              </h3>
            </div>

            {/* Answer comparison */}
            <div className="p-6 space-y-4">
              {!gameState.isCorrect && (
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                  <p className={`text-xs mb-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>あなたの答え</p>
                  <p className={`text-lg font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>{gameState.userAnswer}</p>
                </div>
              )}

              <div className={`p-4 rounded-2xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>正解</p>
                <p className={`text-lg font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {currentQuestion.correctAnswer.japanese}
                </p>
                {currentQuestion.correctAnswer.reading && (
                  <p className={`text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    ({currentQuestion.correctAnswer.reading})
                  </p>
                )}
              </div>

              {/* Explanation */}
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>解説</p>
                <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  {currentQuestion.prompt.explanation}
                </p>
              </div>

              {/* Next button */}
              <button
                onClick={handleNext}
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
              >
                {gameState.currentIndex + 1 >= gameState.settings.questionsPerSession ? '結果を見る' : '次へ'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grammar Guide Modal */}
      {showGrammarGuide && currentQuestion && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setShowGrammarGuide(false)}>
          <div
            className={`w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-t-3xl ${isDark ? 'bg-[#1a1a2e]' : 'bg-white'} animate-slideUp`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b ${theme.cardBorder} ${isDark ? 'bg-[#1a1a2e]' : 'bg-white'}`}>
              <h3 className={`text-lg font-bold ${theme.text}`}>Grammar Guide</h3>
              <button
                onClick={() => setShowGrammarGuide(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <GrammarSidebar
                prompt={currentQuestion.prompt}
                sentence={currentQuestion.sentence}
                isAnswered={gameState.status === 'answered'}
                showFurigana={gameState.settings.showFurigana}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePatternDrill;
