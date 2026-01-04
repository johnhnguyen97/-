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

// Task interface
interface Task {
  id: string;
  title: string;
  notes?: string;
  due_date?: string;
  priority: number;
  is_completed: boolean;
}

// Unified item type for display
interface ScheduleItem {
  id: string;
  type: 'task' | 'event';
  title: string;
  subtitle?: string;
  date: string;
  priority?: number;
  isCompleted?: boolean;
}

// Color accents for events/tasks
const EVENT_COLORS = [
  'bg-gradient-to-r from-red-500 to-orange-500',
  'bg-gradient-to-r from-yellow-400 to-amber-500',
  'bg-gradient-to-r from-green-400 to-emerald-500',
  'bg-gradient-to-r from-blue-400 to-indigo-500',
  'bg-gradient-to-r from-purple-400 to-pink-500',
  'bg-gradient-to-r from-cyan-400 to-blue-500',
];

// Priority colors
const PRIORITY_COLORS: Record<number, string> = {
  0: 'bg-slate-400',
  1: 'bg-blue-500',
  2: 'bg-amber-500',
  3: 'bg-red-500',
};

export function TaskPanel({ jlptLevel = 'N5', className = '' }: TaskPanelProps) {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<CreateEventsResult | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<{ id: string; summary: string; date: string }[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const syncButtonRef = useRef<HTMLButtonElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Theme matching other cards
  const theme = {
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-pink-100',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-slate-400' : 'text-gray-500',
    textSubtle: isDark ? 'text-slate-500' : 'text-slate-400',
    headerBg: isDark
      ? 'border-white/10 bg-gradient-to-r from-pink-900/30 to-purple-900/30'
      : 'border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50',
    eventBg: isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-pink-50/50 hover:bg-pink-100/50',
    eventBgSelected: isDark ? 'bg-white/15 ring-2 ring-pink-500' : 'bg-pink-100 ring-2 ring-pink-400',
  };

  // Fetch tasks
  const fetchTasks = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/calendar?action=todos', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.todos || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  // Load Google status and tasks
  useEffect(() => {
    async function loadData() {
      if (!session?.access_token) return;
      setLoading(true);
      try {
        // Fetch Google status
        const status = await getGoogleStatus(session.access_token);
        setGoogleStatus(status);

        // Fetch calendar events if connected
        if (status.connected) {
          const events = await listWordOfTheDayEvents(session.access_token);
          setUpcomingEvents(events.events || []);
        }

        // Fetch tasks
        await fetchTasks();
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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

  // Toggle task completion
  const handleToggleTask = async (taskId: string) => {
    if (!session?.access_token) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await fetch('/api/calendar?action=todos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: taskId,
          is_completed: !task.is_completed,
        }),
      });

      if (response.ok) {
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
        ));
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  // Long press handlers
  const handleItemPressStart = (itemId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setSelectedItem(itemId);
    }, 500);
  };

  const handleItemPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Combine tasks and events into unified schedule items
  const scheduleItems: ScheduleItem[] = [
    // Add tasks with due dates
    ...tasks
      .filter(t => t.due_date && !t.is_completed)
      .map(t => ({
        id: `task-${t.id}`,
        type: 'task' as const,
        title: t.title,
        subtitle: t.notes,
        date: t.due_date!,
        priority: t.priority,
        isCompleted: t.is_completed,
      })),
    // Add calendar events
    ...upcomingEvents.map(e => {
      const word = e.summary.replace('📚 Word of the Day: ', '').split(' ')[0];
      const reading = e.summary.match(/\(([^)]+)\)/)?.[1] || '';
      return {
        id: `event-${e.id}`,
        type: 'event' as const,
        title: word,
        subtitle: reading,
        date: e.date,
      };
    }),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group items by date
  const groupedItems = scheduleItems.reduce((acc, item) => {
    const date = new Date(item.date);
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  if (!session) {
    return null;
  }

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg border ${theme.card} ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${theme.headerBg}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-bold text-lg ${theme.text}`}>Scheduled</h3>
            <p className={`text-xs ${theme.textMuted}`}>
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Connected indicator */}
            {googleStatus?.connected && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </span>
            )}
            {/* Sync button - small icon */}
            {googleStatus?.connected && (
              <button
                ref={syncButtonRef}
                onClick={() => setShowSyncMenu(!showSyncMenu)}
                disabled={syncing}
                className={`p-2 rounded-lg transition-all ${
                  syncing
                    ? isDark ? 'bg-white/5 text-slate-500' : 'bg-pink-100 text-pink-300'
                    : isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                }`}
              >
                {syncing ? (
                  <div className={`w-4 h-4 border-2 rounded-full animate-spin ${
                    isDark ? 'border-white/30 border-t-white' : 'border-pink-300 border-t-pink-600'
                  }`} />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            )}
            {/* Navigation arrows */}
            <button className={`p-2 rounded-lg transition-all ${
              isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className={`p-2 rounded-lg transition-all ${
              isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
            }`}>
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
            className={`fixed z-[9999] w-48 rounded-xl shadow-2xl overflow-hidden animate-fadeInUp border ${
              isDark ? 'bg-gray-900 border-white/20' : 'bg-white border-pink-200'
            }`}
            style={{
              top: (syncButtonRef.current?.getBoundingClientRect().bottom || 0) + 8,
              left: (syncButtonRef.current?.getBoundingClientRect().left || 0) - 100,
            }}
          >
            <button
              onClick={handleSync}
              className={`w-full px-4 py-3 text-left text-sm transition-all flex items-center gap-2 ${
                isDark ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-pink-50'
              }`}
            >
              <svg className={`w-4 h-4 ${isDark ? 'text-pink-400' : 'text-pink-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync 30 Days ({jlptLevel})
            </button>
            <div className={`border-t ${isDark ? 'border-white/10' : 'border-pink-100'}`} />
            <div className={`px-4 py-2 text-xs ${theme.textSubtle}`}>
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
            <div className={`w-6 h-6 border-2 rounded-full animate-spin ${
              isDark ? 'border-pink-500 border-t-transparent' : 'border-pink-400 border-t-transparent'
            }`} />
          </div>
        ) : !googleStatus?.connected && tasks.length === 0 ? (
          /* Not connected and no tasks */
          <div className="text-center py-6">
            <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-white/10' : 'bg-pink-100'
            }`}>
              <svg className={`w-6 h-6 ${isDark ? 'text-slate-400' : 'text-pink-400'}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>
              </svg>
            </div>
            <p className={`text-sm mb-4 ${theme.textMuted}`}>
              Connect Google Calendar to sync your learning schedule
            </p>
            <button
              onClick={handleConnect}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 mx-auto transition-all border ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  : 'bg-white hover:bg-pink-50 text-gray-700 border-pink-200'
              }`}
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
          /* Schedule items list */
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {/* Sync result toast */}
            {syncResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                isDark
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : 'bg-green-100 border border-green-200 text-green-700'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Synced {syncResult.eventsCreated} events
              </div>
            )}

            {/* Error toast */}
            {error && (
              <div className={`p-3 rounded-xl text-xs ${
                isDark
                  ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                  : 'bg-red-100 border border-red-200 text-red-700'
              }`}>
                {error}
              </div>
            )}

            {/* Items grouped by date */}
            {Object.entries(groupedItems).length > 0 ? (
              Object.entries(groupedItems).slice(0, 7).map(([date, items], groupIdx) => (
                <div key={date}>
                  {/* Date header */}
                  <div className={`text-xs font-medium mb-2 ${theme.textSubtle}`}>{date}</div>

                  {/* Items for this date */}
                  <div className="space-y-2">
                    {items.map((item, idx) => {
                      const colorClass = item.type === 'task' && item.priority !== undefined
                        ? PRIORITY_COLORS[item.priority]
                        : EVENT_COLORS[(groupIdx + idx) % EVENT_COLORS.length];

                      return (
                        <div
                          key={item.id}
                          onMouseDown={() => handleItemPressStart(item.id)}
                          onMouseUp={handleItemPressEnd}
                          onMouseLeave={handleItemPressEnd}
                          onTouchStart={() => handleItemPressStart(item.id)}
                          onTouchEnd={handleItemPressEnd}
                          className={`relative rounded-xl overflow-hidden transition-all cursor-pointer ${
                            selectedItem === item.id ? theme.eventBgSelected : theme.eventBg
                          }`}
                        >
                          {/* Color accent bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`} />

                          <div className="pl-4 pr-3 py-3">
                            {/* Title row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {/* Checkbox for tasks */}
                                {item.type === 'task' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const taskId = item.id.replace('task-', '');
                                      handleToggleTask(taskId);
                                    }}
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                      item.isCompleted
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : isDark
                                        ? 'border-white/30 hover:border-pink-400'
                                        : 'border-pink-300 hover:border-pink-500'
                                    }`}
                                  >
                                    {item.isCompleted && (
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                                )}
                                {/* Type icon for events */}
                                {item.type === 'event' && (
                                  <span className="text-base flex-shrink-0">📚</span>
                                )}
                                <h4 className={`font-bold truncate ${theme.text} ${
                                  item.isCompleted ? 'line-through opacity-50' : ''
                                }`}>
                                  {item.title}
                                </h4>
                              </div>
                              {selectedItem === item.id && (
                                <button
                                  onClick={() => setSelectedItem(null)}
                                  className={`p-1 rounded-lg transition-all flex-shrink-0 ${
                                    isDark ? 'bg-white/10 hover:bg-white/20 text-slate-400' : 'bg-pink-200 hover:bg-pink-300 text-pink-600'
                                  }`}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {/* Subtitle */}
                            {item.subtitle && (
                              <p className={`text-sm mt-0.5 ${theme.textMuted} ${
                                item.isCompleted ? 'line-through opacity-50' : ''
                              }`}>
                                {item.subtitle}
                              </p>
                            )}

                            {/* Meta info */}
                            <div className={`flex items-center gap-2 mt-2 text-xs ${theme.textSubtle}`}>
                              {item.type === 'task' ? (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  <span>Task</span>
                                  {item.priority !== undefined && item.priority > 0 && (
                                    <>
                                      <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
                                      <span className={
                                        item.priority === 3 ? 'text-red-400' :
                                        item.priority === 2 ? 'text-amber-400' :
                                        'text-blue-400'
                                      }>
                                        {item.priority === 3 ? 'High' : item.priority === 2 ? 'Med' : 'Low'}
                                      </span>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>09:00</span>
                                  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
                                  <span>Word of Day</span>
                                </>
                              )}
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
                <p className={`text-sm ${theme.textMuted}`}>No upcoming items</p>
                {googleStatus?.connected && (
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className={`mt-3 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      isDark
                        ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
                        : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                    }`}
                  >
                    {syncing ? 'Syncing...' : `Sync ${jlptLevel} Words`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {(googleStatus?.connected || tasks.length > 0) && Object.keys(groupedItems).length > 0 && (
        <div className={`px-4 py-2 border-t text-center ${isDark ? 'border-white/10' : 'border-pink-100'}`}>
          <p className={`text-[10px] ${theme.textSubtle}`}>Hold to select • Tap checkbox to complete</p>
        </div>
      )}
    </div>
  );
}

export default TaskPanel;
