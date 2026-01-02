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
import { FavoriteButton } from '../components/FavoriteButton';
import { WordNoteButton } from '../components/WordNoteButton';
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

// Comprehensive timezone list organized by region
const ALL_TIMEZONES: Record<string, { emoji: string; label: string; region: string }> = {
  // Asia
  'Asia/Tokyo': { emoji: '🇯🇵', label: 'Tokyo', region: 'Asia' },
  'Asia/Seoul': { emoji: '🇰🇷', label: 'Seoul', region: 'Asia' },
  'Asia/Shanghai': { emoji: '🇨🇳', label: 'Shanghai', region: 'Asia' },
  'Asia/Hong_Kong': { emoji: '🇭🇰', label: 'Hong Kong', region: 'Asia' },
  'Asia/Taipei': { emoji: '🇹🇼', label: 'Taipei', region: 'Asia' },
  'Asia/Singapore': { emoji: '🇸🇬', label: 'Singapore', region: 'Asia' },
  'Asia/Manila': { emoji: '🇵🇭', label: 'Manila', region: 'Asia' },
  'Asia/Bangkok': { emoji: '🇹🇭', label: 'Bangkok', region: 'Asia' },
  'Asia/Ho_Chi_Minh': { emoji: '🇻🇳', label: 'Ho Chi Minh', region: 'Asia' },
  'Asia/Jakarta': { emoji: '🇮🇩', label: 'Jakarta', region: 'Asia' },
  'Asia/Kuala_Lumpur': { emoji: '🇲🇾', label: 'Kuala Lumpur', region: 'Asia' },
  'Asia/Kolkata': { emoji: '🇮🇳', label: 'India (IST)', region: 'Asia' },
  'Asia/Dubai': { emoji: '🇦🇪', label: 'Dubai', region: 'Asia' },
  'Asia/Riyadh': { emoji: '🇸🇦', label: 'Riyadh', region: 'Asia' },
  'Asia/Jerusalem': { emoji: '🇮🇱', label: 'Jerusalem', region: 'Asia' },
  'Asia/Karachi': { emoji: '🇵🇰', label: 'Karachi', region: 'Asia' },
  'Asia/Dhaka': { emoji: '🇧🇩', label: 'Dhaka', region: 'Asia' },
  'Asia/Kathmandu': { emoji: '🇳🇵', label: 'Kathmandu', region: 'Asia' },

  // Europe
  'Europe/London': { emoji: '🇬🇧', label: 'London', region: 'Europe' },
  'Europe/Paris': { emoji: '🇫🇷', label: 'Paris', region: 'Europe' },
  'Europe/Berlin': { emoji: '🇩🇪', label: 'Berlin', region: 'Europe' },
  'Europe/Rome': { emoji: '🇮🇹', label: 'Rome', region: 'Europe' },
  'Europe/Madrid': { emoji: '🇪🇸', label: 'Madrid', region: 'Europe' },
  'Europe/Amsterdam': { emoji: '🇳🇱', label: 'Amsterdam', region: 'Europe' },
  'Europe/Brussels': { emoji: '🇧🇪', label: 'Brussels', region: 'Europe' },
  'Europe/Vienna': { emoji: '🇦🇹', label: 'Vienna', region: 'Europe' },
  'Europe/Zurich': { emoji: '🇨🇭', label: 'Zurich', region: 'Europe' },
  'Europe/Stockholm': { emoji: '🇸🇪', label: 'Stockholm', region: 'Europe' },
  'Europe/Oslo': { emoji: '🇳🇴', label: 'Oslo', region: 'Europe' },
  'Europe/Copenhagen': { emoji: '🇩🇰', label: 'Copenhagen', region: 'Europe' },
  'Europe/Helsinki': { emoji: '🇫🇮', label: 'Helsinki', region: 'Europe' },
  'Europe/Warsaw': { emoji: '🇵🇱', label: 'Warsaw', region: 'Europe' },
  'Europe/Prague': { emoji: '🇨🇿', label: 'Prague', region: 'Europe' },
  'Europe/Budapest': { emoji: '🇭🇺', label: 'Budapest', region: 'Europe' },
  'Europe/Athens': { emoji: '🇬🇷', label: 'Athens', region: 'Europe' },
  'Europe/Istanbul': { emoji: '🇹🇷', label: 'Istanbul', region: 'Europe' },
  'Europe/Moscow': { emoji: '🇷🇺', label: 'Moscow', region: 'Europe' },
  'Europe/Lisbon': { emoji: '🇵🇹', label: 'Lisbon', region: 'Europe' },
  'Europe/Dublin': { emoji: '🇮🇪', label: 'Dublin', region: 'Europe' },

  // Americas
  'America/New_York': { emoji: '🇺🇸', label: 'New York (ET)', region: 'Americas' },
  'America/Chicago': { emoji: '🇺🇸', label: 'Chicago (CT)', region: 'Americas' },
  'America/Denver': { emoji: '🇺🇸', label: 'Denver (MT)', region: 'Americas' },
  'America/Los_Angeles': { emoji: '🇺🇸', label: 'Los Angeles (PT)', region: 'Americas' },
  'America/Anchorage': { emoji: '🇺🇸', label: 'Alaska', region: 'Americas' },
  'Pacific/Honolulu': { emoji: '🇺🇸', label: 'Hawaii', region: 'Americas' },
  'America/Toronto': { emoji: '🇨🇦', label: 'Toronto', region: 'Americas' },
  'America/Vancouver': { emoji: '🇨🇦', label: 'Vancouver', region: 'Americas' },
  'America/Mexico_City': { emoji: '🇲🇽', label: 'Mexico City', region: 'Americas' },
  'America/Sao_Paulo': { emoji: '🇧🇷', label: 'São Paulo', region: 'Americas' },
  'America/Buenos_Aires': { emoji: '🇦🇷', label: 'Buenos Aires', region: 'Americas' },
  'America/Lima': { emoji: '🇵🇪', label: 'Lima', region: 'Americas' },
  'America/Bogota': { emoji: '🇨🇴', label: 'Bogotá', region: 'Americas' },
  'America/Santiago': { emoji: '🇨🇱', label: 'Santiago', region: 'Americas' },

  // Oceania
  'Australia/Sydney': { emoji: '🇦🇺', label: 'Sydney', region: 'Oceania' },
  'Australia/Melbourne': { emoji: '🇦🇺', label: 'Melbourne', region: 'Oceania' },
  'Australia/Brisbane': { emoji: '🇦🇺', label: 'Brisbane', region: 'Oceania' },
  'Australia/Perth': { emoji: '🇦🇺', label: 'Perth', region: 'Oceania' },
  'Australia/Adelaide': { emoji: '🇦🇺', label: 'Adelaide', region: 'Oceania' },
  'Pacific/Auckland': { emoji: '🇳🇿', label: 'Auckland', region: 'Oceania' },
  'Pacific/Fiji': { emoji: '🇫🇯', label: 'Fiji', region: 'Oceania' },

  // Africa
  'Africa/Cairo': { emoji: '🇪🇬', label: 'Cairo', region: 'Africa' },
  'Africa/Johannesburg': { emoji: '🇿🇦', label: 'Johannesburg', region: 'Africa' },
  'Africa/Lagos': { emoji: '🇳🇬', label: 'Lagos', region: 'Africa' },
  'Africa/Nairobi': { emoji: '🇰🇪', label: 'Nairobi', region: 'Africa' },
  'Africa/Casablanca': { emoji: '🇲🇦', label: 'Casablanca', region: 'Africa' },

  // UTC
  'UTC': { emoji: '🌐', label: 'UTC', region: 'UTC' },
};

// Get timezone label
function getTimezoneLabel(timeZone: string): { emoji: string; label: string } {
  const tz = ALL_TIMEZONES[timeZone];
  if (tz) return { emoji: tz.emoji, label: tz.label };
  return { emoji: '🌍', label: timeZone.split('/')[1]?.replace(/_/g, ' ') || timeZone };
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
  const [selectedTimezones, setSelectedTimezones] = useState<string[]>(() => {
    const saved = localStorage.getItem('gojun-timezones');
    return saved ? JSON.parse(saved) : ['Asia/Tokyo'];
  });

  // Timezone settings modal
  const [showTimezoneSettings, setShowTimezoneSettings] = useState(false);

  // Modal states for Quick Links
  const [showGrammarGuide, setShowGrammarGuide] = useState(false);
  const [showKanaChart, setShowKanaChart] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Save timezones to localStorage when changed
  const handleTimezoneChange = useCallback((newTimezones: string[]) => {
    setSelectedTimezones(newTimezones);
    localStorage.setItem('gojun-timezones', JSON.stringify(newTimezones));
  }, []);

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

  // Dynamic Kanji of the Day from Calendar API
  const [kanjiOfTheDay, setKanjiOfTheDay] = useState<{
    kanji: string;
    meaning: string;
    onyomi: string[];
    kunyomi: string[];
    strokeCount?: number;
  } | null>(null);

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

      // Set Kanji of the Day from Calendar API
      if (dailyData?.kanjiOfTheDay) {
        setKanjiOfTheDay({
          kanji: dailyData.kanjiOfTheDay.kanji,
          meaning: dailyData.kanjiOfTheDay.meaning,
          onyomi: dailyData.kanjiOfTheDay.onyomi || [],
          kunyomi: dailyData.kanjiOfTheDay.kunyomi || [],
          strokeCount: dailyData.kanjiOfTheDay.strokeCount,
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
                <button
                  key={tz}
                  onClick={() => setShowTimezoneSettings(true)}
                  className={`${theme.card} border rounded-xl px-4 py-2 hover:ring-2 hover:ring-pink-300 transition-all cursor-pointer text-left`}
                  title="Click to change timezone"
                >
                  <p className={`text-xs ${theme.textSubtle}`}>{label} {emoji}</p>
                  <p className="font-mono font-semibold text-lg">{getTimeForZone(tz)}</p>
                </button>
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
            <div className={`${theme.card} border rounded-2xl overflow-hidden relative`}>
              {/* Favorite/Note buttons */}
              {wordOfTheDay && (
                <div className="absolute top-3 right-3 flex gap-1 z-10">
                  <FavoriteButton
                    word={wordOfTheDay.japanese}
                    reading={wordOfTheDay.reading}
                    english={wordOfTheDay.english}
                    partOfSpeech={wordOfTheDay.type.toLowerCase() as 'noun' | 'verb' | 'adjective' | 'adverb' | 'particle' | 'expression'}
                    isFavorited={false}
                  />
                  <WordNoteButton
                    word={wordOfTheDay.japanese}
                    reading={wordOfTheDay.reading}
                    english={wordOfTheDay.english}
                  />
                </div>
              )}

              <div className={`${isDark ? 'bg-gradient-to-r from-pink-600/20 to-purple-600/20' : 'bg-gradient-to-r from-pink-100 to-purple-100'} px-4 py-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={isDark ? 'text-white' : 'text-pink-500'}>🌸</span>
                    <h3 className="font-semibold text-sm">Word of the Day</h3>
                  </div>
                  {wordOfTheDay && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-white/60'} ${theme.textMuted} mr-16`}>
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

                    <Link to="/calendar" className="block w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-xs font-medium text-center hover:shadow-lg transition-all">
                      Calendar →
                    </Link>
                  </>
                ) : (
                  <p className={`text-center py-4 text-sm ${theme.textMuted}`}>Sign in to see your Word of the Day</p>
                )}
              </div>
            </div>

            {/* Kanji of the Day - Compact */}
            {kanjiOfTheDay && (
              <div className={`${theme.card} border rounded-2xl overflow-hidden relative`}>
                {/* Favorite/Note buttons */}
                <div className="absolute top-3 right-3 flex gap-1 z-10">
                  <FavoriteButton
                    word={kanjiOfTheDay.kanji}
                    reading={kanjiOfTheDay.onyomi?.[0] || kanjiOfTheDay.kunyomi?.[0] || ''}
                    english={kanjiOfTheDay.meaning}
                    partOfSpeech="kanji"
                    isFavorited={false}
                  />
                  <WordNoteButton
                    word={kanjiOfTheDay.kanji}
                    reading={kanjiOfTheDay.onyomi?.[0] || kanjiOfTheDay.kunyomi?.[0] || ''}
                    english={kanjiOfTheDay.meaning}
                  />
                </div>

                <div className={`${isDark ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20' : 'bg-gradient-to-r from-indigo-100 to-purple-100'} px-4 py-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={isDark ? 'text-indigo-400' : 'text-indigo-500'}>漢</span>
                      <h3 className="font-semibold text-sm">Kanji of the Day</h3>
                    </div>
                    {kanjiOfTheDay.strokeCount && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-white/60'} ${theme.textMuted} mr-16`}>
                        {kanjiOfTheDay.strokeCount} strokes
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-center mb-3">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-5xl font-bold">{kanjiOfTheDay.kanji}</span>
                      <button
                        onClick={() => handleSpeak(kanjiOfTheDay.kanji)}
                        disabled={speaking}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all text-lg ${
                          speaking
                            ? 'bg-indigo-500 text-white scale-110'
                            : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        🔊
                      </button>
                    </div>
                    <p className={`text-base font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{kanjiOfTheDay.meaning}</p>
                  </div>

                  {/* Readings */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {kanjiOfTheDay.onyomi.length > 0 && (
                      <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-lg p-2 text-center`}>
                        <p className={`text-xs ${theme.textSubtle} mb-0.5`}>On'yomi</p>
                        <p className={`text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                          {kanjiOfTheDay.onyomi.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    )}
                    {kanjiOfTheDay.kunyomi.length > 0 && (
                      <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-lg p-2 text-center`}>
                        <p className={`text-xs ${theme.textSubtle} mb-0.5`}>Kun'yomi</p>
                        <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {kanjiOfTheDay.kunyomi.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  <Link to="/calendar" className="block w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-xs font-medium text-center hover:shadow-lg transition-all">
                    More Kanji →
                  </Link>
                </div>
              </div>
            )}

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

      {/* Timezone Settings Modal */}
      {showTimezoneSettings && (
        <TimezoneSettingsModal
          isDark={isDark}
          selectedTimezones={selectedTimezones}
          onSave={handleTimezoneChange}
          onClose={() => setShowTimezoneSettings(false)}
        />
      )}
    </div>
  );
}

// Timezone Settings Modal Component
function TimezoneSettingsModal({
  isDark,
  selectedTimezones,
  onSave,
  onClose,
}: {
  isDark: boolean;
  selectedTimezones: string[];
  onSave: (timezones: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(selectedTimezones);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<string>('All');

  const theme = {
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    card: isDark ? 'bg-gray-800' : 'bg-gray-50',
    cardHover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    input: isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
  };

  const regions = ['All', 'Asia', 'Europe', 'Americas', 'Oceania', 'Africa', 'UTC'];

  const filteredTimezones = Object.entries(ALL_TIMEZONES).filter(([tz, data]) => {
    const matchesSearch = searchQuery === '' ||
      data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tz.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = activeRegion === 'All' || data.region === activeRegion;
    return matchesSearch && matchesRegion;
  });

  const toggleTimezone = (tz: string) => {
    if (selected.includes(tz)) {
      if (selected.length > 1) {
        setSelected(selected.filter(t => t !== tz));
      }
    } else {
      if (selected.length < 3) {
        setSelected([...selected, tz]);
      }
    }
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative ${theme.bg} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-scaleIn`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${theme.border}`}>
          <div>
            <h2 className={`text-xl font-bold ${theme.text}`}>Timezone Settings</h2>
            <p className={`text-sm ${theme.textMuted}`}>Select up to 3 timezones to display</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.cardHover} transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selected Timezones */}
        <div className={`p-4 border-b ${theme.border}`}>
          <p className={`text-sm font-medium ${theme.textMuted} mb-2`}>Selected ({selected.length}/3):</p>
          <div className="flex flex-wrap gap-2">
            {selected.map(tz => {
              const { emoji, label } = getTimezoneLabel(tz);
              return (
                <div
                  key={tz}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-700'}`}
                >
                  <span>{emoji}</span>
                  <span className="text-sm font-medium">{label}</span>
                  <span className={`text-xs ${theme.textMuted}`}>{getTimeForZone(tz)}</span>
                  {selected.length > 1 && (
                    <button
                      onClick={() => toggleTimezone(tz)}
                      className="ml-1 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Filter */}
        <div className={`p-4 border-b ${theme.border} space-y-3`}>
          <input
            type="text"
            placeholder="Search timezones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${theme.input} focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
          />
          <div className="flex flex-wrap gap-2">
            {regions.map(region => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeRegion === region
                    ? 'bg-pink-500 text-white'
                    : `${theme.card} ${theme.cardHover}`
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Timezone List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredTimezones.map(([tz, data]) => {
              const isSelected = selected.includes(tz);
              const canSelect = selected.length < 3 || isSelected;
              return (
                <button
                  key={tz}
                  onClick={() => canSelect && toggleTimezone(tz)}
                  disabled={!canSelect}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                        : 'bg-pink-50 border-pink-300 text-pink-700'
                      : canSelect
                        ? `${theme.card} ${theme.cardHover} ${theme.border}`
                        : `${theme.card} opacity-50 cursor-not-allowed ${theme.border}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{data.emoji}</span>
                    <div className="text-left">
                      <p className={`font-medium ${isSelected ? '' : theme.text}`}>{data.label}</p>
                      <p className={`text-xs ${theme.textMuted}`}>{tz}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm ${theme.textMuted}`}>{getTimeForZone(tz)}</span>
                    {isSelected && (
                      <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {filteredTimezones.length === 0 && (
            <div className={`text-center py-8 ${theme.textMuted}`}>
              No timezones found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-4 border-t ${theme.border}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${theme.card} ${theme.cardHover} ${theme.text} font-medium transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:shadow-lg transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
