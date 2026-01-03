import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getGoogleStatus,
  connectGoogle,
  createWordOfTheDayEvents,
  listWordOfTheDayEvents,
  type GoogleStatus,
  type CreateEventsResult,
} from '../../services/googleCalendarApi';

export interface TaskPanelProps {
  jlptLevel?: string;
  className?: string;
}

export function TaskPanel({ jlptLevel = 'N5', className = '' }: TaskPanelProps) {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<CreateEventsResult | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<{ id: string; summary: string; date: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load Google status
  useEffect(() => {
    async function loadStatus() {
      if (!session?.access_token) return;
      setLoading(true);
      try {
        const status = await getGoogleStatus(session.access_token);
        setGoogleStatus(status);

        if (status.connected) {
          const events = await listWordOfTheDayEvents(session.access_token);
          setUpcomingEvents(events.events || []);
        }
      } catch (err) {
        console.error('Failed to get Google status:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, [session?.access_token]);

  const handleConnect = () => {
    if (session?.access_token) {
      connectGoogle(session.access_token);
    }
  };

  const handleSync = async () => {
    if (!session?.access_token) return;

    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const result = await createWordOfTheDayEvents(session.access_token, {
        jlptLevel,
        days: 30,
        reminderTime: '09:00',
      });
      setSyncResult(result);

      // Reload events
      const events = await listWordOfTheDayEvents(session.access_token);
      setUpcomingEvents(events.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync');
    } finally {
      setSyncing(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className={`rounded-2xl overflow-hidden ${
      isDark ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-pink-100'
    } ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        isDark ? 'border-white/10 bg-white/5' : 'border-pink-100 bg-gradient-to-r from-blue-50 to-indigo-50'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
            </svg>
            Google Calendar
          </h3>
          {googleStatus?.connected && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Connected
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !googleStatus?.connected ? (
          /* Not connected */
          <div className="text-center py-4">
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Connect your Google Calendar to sync Word of the Day events
            </p>
            <button
              onClick={handleConnect}
              className={`
                px-4 py-2.5 rounded-xl font-medium text-sm
                flex items-center gap-2 mx-auto transition-all
                bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                hover:bg-gray-50 dark:hover:bg-gray-700
                text-gray-700 dark:text-gray-200
              `}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect Google Calendar
            </button>
          </div>
        ) : (
          /* Connected */
          <div className="space-y-4">
            {/* Connected email */}
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Signed in as {googleStatus.email}
            </div>

            {/* Sync button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`
                w-full px-4 py-3 rounded-xl font-medium text-sm
                flex items-center justify-center gap-2 transition-all
                ${syncing
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg'
                }
              `}
            >
              {syncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Next 30 Days ({jlptLevel})
                </>
              )}
            </button>

            {/* Sync result */}
            {syncResult && (
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
                ✓ Created {syncResult.eventsCreated} events ({syncResult.dateRange.start} - {syncResult.dateRange.end})
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Upcoming events */}
            {upcomingEvents.length > 0 && (
              <div>
                <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Upcoming Events
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {upcomingEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs px-3 py-2 rounded-lg ${
                        isDark ? 'bg-white/5' : 'bg-gray-50'
                      }`}
                    >
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {event.summary.replace('📚 Word of the Day: ', '')}
                      </span>
                      <span className={`ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskPanel;
