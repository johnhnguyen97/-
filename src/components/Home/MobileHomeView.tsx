import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FavoriteButton } from '../FavoriteButton';
import { WordNoteButton } from '../WordNoteButton';
import { StrokeAnimation } from '../Kanji/StrokeAnimation';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface WordOfTheDay {
  japanese: string;
  reading: string;
  romaji?: string;
  english: string;
  type: string;
}

interface KanjiOfTheDay {
  kanji: string;
  meaning: string;
  onyomi: string[];
  kunyomi: string[];
  strokeCount?: number;
}

interface Stats {
  wordsLearned: number;
  drillsCompleted: number;
  accuracy: number;
  streak: number;
  todayMinutes: number;
  weeklyProgress: number;
}

interface StudyTip {
  title: string;
  content: string;
}

interface MobileHomeViewProps {
  firstName: string;
  jlptLevel: string;
  greeting: { en: string; jp: string };
  currentTime: Date;
  wordOfTheDay: WordOfTheDay | null;
  kanjiOfTheDay: KanjiOfTheDay | null;
  stats: Stats;
  statsLoading: boolean;
  wordLoading: boolean;
  weeklyDays: boolean[];
  todaysTip: StudyTip;
  onOpenGrammar: () => void;
  onOpenKana: () => void;
  onOpenNotes: () => void;
}

export function MobileHomeView({
  firstName,
  jlptLevel,
  greeting,
  currentTime,
  wordOfTheDay,
  kanjiOfTheDay,
  stats,
  statsLoading,
  wordLoading,
  weeklyDays,
  todaysTip,
  onOpenGrammar,
  onOpenKana,
  onOpenNotes,
}: MobileHomeViewProps) {
  const { isDark } = useTheme();
  const { speak, isSpeaking } = useSpeechSynthesis();
  const [showStrokeAnimation, setShowStrokeAnimation] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  // Theme with glassmorphism
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

  const todayDayOfWeek = currentTime.getDay();
  const todayIndex = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

  return (
    <div className={`min-h-screen ${theme.bg} pb-28`}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] ${
          isDark ? 'bg-violet-600/20' : 'bg-violet-400/30'
        }`} />
        <div className={`absolute top-1/3 -left-32 w-48 h-48 rounded-full blur-[80px] ${
          isDark ? 'bg-pink-600/15' : 'bg-pink-300/25'
        }`} />
        <div className={`absolute bottom-1/4 right-0 w-56 h-56 rounded-full blur-[90px] ${
          isDark ? 'bg-indigo-600/15' : 'bg-indigo-300/20'
        }`} />
      </div>

      <div className="relative z-10 px-4 pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm ${theme.textMuted}`}>{greeting.jp}</span>
              <span>🌸</span>
            </div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>
              {greeting.en}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className={`text-sm ${theme.textMuted}`}>
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>

          {/* JLPT Badge */}
          <div className={`px-4 py-2 rounded-2xl ${
            isDark ? 'bg-violet-500/20 border border-violet-500/30' : 'bg-violet-100 border border-violet-200'
          }`}>
            <p className={`text-xs ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>Level</p>
            <p className={`text-lg font-bold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>{jlptLevel}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className={`${theme.card} rounded-3xl p-4 border ${theme.cardBorder} ${theme.cardShadow}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'} flex items-center justify-center`}>
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <h3 className={`font-semibold ${theme.text}`}>Today's Progress</h3>
                <p className={`text-xs ${theme.textMuted}`}>今日の進捗</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Timer Button */}
              <button
                onClick={() => setShowTimer(true)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                  isDark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                }`}
                title="Study Timer"
              >
                <span className="text-lg">⏱️</span>
              </button>
              <div className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {statsLoading ? '...' : `${stats.todayMinutes} min`}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Words', value: stats.wordsLearned, icon: '📚', color: 'violet' },
              { label: 'Drills', value: stats.drillsCompleted, icon: '🔄', color: 'blue' },
              { label: 'Accuracy', value: `${stats.accuracy}%`, icon: '🎯', color: 'emerald' },
              { label: 'Streak', value: `${stats.streak}🔥`, icon: '', color: 'orange' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl p-3 text-center ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50/80'}`}
              >
                <p className={`text-xl font-bold ${
                  stat.color === 'violet' ? (isDark ? 'text-violet-400' : 'text-violet-600') :
                  stat.color === 'blue' ? (isDark ? 'text-blue-400' : 'text-blue-600') :
                  stat.color === 'emerald' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') :
                  (isDark ? 'text-orange-400' : 'text-orange-600')
                }`}>
                  {statsLoading ? '...' : stat.value}
                </p>
                <p className={`text-[10px] ${theme.textMuted} mt-0.5`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Progress */}
        <div className={`${theme.card} rounded-3xl p-4 border ${theme.cardBorder} ${theme.cardShadow}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${theme.text}`}>This Week</h3>
            <div className={`text-lg font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
              {statsLoading ? '...' : `${stats.weeklyProgress}%`}
            </div>
          </div>

          <div className="flex justify-between gap-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
              const isToday = i === todayIndex;
              const completed = weeklyDays[i];
              return (
                <div key={i} className="flex-1 text-center">
                  <p className={`text-[10px] font-medium mb-1.5 ${
                    isToday ? (isDark ? 'text-violet-400' : 'text-violet-600') : theme.textSubtle
                  }`}>{day}</p>
                  <div className={`aspect-square rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${
                    completed
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                      : isToday
                      ? `ring-2 ring-dashed ${isDark ? 'ring-violet-500/50 bg-violet-500/10' : 'ring-violet-400 bg-violet-50'}`
                      : isDark ? 'bg-white/[0.03]' : 'bg-slate-100'
                  }`}>
                    {completed && '✓'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Study Activities - Big Cards */}
        <div className="space-y-3">
          <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}>
            <span className={`w-8 h-8 rounded-xl ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'} flex items-center justify-center text-sm`}>
              📖
            </span>
            Study Activities
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/word-game', icon: '📝', title: 'Word Game', subtitle: '語順', gradient: 'from-violet-500 to-purple-600' },
              { to: '/pattern-drill', icon: '🔄', title: 'Pattern Drill', subtitle: '活用', gradient: 'from-orange-500 to-pink-600' },
              { to: '/radical-practice', icon: '部', title: 'Radicals', subtitle: '部首', gradient: 'from-pink-500 to-rose-600' },
              { to: '/calendar', icon: '📅', title: 'Calendar', subtitle: '日々', gradient: 'from-blue-500 to-indigo-600' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`${theme.card} border ${theme.cardBorder} ${theme.cardShadow} rounded-3xl p-4 transition-all active:scale-95`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl text-white shadow-lg mb-3`}>
                  {item.icon}
                </div>
                <h4 className={`font-semibold ${theme.text}`}>{item.title}</h4>
                <p className={`text-sm ${theme.textMuted}`}>{item.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Word of the Day */}
        {wordOfTheDay && (
          <WordCard
            word={wordOfTheDay}
            isDark={isDark}
            theme={theme}
            speak={speak}
            isSpeaking={isSpeaking}
            loading={wordLoading}
          />
        )}

        {/* Kanji of the Day */}
        {kanjiOfTheDay && (
          <KanjiCard
            kanji={kanjiOfTheDay}
            isDark={isDark}
            theme={theme}
            speak={speak}
            isSpeaking={isSpeaking}
            showStrokeAnimation={showStrokeAnimation}
            setShowStrokeAnimation={setShowStrokeAnimation}
          />
        )}

        {/* Study Tip */}
        <div className={`${theme.card} rounded-3xl p-4 border ${theme.cardBorder} ${theme.cardShadow}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'} flex items-center justify-center`}>
              <span className="text-lg">💡</span>
            </div>
            <div>
              <h3 className={`font-semibold ${theme.text}`}>Study Tip</h3>
              <p className={`text-xs ${theme.textMuted}`}>勉強のコツ</p>
            </div>
          </div>
          <div className={`rounded-2xl p-4 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
              <span className="font-bold">{todaysTip.title}</span> {todaysTip.content}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className={`${theme.card} rounded-3xl p-4 border ${theme.cardBorder} ${theme.cardShadow}`}>
          <h3 className={`font-semibold ${theme.text} mb-3`}>Quick Links</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Grammar', icon: '📖', onClick: onOpenGrammar },
              { label: 'Kana', icon: 'あ', onClick: onOpenKana },
              { label: 'Notes', icon: '📝', onClick: onOpenNotes },
              { label: 'Settings', icon: '⚙️', to: '/settings' },
            ].map((link) => (
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${
                    isDark ? 'bg-white/[0.03] active:bg-white/[0.08]' : 'bg-slate-50 active:bg-slate-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white'} flex items-center justify-center text-lg shadow-sm`}>
                    {link.icon}
                  </div>
                  <p className={`text-xs font-medium ${theme.textMuted}`}>{link.label}</p>
                </Link>
              ) : (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${
                    isDark ? 'bg-white/[0.03] active:bg-white/[0.08]' : 'bg-slate-50 active:bg-slate-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white'} flex items-center justify-center text-lg shadow-sm`}>
                    {link.icon}
                  </div>
                  <p className={`text-xs font-medium ${theme.textMuted}`}>{link.label}</p>
                </button>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Timer Overlay */}
      {showTimer && (
        <TimerOverlay isDark={isDark} onClose={() => setShowTimer(false)} />
      )}
    </div>
  );
}

// Timer Overlay Component
function TimerOverlay({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);

  // Timer presets
  const presets = [
    { label: '15分', value: 15 },
    { label: '25分', value: 25 },
    { label: '45分', value: 45 },
    { label: '60分', value: 60 },
  ];

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes > 0) {
            setMinutes(m => m - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(s => s - 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, minutes, seconds]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setMinutes(initialMinutes);
    setSeconds(0);
  };

  const handlePreset = (value: number) => {
    setInitialMinutes(value);
    setMinutes(value);
    setSeconds(0);
    setIsRunning(false);
  };

  const progress = 1 - (minutes * 60 + seconds) / (initialMinutes * 60);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 animate-scaleIn">
        <div className={`rounded-3xl overflow-hidden ${
          isDark ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white'
        } shadow-2xl`}>
          {/* Header */}
          <div className={`px-5 py-4 flex items-center justify-between border-b ${
            isDark ? 'border-white/10' : 'border-slate-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-amber-500/20' : 'bg-amber-100'
              }`}>
                <span className="text-xl">⏱️</span>
              </div>
              <div>
                <h2 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Study Timer</h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>勉強タイマー</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Timer Display */}
          <div className="p-6">
            {/* Circular Progress */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#timerGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 283} 283`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                <span className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isRunning ? '集中中...' : 'Ready'}
                </span>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="flex justify-center gap-2 mb-6">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePreset(preset.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                    initialMinutes === preset.value
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                      : isDark
                      ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center gap-3">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex-1 max-w-[140px] py-3 rounded-2xl font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 active:scale-95 transition-transform"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className={`flex-1 max-w-[140px] py-3 rounded-2xl font-semibold active:scale-95 transition-transform ${
                    isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Pause
                </button>
              )}
              <button
                onClick={handleReset}
                className={`px-6 py-3 rounded-2xl font-semibold active:scale-95 transition-transform ${
                  isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Word Card Component
function WordCard({
  word,
  isDark,
  theme,
  speak,
  isSpeaking,
  loading,
}: {
  word: WordOfTheDay;
  isDark: boolean;
  theme: Record<string, string>;
  speak: (text: string) => void;
  isSpeaking: (text: string) => boolean;
  loading: boolean;
}) {
  return (
    <div className={`${theme.card} rounded-3xl border ${theme.cardBorder} ${theme.cardShadow} overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isDark ? 'bg-gradient-to-r from-pink-600/20 to-purple-600/20' : 'bg-gradient-to-r from-pink-100 to-purple-100'
      }`}>
        <div className="flex items-center gap-2">
          <span>🌸</span>
          <div>
            <h3 className={`font-semibold text-sm ${theme.text}`}>Word of the Day</h3>
            <p className={`text-[10px] ${theme.textMuted}`}>今日の単語</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {word.type && (
            <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
              isDark ? 'bg-white/10 text-slate-300' : 'bg-white/60 text-slate-600'
            }`}>
              {word.type}
            </span>
          )}
          <FavoriteButton
            word={word.japanese}
            reading={word.reading}
            english={word.english}
            partOfSpeech={word.type?.toLowerCase() as 'noun' | 'verb'}
          />
          <WordNoteButton
            word={word.japanese}
            reading={word.reading}
            english={word.english}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={() => speak(word.japanese)}
              className="group relative inline-block"
            >
              <p className={`text-5xl font-bold ${theme.text} group-active:scale-95 transition-transform`}>
                {word.japanese}
              </p>
              <div className={`absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                isSpeaking(word.japanese)
                  ? 'bg-pink-500 text-white scale-110'
                  : `${isDark ? 'bg-white/10' : 'bg-slate-100'}`
              }`}>
                <span className="text-sm">🔊</span>
              </div>
            </button>
            <p className={`text-xl mt-2 ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>
              {word.reading}
            </p>
            <p className={`mt-2 ${theme.textMuted}`}>
              {word.romaji && `${word.romaji} · `}{word.english}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Kanji Card Component
function KanjiCard({
  kanji,
  isDark,
  theme,
  speak,
  isSpeaking,
  showStrokeAnimation,
  setShowStrokeAnimation,
}: {
  kanji: KanjiOfTheDay;
  isDark: boolean;
  theme: Record<string, string>;
  speak: (text: string) => void;
  isSpeaking: (text: string) => boolean;
  showStrokeAnimation: boolean;
  setShowStrokeAnimation: (show: boolean) => void;
}) {
  return (
    <div className={`${theme.card} rounded-3xl border ${theme.cardBorder} ${theme.cardShadow} overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isDark ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20' : 'bg-gradient-to-r from-indigo-100 to-purple-100'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>漢</span>
          <div>
            <h3 className={`font-semibold text-sm ${theme.text}`}>Kanji of the Day</h3>
            <p className={`text-[10px] ${theme.textMuted}`}>今日の漢字</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {kanji.strokeCount && (
            <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
              isDark ? 'bg-white/10 text-slate-300' : 'bg-white/60 text-slate-600'
            }`}>
              {kanji.strokeCount}画
            </span>
          )}
          <FavoriteButton
            word={kanji.kanji}
            reading={kanji.onyomi?.[0] || kanji.kunyomi?.[0] || ''}
            english={kanji.meaning}
            partOfSpeech="kanji"
          />
          <WordNoteButton
            word={kanji.kanji}
            reading={kanji.onyomi?.[0] || kanji.kunyomi?.[0] || ''}
            english={kanji.meaning}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="text-center">
          <button
            onClick={() => speak(kanji.kanji)}
            className="group relative inline-block"
          >
            <p className={`text-7xl font-bold ${theme.text} group-active:scale-95 transition-transform`}>
              {kanji.kanji}
            </p>
            <div className={`absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isSpeaking(kanji.kanji)
                ? 'bg-indigo-500 text-white scale-110'
                : `${isDark ? 'bg-white/10' : 'bg-slate-100'}`
            }`}>
              <span className="text-sm">🔊</span>
            </div>
          </button>
          <p className={`mt-2 text-xl font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
            {kanji.meaning}
          </p>
        </div>

        {/* Readings */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {kanji.onyomi && kanji.onyomi.length > 0 && (
            <button
              onClick={() => speak(kanji.onyomi[0])}
              className={`px-4 py-2 rounded-2xl flex items-center gap-2 transition-all active:scale-95 ${
                isDark ? 'bg-purple-500/10' : 'bg-purple-50'
              }`}
            >
              <span className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>音</span>
              <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                {kanji.onyomi.slice(0, 2).join('・')}
              </span>
              <span className="text-xs">🔊</span>
            </button>
          )}
          {kanji.kunyomi && kanji.kunyomi.length > 0 && (
            <button
              onClick={() => speak(kanji.kunyomi[0].replace(/\./g, ''))}
              className={`px-4 py-2 rounded-2xl flex items-center gap-2 transition-all active:scale-95 ${
                isDark ? 'bg-blue-500/10' : 'bg-blue-50'
              }`}
            >
              <span className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>訓</span>
              <span className={`font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                {kanji.kunyomi.slice(0, 2).join('・')}
              </span>
              <span className="text-xs">🔊</span>
            </button>
          )}
        </div>

        {/* Stroke Animation Toggle */}
        <button
          onClick={() => setShowStrokeAnimation(!showStrokeAnimation)}
          className={`w-full mt-4 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
            showStrokeAnimation
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
              : isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <span>✏️</span>
          <span>{showStrokeAnimation ? '書き順を隠す' : '書き順を見る'}</span>
        </button>
      </div>

      {/* Stroke Animation */}
      {showStrokeAnimation && (
        <div className={`border-t ${theme.cardBorder} p-4`}>
          <StrokeAnimation character={kanji.kanji} isDark={isDark} />
        </div>
      )}
    </div>
  );
}

export default MobileHomeView;
