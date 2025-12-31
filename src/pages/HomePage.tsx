import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { GrammarGuide } from '../components/GrammarGuide';
import { KanaChart } from '../components/KanaChart';
import { NotesPanel } from '../components/NotesPanel';
import { TodoWidget } from '../components/TodoWidget';
import { TimerWidget } from '../components/TimerWidget';
import { getDailyData } from '../services/calendarApi';
import { getUserStats } from '../services/userStatsApi';

// Fallback Word of the Day (used when API fails or user not logged in)
const fallbackWordOfTheDay = {
  japanese: '勉強',
  reading: 'べんきょう',
  romaji: 'benkyou',
  english: 'study',
  type: 'Noun',
  example: {
    japanese: '毎日日本語を勉強します',
    reading: 'まいにちにほんごをべんきょうします',
    english: 'I study Japanese every day',
  },
};

// Study tips pool - rotate based on day of week
const studyTips = [
  {
    title: 'Consistency beats intensity.',
    content: "15 minutes daily is better than 2 hours once a week. Build the habit first!",
  },
  {
    title: 'Learn vocabulary in context.',
    content: "Don't memorize words alone. Learn them in sentences to remember how they're used.",
  },
  {
    title: 'Speak out loud!',
    content: "Practice pronunciation by reading Japanese aloud. It helps with memory and listening too.",
  },
  {
    title: 'Review is key.',
    content: "Spaced repetition beats cramming. Review old material regularly to keep it fresh.",
  },
  {
    title: 'Embrace mistakes.',
    content: "Errors are learning opportunities. Don't be afraid to make them and learn from them.",
  },
  {
    title: 'Immerse yourself.',
    content: "Watch Japanese shows, listen to music, or read manga. Fun exposure accelerates learning.",
  },
  {
    title: 'Focus on patterns.',
    content: "Japanese grammar follows consistent patterns. Master the patterns, and you'll understand faster.",
  },
];

// Format time in 24-hour format
function formatTime24(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Get time for any timezone
function getTimeForZone(timeZone: string): string {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Get timezone label
function getTimezoneLabel(timeZone: string): { emoji: string; label: string } {
  const labels: Record<string, { emoji: string; label: string }> = {
    'Asia/Tokyo': { emoji: '🇯🇵', label: 'Tokyo' },
    'America/New_York': { emoji: '🇺🇸', label: 'New York' },
    'America/Los_Angeles': { emoji: '🇺🇸', label: 'Los Angeles' },
    'Europe/London': { emoji: '🇬🇧', label: 'London' },
    'Europe/Paris': { emoji: '🇫🇷', label: 'Paris' },
    'Australia/Sydney': { emoji: '🇦🇺', label: 'Sydney' },
    'Asia/Seoul': { emoji: '🇰🇷', label: 'Seoul' },
    'Asia/Shanghai': { emoji: '🇨🇳', label: 'Shanghai' },
  };
  return labels[timeZone] || { emoji: '🌍', label: timeZone.split('/')[1] || timeZone };
}

export function HomePage() {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [jlptLevel, setJlptLevel] = useState('N5');
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { speak, speaking } = useSpeechSynthesis();

  // Load timezone preferences
  const [selectedTimezones] = useState<string[]>(() => {
    const saved = localStorage.getItem('gojun-timezones');
    return saved ? JSON.parse(saved) : ['Asia/Tokyo'];
  });

  // Modal states for Quick Links
  const [showGrammarGuide, setShowGrammarGuide] = useState(false);
  const [showKanaChart, setShowKanaChart] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Dynamic Word of the Day from Calendar API
  const [wordOfTheDay, setWordOfTheDay] = useState<{
    japanese: string;
    reading: string;
    romaji?: string;
    english: string;
    type: string;
    example?: {
      japanese: string;
      reading: string;
      english: string;
    };
  } | null>(null);
  const [wordLoading, setWordLoading] = useState(true);

  // Dynamic weekly progress from user stats
  const [activeDays, setActiveDays] = useState<string[]>([]);

  // Stats from user stats API
  const [stats, setStats] = useState({
    wordsLearned: 0,
    drillsCompleted: 0,
    accuracy: 0,
    streak: 0,
    todayMinutes: 0,
    weeklyGoal: 70,
    weeklyProgress: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Today's study tip (rotates based on day of year)
  const todaysTip = studyTips[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % studyTips.length];

  // Load dynamic data
  const loadDynamicData = useCallback(async () => {
    if (!session?.access_token) {
      // Use fallback when not logged in
      setWordOfTheDay({
        japanese: fallbackWordOfTheDay.japanese,
        reading: fallbackWordOfTheDay.reading,
        romaji: fallbackWordOfTheDay.romaji,
        english: fallbackWordOfTheDay.english,
        type: fallbackWordOfTheDay.type,
        example: fallbackWordOfTheDay.example,
      });
      setWordLoading(false);
      setStatsLoading(false);
      return;
    }

    try {
      // Fetch daily data and user stats in parallel
      const [dailyData, userStatsData] = await Promise.all([
        getDailyData(session.access_token).catch(() => null),
        getUserStats(session.access_token).catch(() => null),
      ]);

      // Set Word of the Day from Calendar API
      if (dailyData?.wordOfTheDay) {
        setWordOfTheDay({
          japanese: dailyData.wordOfTheDay.word,
          reading: dailyData.wordOfTheDay.reading,
          romaji: dailyData.wordOfTheDay.romaji,
          english: dailyData.wordOfTheDay.meaning,
          type: dailyData.wordOfTheDay.partOfSpeech,
        });
      } else {
        setWordOfTheDay({
          japanese: fallbackWordOfTheDay.japanese,
          reading: fallbackWordOfTheDay.reading,
          romaji: fallbackWordOfTheDay.romaji,
          english: fallbackWordOfTheDay.english,
          type: fallbackWordOfTheDay.type,
          example: fallbackWordOfTheDay.example,
        });
      }

      // Set user stats
      if (userStatsData) {
        setStats({
          wordsLearned: userStatsData.stats.wordsLearned,
          drillsCompleted: userStatsData.stats.drillsCompleted,
          accuracy: userStatsData.stats.accuracy,
          streak: userStatsData.stats.streak,
          todayMinutes: userStatsData.stats.todayMinutes,
          weeklyGoal: 70,
          weeklyProgress: userStatsData.stats.weeklyProgress,
        });
        setActiveDays(userStatsData.activeDays || []);
      }

    } catch (error) {
      console.error('Failed to load dynamic data:', error);
      // Use fallback on error
      setWordOfTheDay({
        japanese: fallbackWordOfTheDay.japanese,
        reading: fallbackWordOfTheDay.reading,
        romaji: fallbackWordOfTheDay.romaji,
        english: fallbackWordOfTheDay.english,
        type: fallbackWordOfTheDay.type,
        example: fallbackWordOfTheDay.example,
      });
    } finally {
      setWordLoading(false);
      setStatsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    // Load user profile
    try {
      const saved = localStorage.getItem('gojun-user-profile');
      if (saved) {
        const profile = JSON.parse(saved);
        setFirstName(profile.firstName || '');
        setJlptLevel(profile.jlptLevel || 'N5');
      }
    } catch (e) {
      console.error('Failed to load user profile:', e);
    }

    // Load dynamic data
    loadDynamicData();

    // Update time every second for smooth clock
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [loadDynamicData]);

  const handleSpeak = (text: string) => {
    speak(text);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { en: 'Good morning', jp: 'おはよう' };
    if (hour < 18) return { en: 'Good afternoon', jp: 'こんにちは' };
    return { en: 'Good evening', jp: 'こんばんは' };
  };

  const greeting = getGreeting();

  // Calculate which days of the week are active
  const getWeeklyDays = (): boolean[] => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const days: boolean[] = [false, false, false, false, false, false, false];

    activeDays.forEach(dateStr => {
      const date = new Date(dateStr);
      const diffDays = Math.floor((date.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        days[diffDays] = true;
      }
    });

    return days;
  };

  const weeklyDays = getWeeklyDays();

  // Theme classes
  const theme = {
    bg: isDark ? 'bg-[#0f0f1a]' : 'bg-gradient-to-br from-slate-50 via-white to-pink-50/30',
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200/60 shadow-sm shadow-slate-100',
    cardHover: isDark ? 'hover:bg-white/10 hover:border-white/20' : 'hover:shadow-md hover:border-slate-300/60 hover:bg-white',
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-slate-400',
    accent: 'text-pink-500',
    accentBg: isDark ? 'bg-pink-500/20' : 'bg-pink-50',
    input: isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200',
    kanjiColor: isDark ? 'text-white/[0.03]' : 'text-pink-200/30',
  };

  return (
    <div className={`min-h-screen ${theme.text} pb-24 md:pb-8 transition-all duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]"></div>
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-100/40 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full blur-3xl"></div>
          </>
        )}
        <div className={`absolute top-20 right-20 text-[150px] font-serif select-none ${theme.kanjiColor}`}>桜</div>
        <div className={`absolute bottom-40 left-10 text-[120px] font-serif select-none ${theme.kanjiColor}`}>学</div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm ${theme.textMuted}`}>{greeting.jp}</span>
              <span className={isDark ? 'text-white' : 'text-pink-500'}>🌸</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {greeting.en}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className={theme.textMuted}>Let's continue your study session</p>
          </div>

          {/* Right side - Time displays, Level */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedTimezones.map((tz) => {
              const { emoji, label } = getTimezoneLabel(tz);
              return (
                <div key={tz} className={`${theme.card} border rounded-xl px-4 py-2`}>
                  <p className={`text-xs ${theme.textSubtle}`}>{label} {emoji}</p>
                  <p className="font-mono font-semibold text-lg">{getTimeForZone(tz)}</p>
                </div>
              );
            })}

            <div className={`${theme.card} border rounded-xl px-4 py-2`}>
              <p className={`text-xs ${theme.textSubtle}`}>Local 📍</p>
              <p className="font-mono font-semibold text-lg">{formatTime24(currentTime)}</p>
            </div>

            <div className={`${theme.card} border rounded-xl px-4 py-2 hidden md:block`}>
              <p className={`text-xs ${theme.textSubtle}`}>{currentTime.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <p className="font-semibold">{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>

            <div className={`${isDark ? 'bg-pink-500/20 border-pink-500/30' : 'bg-pink-50 border-pink-200'} border rounded-xl px-4 py-2`}>
              <p className={`text-xs ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>Level</p>
              <p className={`font-bold ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>{jlptLevel}</p>
            </div>
          </div>
        </header>

        {/* Main Grid - 3 columns on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Todo & Timer (visible first on mobile) */}
          <div className="lg:col-span-3 order-1 lg:order-1 space-y-4">
            <TodoWidget />
            <TimerWidget />
          </div>

          {/* Center Column - Main content */}
          <div className="lg:col-span-5 order-2 lg:order-2 space-y-6">
            {/* Today's Focus Card */}
            <div className={`${theme.card} border rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-pink-500/20' : 'bg-pink-100'} flex items-center justify-center`}>
                    <span className="text-lg">🎯</span>
                  </div>
                  <div>
                    <h2 className="font-semibold">Today's Focus</h2>
                    <p className={`text-sm ${theme.textMuted}`}>今日の目標</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  {statsLoading ? '...' : `${stats.todayMinutes} min`}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Words', value: statsLoading ? '...' : stats.wordsLearned, color: isDark ? 'text-purple-400' : 'text-purple-600' },
                  { label: 'Drills', value: statsLoading ? '...' : stats.drillsCompleted, color: isDark ? 'text-blue-400' : 'text-blue-600' },
                  { label: 'Accuracy', value: statsLoading ? '...' : `${stats.accuracy}%`, color: isDark ? 'text-emerald-400' : 'text-emerald-600' },
                  { label: 'Streak', value: statsLoading ? '...' : `${stats.streak}🔥`, color: isDark ? 'text-orange-400' : 'text-orange-600' },
                ].map((stat) => (
                  <div key={stat.label} className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-xl p-3 text-center`}>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Progress */}
            <div className={`${theme.card} border rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Weekly Progress</h3>
                  <p className={`text-sm ${theme.textMuted}`}>今週の進捗</p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>
                    {statsLoading ? '...' : `${stats.weeklyProgress}%`}
                  </p>
                  <p className={`text-xs ${theme.textSubtle}`}>of goal</p>
                </div>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                  const todayDayOfWeek = currentTime.getDay();
                  const todayIndex = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
                  const isToday = i === todayIndex;
                  const completed = weeklyDays[i];
                  return (
                    <div key={i} className="text-center">
                      <p className={`text-xs mb-1 font-medium ${isToday ? (isDark ? 'text-pink-400' : 'text-pink-600') : theme.textSubtle}`}>{day}</p>
                      <div className={`aspect-square rounded-xl flex items-center justify-center text-xs font-medium transition-all ${
                        completed
                          ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/20'
                          : isToday
                          ? `${isDark ? 'bg-pink-500/20 border-pink-500/50' : 'bg-pink-50 border-pink-300'} border-2 border-dashed`
                          : isDark ? 'bg-white/5' : 'bg-slate-50'
                      }`}>
                        {completed && <span>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Study Activities - Compact Grid */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className={`w-7 h-7 rounded-lg ${isDark ? 'bg-pink-500/20' : 'bg-pink-100'} flex items-center justify-center text-sm`}>📖</span>
                Study Activities
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { to: '/word-game', icon: '📝', title: 'Word Game', subtitle: '語順', color: 'purple' },
                  { to: '/pattern-drill', icon: '🔄', title: 'Pattern Drill', subtitle: '活用', color: 'orange' },
                  { to: '/radical-practice', icon: '部', title: 'Radical Game', subtitle: '部首', color: 'pink' },
                  { to: '/calendar', icon: '📅', title: 'Calendar', subtitle: '日々', color: 'blue' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`group ${theme.card} ${theme.cardHover} border rounded-xl p-3 transition-all duration-200`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110 ${
                        isDark
                          ? item.color === 'purple' ? 'bg-purple-500/20'
                          : item.color === 'orange' ? 'bg-orange-500/20'
                          : item.color === 'blue' ? 'bg-blue-500/20'
                          : 'bg-pink-500/20'
                          : item.color === 'purple' ? 'bg-purple-100'
                          : item.color === 'orange' ? 'bg-orange-100'
                          : item.color === 'blue' ? 'bg-blue-100'
                          : 'bg-pink-100'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <span className={`text-xs ${theme.textSubtle}`}>{item.subtitle}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Word of Day, Tips, Quick Links */}
          <div className="lg:col-span-4 order-3 lg:order-3 space-y-4">
            {/* Word of the Day - Compact */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-pink-600/20 to-purple-600/20' : 'bg-gradient-to-r from-pink-100 to-purple-100'} px-4 py-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={isDark ? 'text-white' : 'text-pink-500'}>🌸</span>
                    <h3 className="font-semibold text-sm">Word of the Day</h3>
                  </div>
                  {wordOfTheDay && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-white/60'} ${theme.textMuted}`}>
                      {wordOfTheDay.type}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                {wordLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-pink-500 border-t-transparent"></div>
                  </div>
                ) : wordOfTheDay ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-4xl font-bold">{wordOfTheDay.japanese}</span>
                        <button
                          onClick={() => handleSpeak(wordOfTheDay.japanese)}
                          disabled={speaking}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all text-lg ${
                            speaking
                              ? 'bg-pink-500 text-white scale-110'
                              : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          🔊
                        </button>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>{wordOfTheDay.reading}</p>
                      <p className={`text-sm ${theme.textMuted}`}>
                        {wordOfTheDay.romaji && `${wordOfTheDay.romaji} · `}{wordOfTheDay.english}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button className={`flex-1 py-2 ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'} border rounded-lg text-xs font-medium transition-all`}>
                        ⭐ Save
                      </button>
                      <Link to="/calendar" className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-xs font-medium text-center hover:shadow-lg transition-all">
                        Calendar →
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className={`text-center py-4 text-sm ${theme.textMuted}`}>Sign in to see your Word of the Day</p>
                )}
              </div>
            </div>

            {/* Study Tip - Compact */}
            <div className={`${theme.card} border rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span>💡</span>
                <h3 className="font-semibold text-sm">Study Tip</h3>
              </div>
              <div className={`${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'} border rounded-lg p-3`}>
                <p className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'} leading-relaxed`}>
                  <span className="font-semibold">{todaysTip.title}</span> {todaysTip.content}
                </p>
              </div>
            </div>

            {/* Quick Links - Compact */}
            <div className={`${theme.card} border rounded-2xl p-4`}>
              <h3 className="font-semibold text-sm mb-2">Quick Links</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Grammar', icon: '📖', onClick: () => setShowGrammarGuide(true) },
                  { label: 'Kana', icon: 'あ', onClick: () => setShowKanaChart(true) },
                  { label: 'Notes', icon: '📝', onClick: () => setShowNotes(true) },
                ].map((link) => (
                  <button
                    key={link.label}
                    onClick={link.onClick}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-all group`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-white/10' : 'bg-slate-100'} flex items-center justify-center text-sm group-hover:scale-110 transition-transform`}>
                      {link.icon}
                    </div>
                    <p className={`text-xs ${theme.textMuted}`}>{link.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings Link */}
            <Link
              to="/settings"
              className={`block ${theme.card} ${theme.cardHover} border rounded-xl p-3 transition-all`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-slate-500/20' : 'bg-slate-100'} flex items-center justify-center`}>
                  ⚙️
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Settings</p>
                  <p className={`text-xs ${theme.textSubtle}`}>Customize experience</p>
                </div>
                <svg className={`w-4 h-4 ${theme.textSubtle}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Modals for Quick Links */}
      {showGrammarGuide && <GrammarGuide onClose={() => setShowGrammarGuide(false)} />}
      {showKanaChart && <KanaChart isOpen={showKanaChart} onClose={() => setShowKanaChart(false)} />}
      {showNotes && <NotesPanel isOpen={showNotes} onClose={() => setShowNotes(false)} />}
    </div>
  );
}

export default HomePage;
