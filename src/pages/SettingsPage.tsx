import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  isKeepConnected,
  getKeepEmail,
  disconnectKeep,
  handleKeepCallback
} from '../services/keepApi';
import { getSettings, updateSettings, getIcalUrl } from '../services/calendarApi';
import { getGoogleStatus, connectGoogle, disconnectGoogle, createWordOfTheDayEvents, deleteWordOfTheDayEvents, type GoogleStatus } from '../services/googleCalendarApi';
import { TimePicker } from '../components/Calendar/TimePicker';
import { DateRangePicker } from '../components/Calendar/DateRangePicker';

type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
type AIProvider = 'claude' | 'groq';
type ActiveSection = 'profile' | 'ai' | 'calendar' | 'account' | null;

interface UserProfile {
  firstName: string;
  lastName: string;
  jlptLevel: JLPTLevel;
}

export function SettingsPage() {
  const { session, user, signOut, hasApiKey, checkApiKey, hasGoogleLinked, linkGoogleAccount, unlinkGoogleAccount } = useAuth();
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  // Theme classes
  const theme = {
    bg: isDark ? 'bg-[#0d0d1a]' : 'bg-gradient-to-br from-slate-50 via-white to-purple-50/30',
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200/60 shadow-sm',
    cardInner: isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200',
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-slate-400',
    input: isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500',
    kanjiColor: isDark ? 'text-white/10' : 'text-purple-300/40',
  };

  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    jlptLevel: 'N5',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // AI Provider state
  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem('gojun-ai-provider') as AIProvider) || 'groq';
  });
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);

  // Google Keep state
  const [keepConnected, setKeepConnected] = useState(false);
  const [keepEmail, setKeepEmail] = useState<string | null>(null);

  // Google account linking state
  const [googleLinkLoading, setGoogleLinkLoading] = useState(false);

  // Calendar settings
  const [icalToken, setIcalToken] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [icalCopied, setIcalCopied] = useState(false);

  // Google Calendar sync
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [syncStartDate, setSyncStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [syncEndDate, setSyncEndDate] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 30);
    return end.toISOString().split('T')[0];
  });

  // Timezone settings
  const [selectedTimezones, setSelectedTimezones] = useState<string[]>(() => {
    const saved = localStorage.getItem('gojun-timezones');
    return saved ? JSON.parse(saved) : ['Asia/Tokyo'];
  });

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Load profile from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('gojun-user-profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Load calendar settings and integrations
  useEffect(() => {
    const connected = isKeepConnected();
    const email = getKeepEmail();
    setKeepConnected(connected);
    setKeepEmail(email);

    try {
      const tokens = handleKeepCallback();
      if (tokens) {
        setKeepConnected(true);
        setKeepEmail(tokens.email);
      }
    } catch (err) {
      console.error('Keep callback error:', err);
    }

    if (session?.access_token) {
      getSettings(session.access_token)
        .then((settings) => {
          setIcalToken(settings.icalToken || null);
        })
        .catch((err) => console.error('Failed to load calendar settings:', err));

      getGoogleStatus(session.access_token)
        .then(setGoogleStatus)
        .catch((err) => console.error('Failed to load Google status:', err));
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      setSuccess('Google Calendar connected!');
      window.history.replaceState({}, '', window.location.pathname);
      if (session?.access_token) {
        getGoogleStatus(session.access_token).then(setGoogleStatus);
      }
    }
    if (params.get('google_error')) {
      setError(`Google connection failed: ${params.get('google_error')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [session?.access_token]);

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('gojun-user-profile', JSON.stringify(profile));
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleAiProviderChange = (provider: AIProvider) => {
    setAiProvider(provider);
    localStorage.setItem('gojun-ai-provider', provider);
    setSuccess(`Switched to ${provider === 'claude' ? 'Claude' : 'Groq (Free)'}`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setApiKeyLoading(true);

    if (!apiKey.startsWith('sk-ant-')) {
      setError('Invalid API key format. Keys start with "sk-ant-"');
      setApiKeyLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save API key');

      setSuccess('API key saved!');
      setApiKey('');
      await checkApiKey();
      handleAiProviderChange('claude');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm('Delete your API key?')) return;
    setError('');
    setApiKeyLoading(true);

    try {
      const response = await fetch('/api/api-key', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete');

      setSuccess('API key deleted');
      await checkApiKey();
      handleAiProviderChange('groq');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleDisconnectKeep = () => {
    disconnectKeep();
    setKeepConnected(false);
    setKeepEmail(null);
  };

  const handleGenerateIcal = async () => {
    if (!session?.access_token) return;
    setCalendarLoading(true);
    try {
      const updated = await updateSettings(session.access_token, { generateIcalToken: true });
      setIcalToken(updated.icalToken || null);
      setSuccess('Calendar subscription URL generated!');
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      setError('Failed to generate calendar URL');
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleCopyIcalUrl = async () => {
    if (!icalToken) return;
    try {
      await navigator.clipboard.writeText(getIcalUrl(icalToken));
      setIcalCopied(true);
      setTimeout(() => setIcalCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = getIcalUrl(icalToken);
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setIcalCopied(true);
      setTimeout(() => setIcalCopied(false), 2000);
    }
  };

  const handleConnectGoogle = () => {
    if (!session?.access_token) return;
    connectGoogle(session.access_token);
  };

  const handleDisconnectGoogle = async () => {
    if (!session?.access_token) return;
    if (!confirm('Disconnect Google Calendar?')) return;

    setGoogleLoading(true);
    try {
      await disconnectGoogle(session.access_token);
      setGoogleStatus(null);
      setSuccess('Google Calendar disconnected');
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      setError('Failed to disconnect Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCreateCalendarEvents = async () => {
    if (!session?.access_token) return;

    setGoogleLoading(true);
    try {
      const result = await createWordOfTheDayEvents(session.access_token, {
        reminderTime,
        startDate: syncStartDate,
        endDate: syncEndDate,
      });
      setSuccess(`Created ${result.eventsCreated} events!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create events');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDeleteCalendarEvents = async () => {
    if (!session?.access_token) return;
    if (!confirm('Delete all Word of the Day events?')) return;

    setGoogleLoading(true);
    try {
      const result = await deleteWordOfTheDayEvents(session.access_token);
      setSuccess(`Deleted ${result.eventsDeleted} events`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete events');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Timezone management
  const handleAddTimezone = (timezone: string) => {
    if (!selectedTimezones.includes(timezone)) {
      const newTimezones = [...selectedTimezones, timezone];
      setSelectedTimezones(newTimezones);
      localStorage.setItem('gojun-timezones', JSON.stringify(newTimezones));
    }
  };

  const handleRemoveTimezone = (timezone: string) => {
    const newTimezones = selectedTimezones.filter(tz => tz !== timezone);
    setSelectedTimezones(newTimezones);
    localStorage.setItem('gojun-timezones', JSON.stringify(newTimezones));
  };

  const handleLinkGoogle = async () => {
    setGoogleLinkLoading(true);
    setError('');
    try {
      const { error } = await linkGoogleAccount();
      if (error) {
        setError(error.message);
        setGoogleLinkLoading(false);
      }
    } catch {
      setError('Failed to link Google account');
      setGoogleLinkLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm('Unlink your Google account?')) return;
    setGoogleLinkLoading(true);
    try {
      const { error } = await unlinkGoogleAccount();
      if (error) setError(error.message);
      else setSuccess('Google account unlinked');
    } catch {
      setError('Failed to unlink');
    } finally {
      setGoogleLinkLoading(false);
    }
  };

  // Menu items for the sidebar
  const menuItems = [
    { id: 'profile', icon: '👤', label: 'Profile', sublabel: 'プロフィール' },
    { id: 'ai', icon: '🧠', label: 'AI Model', sublabel: 'AIモデル' },
    { id: 'calendar', icon: '📅', label: 'Calendar', sublabel: 'カレンダー' },
    { id: 'account', icon: '🔐', label: 'Account', sublabel: 'アカウント' },
  ];

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} pb-24 md:pb-8 transition-all duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div className={`absolute top-20 -left-20 w-80 h-80 rounded-full blur-[100px] ${isDark ? 'bg-purple-600/20' : 'bg-purple-400/30'}`}></div>
        <div className={`absolute bottom-20 -right-20 w-96 h-96 rounded-full blur-[120px] ${isDark ? 'bg-pink-600/15' : 'bg-pink-400/20'}`}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-400/15'}`}></div>

        {/* Japanese decorative kanji */}
        <div className={`absolute top-10 right-10 text-[150px] font-serif select-none ${theme.kanjiColor}`}>設定</div>
        <div className={`absolute bottom-10 left-10 text-[100px] font-serif select-none ${theme.kanjiColor}`}>禅</div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-purple-500/30' : 'shadow-purple-500/20'}`}>
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className={`text-sm ${theme.textMuted}`}>設定</p>
            </div>
          </div>

          {/* User badge */}
          {user && (
            <div className={`hidden md:flex items-center gap-3 backdrop-blur-xl rounded-2xl px-4 py-2 border ${theme.card}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold">
                {profile.firstName?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{profile.firstName || 'User'}</p>
                <p className={`text-xs ${theme.textMuted}`}>{profile.jlptLevel} Level</p>
              </div>
            </div>
          )}
        </header>

        {/* Messages */}
        {(error || success) && (
          <div className="mb-6 animate-fadeInUp">
            {error && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 backdrop-blur-xl ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'} text-red-500`}>
                <span className="text-xl">⚠️</span>
                <span className="text-sm flex-1">{error}</span>
                <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-500">✕</button>
              </div>
            )}
            {success && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 backdrop-blur-xl ${isDark ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'} text-emerald-600`}>
                <span className="text-xl">✓</span>
                <span className="text-sm">{success}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar Navigation */}
          <div className={`backdrop-blur-xl rounded-3xl border p-4 h-fit ${theme.card}`}>
            {/* Profile Card */}
            <div className={`rounded-2xl p-4 mb-4 border ${isDark ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/10' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg ${isDark ? 'shadow-orange-500/30' : 'shadow-orange-500/20'}`}>
                  {profile.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{profile.firstName || 'User'}</p>
                  <p className={`text-xs truncate ${theme.textMuted}`}>{user?.email}</p>
                </div>
              </div>

              {/* Level Progress */}
              <div className={`rounded-xl p-3 ${isDark ? 'bg-black/20' : 'bg-white/80'}`}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={theme.textMuted}>JLPT Level</span>
                  <span className="font-bold text-amber-500">{profile.jlptLevel}</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-black/40' : 'bg-slate-200'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${(['N5', 'N4', 'N3', 'N2', 'N1'].indexOf(profile.jlptLevel) + 1) * 20}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(activeSection === item.id ? null : item.id as ActiveSection)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                      : isDark ? 'hover:bg-white/5 border border-transparent' : 'hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    activeSection === item.id
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30'
                      : isDark ? 'bg-white/10 group-hover:bg-white/15' : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className={`text-xs ${theme.textSubtle}`}>{item.sublabel}</p>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${theme.textSubtle} ${activeSection === item.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </nav>

            {/* Quick Actions */}
            <div className={`mt-4 pt-4 space-y-2 ${isDark ? 'border-t border-white/10' : 'border-t border-slate-200'}`}>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  🚪
                </div>
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="space-y-6">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className={`backdrop-blur-xl rounded-3xl border overflow-hidden animate-fadeInUp ${theme.card}`}>
                <div className={`px-6 py-4 border-b ${isDark ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-white/10' : 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200/50'}`}>
                  <h2 className="font-bold flex items-center gap-2">
                    <span>👤</span> Profile Settings
                  </h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm mb-2 ${theme.textMuted}`}>First Name</label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        placeholder="Your first name"
                        className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${theme.input} focus:ring-2 focus:ring-purple-500/20`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm mb-2 ${theme.textMuted}`}>Last Name</label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        placeholder="Your last name"
                        className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${theme.input} focus:ring-2 focus:ring-purple-500/20`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm mb-2 ${theme.textMuted}`}>Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className={`w-full px-4 py-3 rounded-xl cursor-not-allowed ${isDark ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-slate-100 border border-slate-200 text-slate-400'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm mb-3 ${theme.textMuted}`}>JLPT Level</label>
                    <div className="flex gap-2">
                      {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => setProfile({ ...profile, jlptLevel: level })}
                          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                            profile.jlptLevel === level
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                              : isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 ${
                      saved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98]'
                    } disabled:opacity-50`}
                  >
                    {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* AI Model Section */}
            {activeSection === 'ai' && (
              <div className={`backdrop-blur-xl rounded-3xl border overflow-hidden animate-fadeInUp ${theme.card}`}>
                <div className={`px-6 py-4 border-b ${isDark ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-white/10' : 'bg-gradient-to-r from-violet-100 to-indigo-100 border-violet-200/50'}`}>
                  <h2 className="font-bold flex items-center gap-2">
                    <span>🧠</span> AI Model
                    <span className={`ml-auto px-3 py-1 rounded-full text-xs ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                      {aiProvider === 'claude' && hasApiKey ? 'Claude Active' : 'Groq Free'}
                    </span>
                  </h2>
                </div>
                <div className="p-6 space-y-5">
                  {/* Provider Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Groq Card */}
                    <button
                      onClick={() => handleAiProviderChange('groq')}
                      className={`p-5 rounded-2xl border text-left transition-all duration-300 ${
                        aiProvider === 'groq'
                          ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                          : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">🆓</span>
                        {aiProvider === 'groq' && (
                          <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs text-white">✓</span>
                        )}
                      </div>
                      <p className="font-bold text-lg">Groq</p>
                      <p className={`text-sm ${theme.textMuted}`}>Llama 3.3 70B</p>
                      <p className="text-sm text-emerald-500 mt-2 font-medium">Free forever</p>
                    </button>

                    {/* Claude Card */}
                    <button
                      onClick={() => hasApiKey && handleAiProviderChange('claude')}
                      disabled={!hasApiKey}
                      className={`p-5 rounded-2xl border text-left transition-all duration-300 relative ${
                        aiProvider === 'claude' && hasApiKey
                          ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-purple-500/50 shadow-lg shadow-purple-500/20'
                          : hasApiKey
                          ? isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          : isDark ? 'bg-white/5 border-white/10 opacity-60 cursor-not-allowed' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {hasApiKey && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg text-xs text-white">🔑</div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">🧠</span>
                        {aiProvider === 'claude' && hasApiKey && (
                          <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">✓</span>
                        )}
                      </div>
                      <p className="font-bold text-lg">Claude</p>
                      <p className={`text-sm ${theme.textMuted}`}>Sonnet 4</p>
                      <p className={`text-sm mt-2 font-medium ${hasApiKey ? 'text-emerald-500' : theme.textSubtle}`}>
                        {hasApiKey ? '✓ Key saved' : 'Requires key'}
                      </p>
                    </button>
                  </div>

                  {/* API Key Input */}
                  <div className={`pt-4 ${isDark ? 'border-t border-white/10' : 'border-t border-slate-200'}`}>
                    <label className={`block text-sm mb-2 ${theme.textMuted}`}>Anthropic API Key</label>
                    <form onSubmit={handleSaveApiKey} className="space-y-3">
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={hasApiKey ? 'Update key...' : 'sk-ant-api03-...'}
                          className={`w-full px-4 py-3 pr-12 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono ${theme.input}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.text}`}
                        >
                          {showApiKey ? '🙈' : '👁️'}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={apiKeyLoading || !apiKey}
                          className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50"
                        >
                          {apiKeyLoading ? 'Saving...' : hasApiKey ? 'Update Key' : 'Save Key'}
                        </button>
                        {hasApiKey && (
                          <button
                            type="button"
                            onClick={handleDeleteApiKey}
                            disabled={apiKeyLoading}
                            className="py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-xl transition-all border border-red-500/20"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </form>
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 mt-3 text-sm ${theme.textMuted} hover:text-purple-500 transition-colors`}
                    >
                      🔗 Get API key from Anthropic
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Section */}
            {activeSection === 'calendar' && (
              <div className="space-y-6 animate-fadeInUp">
                {/* Google Calendar */}
                <div className={`backdrop-blur-xl rounded-3xl border overflow-hidden ${theme.card}`}>
                  <div className={`px-6 py-4 border-b ${isDark ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-white/10' : 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-200/50'}`}>
                    <h2 className="font-bold flex items-center gap-2">
                      <span>📅</span> Google Calendar
                      {googleStatus?.connected && (
                        <span className="ml-auto px-3 py-1 bg-emerald-500/20 text-emerald-500 rounded-full text-xs">Connected</span>
                      )}
                    </h2>
                  </div>
                  <div className="p-6 space-y-5">
                    {googleStatus?.connected ? (
                      <>
                        <div className={`flex items-center gap-3 p-4 rounded-2xl ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                          <span className="text-2xl">✅</span>
                          <div>
                            <p className="font-medium text-emerald-500">Connected</p>
                            <p className={`text-sm ${theme.textMuted}`}>{googleStatus.email}</p>
                          </div>
                        </div>

                        <DateRangePicker
                          startDate={syncStartDate}
                          endDate={syncEndDate}
                          onStartChange={setSyncStartDate}
                          onEndChange={setSyncEndDate}
                          label="Event Date Range"
                        />

                        <TimePicker
                          value={reminderTime}
                          onChange={setReminderTime}
                          label="Daily Reminder Time"
                        />

                        <button
                          onClick={handleCreateCalendarEvents}
                          disabled={googleLoading}
                          className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          {googleLoading ? '⏳ Creating...' : '➕ Create Word of the Day Events'}
                        </button>

                        <button
                          onClick={handleDeleteCalendarEvents}
                          disabled={googleLoading}
                          className="w-full py-3 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/20"
                        >
                          🗑️ Delete All Events
                        </button>

                        <button
                          onClick={handleDisconnectGoogle}
                          disabled={googleLoading}
                          className={`w-full py-2.5 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ${theme.textMuted}`}
                        >
                          Disconnect Google Calendar
                        </button>
                      </>
                    ) : (
                      <>
                        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${theme.cardInner}`}>
                          <span className="text-2xl">📅</span>
                          <div>
                            <p className="font-medium">Not Connected</p>
                            <p className={`text-sm ${theme.textMuted}`}>Sync Word of the Day to your calendar</p>
                          </div>
                        </div>

                        <button
                          onClick={handleConnectGoogle}
                          disabled={googleLoading}
                          className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          </svg>
                          Connect Google Calendar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* iCal Subscription */}
                <div className={`backdrop-blur-xl rounded-3xl border overflow-hidden ${theme.card}`}>
                  <div className={`px-6 py-4 border-b ${isDark ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border-white/10' : 'bg-gradient-to-r from-indigo-100 to-violet-100 border-indigo-200/50'}`}>
                    <h2 className="font-bold flex items-center gap-2">
                      <span>🔗</span> iCal Subscription
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className={`text-sm ${theme.textMuted}`}>
                      Subscribe to a read-only calendar feed in Apple Calendar, Outlook, or other apps.
                    </p>

                    {icalToken ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={getIcalUrl(icalToken)}
                          className={`flex-1 px-4 py-3 border rounded-xl text-sm font-mono truncate ${isDark ? 'border-white/10 bg-white/5 text-gray-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
                        />
                        <button
                          onClick={handleCopyIcalUrl}
                          className={`px-4 py-3 rounded-xl font-medium transition-all ${
                            icalCopied
                              ? 'bg-emerald-500 text-white'
                              : 'bg-indigo-500 text-white hover:bg-indigo-600'
                          }`}
                        >
                          {icalCopied ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateIcal}
                        disabled={calendarLoading}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 transition-all"
                      >
                        {calendarLoading ? 'Generating...' : 'Generate iCal URL'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Timezone Settings */}
                <div className={`backdrop-blur-xl rounded-3xl border overflow-hidden ${theme.card}`}>
                  <div className={`px-6 py-4 border-b ${isDark ? 'bg-gradient-to-r from-teal-600/20 to-cyan-600/20 border-white/10' : 'bg-gradient-to-r from-teal-100 to-cyan-100 border-teal-200/50'}`}>
                    <h2 className="font-bold flex items-center gap-2">
                      <span>🌍</span> Time Zones
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className={`text-sm ${theme.textMuted}`}>
                      Select additional time zones to display on your home page.
                    </p>

                    {/* Common Timezones */}
                    <div className="space-y-3">
                      {[
                        { zone: 'Asia/Tokyo', emoji: '🇯🇵', label: 'Tokyo' },
                        { zone: 'America/New_York', emoji: '🇺🇸', label: 'New York' },
                        { zone: 'America/Los_Angeles', emoji: '🇺🇸', label: 'Los Angeles' },
                        { zone: 'Europe/London', emoji: '🇬🇧', label: 'London' },
                        { zone: 'Europe/Paris', emoji: '🇫🇷', label: 'Paris' },
                        { zone: 'Australia/Sydney', emoji: '🇦🇺', label: 'Sydney' },
                        { zone: 'Asia/Seoul', emoji: '🇰🇷', label: 'Seoul' },
                        { zone: 'Asia/Shanghai', emoji: '🇨🇳', label: 'Shanghai' },
                      ].map(({ zone, emoji, label }) => {
                        const isSelected = selectedTimezones.includes(zone);
                        return (
                          <button
                            key={zone}
                            onClick={() => isSelected ? handleRemoveTimezone(zone) : handleAddTimezone(zone)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                              isSelected
                                ? isDark
                                  ? 'bg-teal-500/20 border-teal-500/50'
                                  : 'bg-teal-50 border-teal-300'
                                : isDark
                                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{emoji}</span>
                              <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {label}
                              </span>
                            </div>
                            {isSelected && (
                              <span className="text-teal-500">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className={`px-4 py-3 rounded-xl ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                      <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        💡 Selected timezones will appear on your home page for quick reference
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Section */}
            {activeSection === 'account' && (
              <div className={`backdrop-blur-xl rounded-3xl border overflow-hidden animate-fadeInUp ${theme.card}`}>
                <div className={`px-6 py-4 border-b ${isDark ? 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-white/10' : 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-200/50'}`}>
                  <h2 className="font-bold flex items-center gap-2">
                    <span>🔐</span> Account Settings
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {/* Google Account Link */}
                  <div className={`flex items-center justify-between p-4 rounded-2xl border ${theme.cardInner}`}>
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <div>
                        <p className="font-medium">Google Account</p>
                        <p className={`text-sm ${theme.textMuted}`}>{hasGoogleLinked ? 'Linked' : 'Not linked'}</p>
                      </div>
                    </div>
                    {hasGoogleLinked ? (
                      <button
                        onClick={handleUnlinkGoogle}
                        disabled={googleLinkLoading}
                        className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
                      >
                        {googleLinkLoading ? 'Working...' : 'Unlink'}
                      </button>
                    ) : (
                      <button
                        onClick={handleLinkGoogle}
                        disabled={googleLinkLoading}
                        className="px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors font-medium"
                      >
                        {googleLinkLoading ? 'Working...' : 'Link'}
                      </button>
                    )}
                  </div>

                  {/* Google Keep */}
                  <div className={`flex items-center justify-between p-4 rounded-2xl border ${theme.cardInner}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-yellow-400 rounded flex items-center justify-center">
                        <span className="text-xs">📝</span>
                      </div>
                      <div>
                        <p className="font-medium">Google Keep</p>
                        <p className={`text-sm ${theme.textMuted}`}>{keepConnected ? keepEmail : 'Not connected'}</p>
                      </div>
                    </div>
                    {keepConnected ? (
                      <button
                        onClick={handleDisconnectKeep}
                        className="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <span className={`px-3 py-1.5 text-xs rounded-lg ${isDark ? 'text-gray-500 bg-white/5' : 'text-slate-500 bg-slate-100'}`}>Coming soon</span>
                    )}
                  </div>

                  {/* About */}
                  <div className={`pt-4 ${isDark ? 'border-t border-white/10' : 'border-t border-slate-200'}`}>
                    <div className="text-center py-4">
                      <h3 className="text-2xl font-bold mb-1">語順</h3>
                      <p className={`text-sm ${theme.textMuted}`}>Gojun - Japanese Word Order</p>
                      <div className={`flex justify-center gap-4 mt-4 text-xs ${theme.textSubtle}`}>
                        <span>v{__GIT_COMMIT__}</span>
                        <span>•</span>
                        <span>{__GIT_DATE__}</span>
                      </div>
                      <p className={`text-xs mt-2 ${theme.textSubtle}`}>Made with 🌸 by Nguyenetics</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Default State - Show Quick Stats */}
            {!activeSection && (
              <div className="space-y-6 animate-fadeInUp">
                {/* Welcome Card */}
                <div className={`backdrop-blur-xl rounded-3xl border p-6 ${isDark ? 'bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-violet-600/20 border-white/10' : 'bg-gradient-to-br from-purple-100 via-pink-100 to-violet-100 border-purple-200/50'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg ${isDark ? 'shadow-orange-500/30' : 'shadow-orange-500/20'}`}>
                      {profile.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{profile.firstName ? `Hello, ${profile.firstName}!` : 'Welcome!'}</h2>
                      <p className={theme.textMuted}>Select a category to manage your settings</p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className={`rounded-2xl p-4 text-center ${isDark ? 'bg-black/20' : 'bg-white/80'}`}>
                      <div className="text-2xl font-bold text-purple-500">{profile.jlptLevel}</div>
                      <div className={`text-xs ${theme.textMuted}`}>JLPT Level</div>
                    </div>
                    <div className={`rounded-2xl p-4 text-center ${isDark ? 'bg-black/20' : 'bg-white/80'}`}>
                      <div className="text-2xl font-bold text-emerald-500">{aiProvider === 'claude' && hasApiKey ? 'Claude' : 'Groq'}</div>
                      <div className={`text-xs ${theme.textMuted}`}>AI Model</div>
                    </div>
                    <div className={`rounded-2xl p-4 text-center ${isDark ? 'bg-black/20' : 'bg-white/80'}`}>
                      <div className="text-2xl font-bold text-blue-500">{googleStatus?.connected ? '✓' : '—'}</div>
                      <div className={`text-xs ${theme.textMuted}`}>Calendar</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as ActiveSection)}
                      className={`backdrop-blur-xl rounded-2xl border p-6 text-left transition-all group ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform ${isDark ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' : 'bg-gradient-to-br from-purple-100 to-pink-100'}`}>
                        {item.icon}
                      </div>
                      <h3 className="font-bold mb-1">{item.label}</h3>
                      <p className={`text-sm ${theme.textMuted}`}>{item.sublabel}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
