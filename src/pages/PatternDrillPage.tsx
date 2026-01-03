import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getDrillSession, updateUserAccuracy, checkAnswerLocal, type DrillQuestion } from '../services/drillApi';
import { recordDrill } from '../services/userStatsApi';
import {
  type DrillSettings,
  type DrillSessionStats,
  DEFAULT_DRILL_SETTINGS,
  DRILL_SETTINGS_KEY,
  getDrillCategory,
  calculateAccuracy
} from '../types/drill';
import { DrillQuestionDisplay } from '../components/PatternDrill/DrillQuestion';
import { DrillAnswer } from '../components/PatternDrill/DrillAnswer';
import { DrillFeedback } from '../components/PatternDrill/DrillFeedback';
import { DrillProgress } from '../components/PatternDrill/DrillProgress';
import { DrillSettingsPanel } from '../components/PatternDrill/DrillSettings';
import { GrammarSidebar } from '../components/PatternDrill/GrammarSidebar';

// Fun Japanese loading phrases for drill practice
const LOADING_PHRASES = [
  { japanese: '頑張って！', romaji: 'Ganbatte!', english: 'Do your best!' },
  { japanese: '練習開始！', romaji: 'Renshū kaishi!', english: 'Practice begins!' },
  { japanese: '準備中...', romaji: 'Junbi-chū...', english: 'Preparing...' },
  { japanese: '動詞の時間', romaji: 'Dōshi no jikan', english: 'Verb time!' },
  { japanese: 'もうすぐ！', romaji: 'Mō sugu!', english: 'Almost there!' },
  { japanese: '活用しよう', romaji: 'Katsuyō shiyō', english: "Let's conjugate!" },
  { japanese: '一緒に勉強しよう', romaji: 'Issho ni benkyō shiyō', english: "Let's study together!" },
  { japanese: 'わくわく', romaji: 'Waku waku', english: 'Excited!' },
];

// Loading Screen Component
function LoadingScreen({ phrase, isDark = false }: { phrase: typeof LOADING_PHRASES[0]; isDark?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative mb-8">
        {/* Animated rings */}
        <div className={`absolute inset-0 w-24 h-24 rounded-full border-4 animate-ping opacity-20 ${
          isDark ? 'border-violet-400' : 'border-violet-200'
        }`}></div>
        <div className={`absolute inset-2 w-20 h-20 rounded-full border-4 animate-ping opacity-30 ${
          isDark ? 'border-violet-500' : 'border-violet-300'
        }`} style={{ animationDelay: '0.2s' }}></div>
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl">
          <span className="text-4xl animate-bounce">🔄</span>
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
            className="w-3 h-3 rounded-full bg-violet-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

type GameStatus = 'settings' | 'loading' | 'playing' | 'answered' | 'complete';

export function PatternDrillPage() {
  const { session } = useAuth();
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<GameStatus>('settings');
  const [error, setError] = useState<string | null>(null);

  // Settings - persist to localStorage
  const [settings, setSettings] = useState<DrillSettings>(() => {
    try {
      const saved = localStorage.getItem(DRILL_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new settings fields
        return { ...DEFAULT_DRILL_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load drill settings:', e);
    }
    return DEFAULT_DRILL_SETTINGS;
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(DRILL_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save drill settings:', e);
    }
  }, [settings]);

  // Game state
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSkipped, setIsSkipped] = useState(false);
  const [sessionStats, setSessionStats] = useState<DrillSessionStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    skippedAnswers: 0,
    accuracy: 0,
    categoryStats: {},
    questionResults: []
  });

  // Results tracking for API update
  const [sessionResults, setSessionResults] = useState<Array<{ category: string; correct: boolean }>>([]);

  // Loading phrase
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);

  // Theme classes
  const theme = {
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-100',
    cardSolid: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-slate-400' : 'text-gray-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-gray-400',
    kanjiColor: isDark ? 'text-white/10' : 'text-purple-300/40',
  };

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Pick random phrase when loading starts
  useEffect(() => {
    if (status === 'loading') {
      setLoadingPhrase(LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);
    }
  }, [status]);

  // Start a new drill session
  const startSession = useCallback(async () => {
    if (!session?.access_token) {
      setError('Please log in to use the drill');
      return;
    }

    setStatus('loading');
    setError(null);
    setCurrentIndex(0);
    setUserAnswer('');
    setIsCorrect(null);
    setIsSkipped(false);
    setSessionResults([]);
    setSessionStats({
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      skippedAnswers: 0,
      accuracy: 0,
      categoryStats: {},
      questionResults: []
    });

    try {
      const response = await getDrillSession(session.access_token, {
        phases: settings.selectedPhases,
        jlptLevel: settings.jlptLevel,
        wordTypes: settings.selectedWordTypes,
        count: settings.questionsPerSession,
        practiceMode: settings.practiceMode,
        bidirectional: settings.bidirectional
      });

      if (response.questions.length === 0) {
        setError('No questions available for the selected criteria. Try different settings.');
        setStatus('settings');
        return;
      }

      setQuestions(response.questions);
      setSessionStats(prev => ({
        ...prev,
        totalQuestions: response.questions.length
      }));
      setStatus('playing');
    } catch (err) {
      console.error('Failed to load drill session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load drill session');
      setStatus('settings');
    }
  }, [session, settings]);

  // Handle answer submission
  const handleSubmitAnswer = useCallback((answer: string) => {
    if (status !== 'playing' || !questions[currentIndex]) return;

    const question = questions[currentIndex];
    const correct = checkAnswerLocal(answer, question.correctAnswer);

    setUserAnswer(answer);
    setIsCorrect(correct);
    setIsSkipped(false);
    setStatus('answered');

    // Track result
    const category = getDrillCategory(
      question.sentence.word_type,
      question.prompt.from_form,
      question.prompt.to_form
    );

    setSessionResults(prev => [...prev, { category, correct }]);
    setSessionStats(prev => {
      const newCorrect = prev.correctAnswers + (correct ? 1 : 0);
      const newIncorrect = prev.incorrectAnswers + (correct ? 0 : 1);
      const total = newCorrect + newIncorrect;
      return {
        ...prev,
        correctAnswers: newCorrect,
        incorrectAnswers: newIncorrect,
        accuracy: calculateAccuracy(newCorrect, total),
        questionResults: [...prev.questionResults, { correct, skipped: false }]
      };
    });
  }, [status, questions, currentIndex]);

  // Handle "I don't know" skip
  const handleSkipQuestion = useCallback(() => {
    if (status !== 'playing' || !questions[currentIndex]) return;

    const question = questions[currentIndex];

    setUserAnswer('(skipped)');
    setIsCorrect(false);
    setIsSkipped(true);
    setStatus('answered');

    // Track as incorrect
    const category = getDrillCategory(
      question.sentence.word_type,
      question.prompt.from_form,
      question.prompt.to_form
    );

    setSessionResults(prev => [...prev, { category, correct: false }]);
    setSessionStats(prev => {
      const newIncorrect = prev.incorrectAnswers + 1;
      const newSkipped = prev.skippedAnswers + 1;
      const total = prev.correctAnswers + newIncorrect;
      return {
        ...prev,
        incorrectAnswers: newIncorrect,
        skippedAnswers: newSkipped,
        accuracy: calculateAccuracy(prev.correctAnswers, total),
        questionResults: [...prev.questionResults, { correct: false, skipped: true }]
      };
    });
  }, [status, questions, currentIndex]);

  // Handle next question
  const handleNextQuestion = useCallback(async () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= questions.length) {
      // Session complete - save accuracy and record drill stats
      setStatus('complete');

      if (session?.access_token && sessionResults.length > 0) {
        try {
          // Calculate correct/incorrect from session results
          const correct = sessionResults.filter(r => r.correct).length;
          const incorrect = sessionResults.filter(r => !r.correct).length;

          // Record drill completion for user stats (this updates streak, drills count, accuracy)
          await recordDrill(session.access_token, correct, incorrect);

          // Also update the detailed accuracy tracking
          await updateUserAccuracy(session.access_token, sessionResults);
        } catch (err) {
          console.error('Failed to save stats:', err);
        }
      }
    } else {
      setCurrentIndex(nextIndex);
      setUserAnswer('');
      setIsCorrect(null);
      setIsSkipped(false);
      setStatus('playing');
    }
  }, [currentIndex, questions.length, session, sessionResults]);

  // Restart session
  const handleRestart = () => {
    setStatus('settings');
    setQuestions([]);
    setCurrentIndex(0);
    setError(null);
  };

  const currentQuestion = questions[currentIndex];

  // Check if we should show sidebar (during playing/answered states)
  const showSidebar = (status === 'playing' || status === 'answered') && currentQuestion;

  return (
    <div className={`min-h-[calc(100vh-4rem)] transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]"></div>
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-100/40 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full blur-3xl"></div>
          </>
        )}
        {/* Decorative kanji */}
        <div className={`absolute top-20 right-20 text-[150px] font-serif select-none ${theme.kanjiColor}`}>練</div>
        <div className={`absolute bottom-40 left-10 text-[120px] font-serif select-none ${theme.kanjiColor}`}>習</div>
      </div>

      <div className={`relative z-10 py-6 px-4 mx-auto ${showSidebar ? 'max-w-5xl' : 'max-w-3xl'}`}>
        {/* Page Header */}
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg ${
              isDark ? 'bg-gradient-to-br from-violet-600 to-purple-600' : 'bg-gradient-to-br from-violet-500 to-purple-500'
            }`}>
              🔄
            </div>
            <div className="text-left">
              <h1 className={`text-xl md:text-2xl font-bold ${theme.text}`}>Pattern Drill</h1>
              <p className={`text-sm ${theme.textMuted}`}>Practice conjugations with audio</p>
            </div>
          </div>

          {/* Progress (only show during game) */}
          {(status === 'playing' || status === 'answered') && questions.length > 0 && (
            <div className={`mt-4 backdrop-blur-sm rounded-xl p-4 shadow-sm border ${theme.card}`}>
              <DrillProgress
                current={currentIndex + 1}
                total={questions.length}
                stats={sessionStats}
              />
            </div>
          )}
        </header>

        {/* Content Card */}
        <div className={`backdrop-blur-sm rounded-2xl shadow-lg border overflow-hidden ${theme.cardSolid}`}>
          <div className="p-4 md:p-6">
            {/* Error state */}
            {error && (
              <div className={`mb-4 p-4 rounded-xl border ${
                isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Settings screen */}
            {status === 'settings' && (
              <DrillSettingsPanel
                settings={settings}
                onSettingsChange={setSettings}
                onStart={startSession}
              />
            )}

            {/* Loading */}
            {status === 'loading' && (
              <LoadingScreen phrase={loadingPhrase} isDark={isDark} />
            )}

            {/* Playing / Answered states */}
            {(status === 'playing' || status === 'answered') && currentQuestion && (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Content */}
                <div className="flex-1 space-y-6">
                  {/* Question */}
                  <DrillQuestionDisplay
                    sentence={currentQuestion.sentence}
                    prompt={currentQuestion.prompt}
                    practiceMode={currentQuestion.practiceMode}
                    exampleSentence={currentQuestion.exampleSentence}
                    showFurigana={settings.showFurigana}
                    showRomaji={settings.showRomaji}
                  />

                  {/* Answer input (only show when playing) */}
                  {status === 'playing' && (
                    <DrillAnswer
                      mode={settings.mode}
                      mcOptions={currentQuestion.mcOptions}
                      onSubmit={handleSubmitAnswer}
                      onSkip={handleSkipQuestion}
                      disabled={false}
                      showFurigana={settings.showFurigana}
                    />
                  )}

                  {/* Feedback (only show when answered) */}
                  {status === 'answered' && (
                    <DrillFeedback
                      isCorrect={isCorrect!}
                      isSkipped={isSkipped}
                      userAnswer={userAnswer}
                      correctAnswer={currentQuestion.correctAnswer}
                      explanation={currentQuestion.prompt.explanation}
                      onNext={handleNextQuestion}
                      isLast={currentIndex === questions.length - 1}
                    />
                  )}
                </div>

                {/* Grammar Sidebar */}
                <div className="lg:w-72 flex-shrink-0">
                  <GrammarSidebar
                    prompt={currentQuestion.prompt}
                    sentence={currentQuestion.sentence}
                    isAnswered={status === 'answered'}
                    showGrammarTips={settings.showGrammarTips}
                  />
                </div>
              </div>
            )}

            {/* Complete screen */}
            {status === 'complete' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-lg">
                  🎉
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${theme.text}`}>Session Complete!</h3>
                <p className={`mb-6 ${theme.textMuted}`}>Great work practicing your conjugations!</p>

                {/* Stats */}
                <div className={`rounded-xl p-6 mb-6 border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-gradient-to-br from-gray-50 to-white border-gray-100'
                }`}>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className={`text-3xl font-bold ${theme.text}`}>{sessionStats.totalQuestions}</div>
                      <div className={`text-sm ${theme.textMuted}`}>Questions</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-500">{sessionStats.correctAnswers}</div>
                      <div className={`text-sm ${theme.textMuted}`}>Correct</div>
                    </div>
                    <div>
                      <div className={`text-3xl font-bold ${sessionStats.accuracy >= 80 ? 'text-green-500' : sessionStats.accuracy >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {sessionStats.accuracy}%
                      </div>
                      <div className={`text-sm ${theme.textMuted}`}>Accuracy</div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleRestart}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                  >
                    Practice Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatternDrillPage;
