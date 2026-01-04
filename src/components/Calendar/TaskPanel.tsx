import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

// Color accents for events
const EVENT_COLORS = [
  'bg-gradient-to-r from-red-500 to-orange-500',
  'bg-gradient-to-r from-yellow-400 to-amber-500',
  'bg-gradient-to-r from-green-400 to-emerald-500',
  'bg-gradient-to-r from-blue-400 to-indigo-500',
  'bg-gradient-to-r from-purple-400 to-pink-500',
  'bg-gradient-to-r from-cyan-400 to-blue-500',
];

export function TaskPanel({ jlptLevel = 'N5', className = '' }: TaskPanelProps) {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<CreateEventsResult | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<{ id: string; summary: string; date: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const syncButtonRef = useRef<HTMLButtonElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setShowSyncMenu(false);

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

  // Long press handlers for events
  const handleEventPressStart = (eventId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setSelectedEvent(eventId);
    }, 500);
  };

  const handleEventPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Group events by date
  const groupedEvents = upcomingEvents.reduce((acc, event) => {
    const date = new Date(event.date);
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof upcomingEvents>);

  if (!session) {
    return null;
  }

  // Theme based on the reference image - dark blue gradient
  const panelBg = isDark
    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
    : 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800';

  return (
    <div className={`rounded-2xl overflow-hidden shadow-2xl ${panelBg} border border-white/10 ${className}`}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">Scheduled</h3>
            <p className="text-xs text-slate-400">
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Sync button - small icon */}
            {googleStatus?.connected && (
              <button
                ref={syncButtonRef}
                onClick={() => setShowSyncMenu(!showSyncMenu)}
                disabled={syncing}
                className={`p-2 rounded-lg transition-all ${
                  syncing
                    ? 'bg-white/5 text-slate-500'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {syncing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            )}
            {/* Navigation arrows */}
            <button className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Sync menu dropdown */}
      {showSyncMenu && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setShowSyncMenu(false)} />
          <div
            className="fixed z-[9999] w-48 rounded-xl bg-slate-800 border border-white/20 shadow-2xl overflow-hidden animate-fadeInUp"
            style={{
              top: (syncButtonRef.current?.getBoundingClientRect().bottom || 0) + 8,
              left: (syncButtonRef.current?.getBoundingClientRect().left || 0) - 100,
            }}
          >
            <button
              onClick={handleSync}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync 30 Days ({jlptLevel})
            </button>
            <div className="border-t border-white/10" />
            <div className="px-4 py-2 text-xs text-slate-500">
              {googleStatus?.email}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !googleStatus?.connected ? (
          /* Not connected */
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>
              </svg>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Connect Google Calendar to sync your learning schedule
            </p>
            <button
              onClick={handleConnect}
              className="px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 mx-auto transition-all bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect
            </button>
          </div>
        ) : (
          /* Connected - Event list */
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {/* Sync result toast */}
            {syncResult && (
              <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Synced {syncResult.eventsCreated} events
              </div>
            )}

            {/* Error toast */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Events grouped by date */}
            {Object.entries(groupedEvents).length > 0 ? (
              Object.entries(groupedEvents).slice(0, 7).map(([date, events], groupIdx) => (
                <div key={date}>
                  {/* Date header */}
                  <div className="text-xs text-slate-500 font-medium mb-2">{date}</div>

                  {/* Events for this date */}
                  <div className="space-y-2">
                    {events.map((event, idx) => {
                      const colorClass = EVENT_COLORS[(groupIdx + idx) % EVENT_COLORS.length];
                      const word = event.summary.replace('📚 Word of the Day: ', '').split(' ')[0];
                      const reading = event.summary.match(/\(([^)]+)\)/)?.[1] || '';

                      return (
                        <div
                          key={event.id}
                          onMouseDown={() => handleEventPressStart(event.id)}
                          onMouseUp={handleEventPressEnd}
                          onMouseLeave={handleEventPressEnd}
                          onTouchStart={() => handleEventPressStart(event.id)}
                          onTouchEnd={handleEventPressEnd}
                          className={`relative rounded-xl overflow-hidden transition-all cursor-pointer ${
                            selectedEvent === event.id
                              ? 'bg-white/20 ring-2 ring-blue-500'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          {/* Color accent bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`} />

                          <div className="pl-4 pr-3 py-3">
                            {/* Word title */}
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white text-lg">{word}</h4>
                              {selectedEvent === event.id && (
                                <button
                                  onClick={() => setSelectedEvent(null)}
                                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {/* Reading */}
                            {reading && (
                              <p className="text-sm text-slate-400">{reading}</p>
                            )}

                            {/* Time indicator */}
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>09:00</span>
                              <span className="text-slate-600">•</span>
                              <span>All day</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500">No upcoming events</p>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="mt-3 px-4 py-2 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                >
                  {syncing ? 'Syncing...' : `Sync ${jlptLevel} Words`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {googleStatus?.connected && upcomingEvents.length > 0 && (
        <div className="px-4 py-2 border-t border-white/10 text-center">
          <p className="text-[10px] text-slate-600">Hold an event to select</p>
        </div>
      )}
    </div>
  );
}

export default TaskPanel;
