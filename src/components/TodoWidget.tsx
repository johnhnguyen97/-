import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  syncTasks,
  pushTask,
  pullTasks,
  deleteGoogleTask,
  isGoogleConnected
} from '../services/googleTasksApi';

interface TodoItem {
  id: string;
  title: string;
  notes?: string;
  task_type: string;
  is_completed: boolean;
  completed_at?: string;
  due_date?: string;
  priority: number;
  linked_word?: string;
  linked_kanji?: string;
  sync_status: string;
  google_task_id?: string;
  google_task_list_id?: string;
  created_at: string;
  updated_at: string;
}

interface TodoWidgetProps {
  compact?: boolean;
}

interface TaskFormData {
  title: string;
  notes: string;
  due_date: string;
  due_time: string;
  priority: number;
  subtasks: { id: string; title: string; completed: boolean }[];
}

export function TodoWidget({ compact = false }: TodoWidgetProps) {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: '',
    notes: '',
    due_date: '',
    due_time: '',
    priority: 0,
    subtasks: [],
  });
  const [newSubtask, setNewSubtask] = useState('');
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const theme = {
    bg: isDark ? 'bg-white/5' : 'bg-white',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    input: isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400',
  };

  // Check if Google is connected
  useEffect(() => {
    async function checkGoogle() {
      if (!session?.access_token) {
        setGoogleConnected(false);
        return;
      }
      const connected = await isGoogleConnected(session.access_token);
      setGoogleConnected(connected);
    }
    checkGoogle();
  }, [session?.access_token]);

  // Fetch todos from API
  const fetchTodos = useCallback(async () => {
    if (!session?.access_token) {
      // Fall back to localStorage for non-logged-in users
      const saved = localStorage.getItem('gojun-todos');
      if (saved) {
        const localTodos = JSON.parse(saved);
        // Convert old format to new format
        setTodos(localTodos.map((t: { id: string; text: string; completed: boolean; createdAt: number }) => ({
          id: t.id,
          title: t.text,
          is_completed: t.completed,
          task_type: 'custom',
          priority: 0,
          sync_status: 'local',
          created_at: new Date(t.createdAt).toISOString(),
          updated_at: new Date(t.createdAt).toISOString(),
        })));
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar?action=todos', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos || []);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  // Load todos on mount and when session changes
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Auto-pull from Google on mount if connected
  useEffect(() => {
    async function autoPull() {
      if (session?.access_token && googleConnected && !lastSyncTime) {
        try {
          await pullTasks(session.access_token);
          await fetchTodos();
          setLastSyncTime(new Date());
        } catch (error) {
          console.error('Auto-pull failed:', error);
        }
      }
    }
    autoPull();
  }, [session?.access_token, googleConnected, lastSyncTime, fetchTodos]);

  // Listen for storage events (for cross-tab sync when not logged in)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gojun-todos' && !session?.access_token) {
        fetchTodos();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [session?.access_token, fetchTodos]);

  // Full sync with Google Tasks
  const handleSync = async () => {
    if (!session?.access_token || !googleConnected) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const result = await syncTasks(session.access_token);
      console.log('Sync result:', result);
      await fetchTodos();
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Push a single task to Google
  const pushToGoogle = async (taskId: string) => {
    if (!session?.access_token || !googleConnected) return;

    try {
      await pushTask(session.access_token, taskId);
      // Update local sync status
      setTodos(prev => prev.map(t =>
        t.id === taskId ? { ...t, sync_status: 'synced' } : t
      ));
    } catch (error) {
      console.error('Push to Google failed:', error);
      setTodos(prev => prev.map(t =>
        t.id === taskId ? { ...t, sync_status: 'sync_error' } : t
      ));
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newCompleted = !todo.is_completed;

    // Optimistic update
    setTodos(prev => prev.map(t =>
      t.id === id ? {
        ...t,
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : undefined,
        sync_status: googleConnected && t.google_task_id ? 'pending_sync' : t.sync_status
      } : t
    ));

    if (!session?.access_token) {
      // Update localStorage
      const localTodos = JSON.parse(localStorage.getItem('gojun-todos') || '[]');
      const updated = localTodos.map((t: { id: string; completed: boolean }) =>
        t.id === id ? { ...t, completed: newCompleted } : t
      );
      localStorage.setItem('gojun-todos', JSON.stringify(updated));
      return;
    }

    try {
      const response = await fetch('/api/calendar?action=todos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id, is_completed: newCompleted }),
      });

      if (response.ok) {
        const data = await response.json();
        // Push to Google if task has a google_task_id
        if (data.needsSync && googleConnected) {
          pushToGoogle(id);
        }
      } else {
        // Revert on error
        setTodos(prev => prev.map(t =>
          t.id === id ? { ...t, is_completed: !newCompleted } : t
        ));
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      setTodos(prev => prev.map(t =>
        t.id === id ? { ...t, is_completed: !newCompleted } : t
      ));
    }
  };

  const deleteTodo = async (id: string) => {
    const todoToDelete = todos.find(t => t.id === id);

    // Optimistic update
    setTodos(prev => prev.filter(t => t.id !== id));

    if (!session?.access_token) {
      // Update localStorage
      const localTodos = JSON.parse(localStorage.getItem('gojun-todos') || '[]');
      const updated = localTodos.filter((t: { id: string }) => t.id !== id);
      localStorage.setItem('gojun-todos', JSON.stringify(updated));
      return;
    }

    try {
      const response = await fetch(`/api/calendar?action=todos&id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Delete from Google if it was synced
        if (data.googleTaskId && googleConnected) {
          try {
            await deleteGoogleTask(session.access_token, data.googleTaskId, data.listId);
          } catch (error) {
            console.error('Failed to delete from Google:', error);
          }
        }
      } else if (todoToDelete) {
        // Revert on error
        setTodos(prev => [...prev, todoToDelete]);
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      if (todoToDelete) {
        setTodos(prev => [...prev, todoToDelete]);
      }
    }
  };

  const addDetailedTask = async () => {
    if (!taskForm.title.trim()) return;

    const tempId = Date.now().toString();
    const optimisticTodo: TodoItem = {
      id: tempId,
      title: taskForm.title.trim(),
      notes: taskForm.notes.trim() || undefined,
      due_date: taskForm.due_date || undefined,
      is_completed: false,
      task_type: 'custom',
      priority: taskForm.priority,
      sync_status: googleConnected ? 'pending_sync' : 'local',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    setTodos(prev => [optimisticTodo, ...prev]);
    setShowDetailModal(false);
    setTaskForm({ title: '', notes: '', due_date: '', due_time: '', priority: 0, subtasks: [] });

    if (!session?.access_token) {
      const localTodos = JSON.parse(localStorage.getItem('gojun-todos') || '[]');
      localTodos.unshift({
        id: tempId,
        text: taskForm.title.trim(),
        completed: false,
        createdAt: Date.now(),
        notes: taskForm.notes.trim() || undefined,
        dueDate: taskForm.due_date || undefined,
      });
      localStorage.setItem('gojun-todos', JSON.stringify(localTodos));
      return;
    }

    try {
      const response = await fetch('/api/calendar?action=todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: taskForm.title.trim(),
          notes: taskForm.notes.trim() || null,
          due_date: taskForm.due_date || null,
          due_time: taskForm.due_time || null,
          priority: taskForm.priority,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(prev => prev.map(t => t.id === tempId ? data.todo : t));

        if (data.needsSync && googleConnected) {
          pushToGoogle(data.todo.id);
        }
      } else {
        setTodos(prev => prev.filter(t => t.id !== tempId));
      }
    } catch (error) {
      console.error('Failed to add detailed todo:', error);
      setTodos(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const openDetailModal = () => {
    // Calculate popup position - more to the left
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: rect.top, // Align with button top
        left: rect.left - 350, // Position further left
      });
    }
    setTaskForm({ title: newTodo, notes: '', due_date: '', due_time: '', priority: 0, subtasks: [] });
    setNewSubtask('');
    setNewTodo('');
    setShowDetailModal(true);
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setTaskForm(f => ({
        ...f,
        subtasks: [...f.subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]
      }));
      setNewSubtask('');
    }
  };

  const removeSubtask = (id: string) => {
    setTaskForm(f => ({
      ...f,
      subtasks: f.subtasks.filter(s => s.id !== id)
    }));
  };

  const toggleSubtask = (id: string) => {
    setTaskForm(f => ({
      ...f,
      subtasks: f.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s)
    }));
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        addButtonRef.current &&
        !addButtonRef.current.contains(e.target as Node)
      ) {
        setShowDetailModal(false);
      }
    };
    if (showDetailModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDetailModal]);

  const clearCompleted = async () => {
    const completedTodos = todos.filter(t => t.is_completed);

    // Optimistic update
    setTodos(prev => prev.filter(t => !t.is_completed));

    if (!session?.access_token) {
      // Update localStorage
      const localTodos = JSON.parse(localStorage.getItem('gojun-todos') || '[]');
      const updated = localTodos.filter((t: { completed: boolean }) => !t.completed);
      localStorage.setItem('gojun-todos', JSON.stringify(updated));
      return;
    }

    try {
      const response = await fetch('/api/calendar?action=todos&clearCompleted=true', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Delete from Google if any were synced
        if (data.googleTasksToDelete && googleConnected) {
          for (const task of data.googleTasksToDelete) {
            try {
              await deleteGoogleTask(session.access_token, task.googleTaskId, task.listId);
            } catch (error) {
              console.error('Failed to delete from Google:', error);
            }
          }
        }
      } else {
        // Revert on error
        setTodos(prev => [...prev, ...completedTodos]);
      }
    } catch (error) {
      console.error('Failed to clear completed:', error);
      setTodos(prev => [...prev, ...completedTodos]);
    }
  };

  // Get sync status icon
  const getSyncIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return (
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'pending_sync':
        return (
          <svg className="w-3 h-3 text-yellow-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'sync_error':
        return (
          <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const activeTodos = todos.filter(t => !t.is_completed);
  const completedTodos = todos.filter(t => t.is_completed);
  const hasPendingSync = todos.some(t => t.sync_status === 'pending_sync');

  return (
    <div className={`relative backdrop-blur-xl rounded-2xl border ${theme.bg} ${theme.border} p-4 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`font-bold flex items-center gap-2 ${theme.text}`}>
          <span>✓</span> {compact ? '課題' : '課題'}
          {session?.access_token && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
              synced
            </span>
          )}
          {googleConnected && (
            <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Tasks
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {/* Sync button */}
          {googleConnected && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              title={lastSyncTime ? `Last sync: ${lastSyncTime.toLocaleTimeString()}` : 'Sync with Google Tasks'}
              className={`p-1.5 rounded-lg transition-all ${
                isSyncing
                  ? 'opacity-50 cursor-not-allowed'
                  : hasPendingSync
                    ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500'
                    : isDark
                      ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                      : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg
                className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          <span className={`text-sm ${theme.textMuted}`}>
            {isLoading ? '...' : `${activeTodos.length} active`}
          </span>
        </div>
      </div>

      {/* Sync error message */}
      {syncError && (
        <div className={`text-xs p-2 rounded-lg ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
          Sync error: {syncError}
          <button
            onClick={() => setSyncError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && newTodo.trim() && openDetailModal()}
          placeholder="Add a task..."
          className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${theme.input}`}
        />
        <button
          ref={addButtonRef}
          onClick={openDetailModal}
          className="px-4 py-2 rounded-lg font-medium text-sm transition-all bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30"
        >
          Add
        </button>
      </div>

      {/* Todo List */}
      <div className={`space-y-2 ${compact ? 'max-h-64' : 'max-h-96'} overflow-y-auto`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
          </div>
        ) : activeTodos.length === 0 && completedTodos.length === 0 ? (
          <p className={`text-center py-8 ${theme.textMuted} text-sm`}>
            No tasks yet. Add one above!
          </p>
        ) : (
          <>
            {/* Active Todos */}
            {activeTodos.map((todo) => (
              <div
                key={todo.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 transition-all ${
                    isDark
                      ? 'border-purple-500 hover:bg-purple-500/20'
                      : 'border-purple-400 hover:bg-purple-50'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm ${theme.text}`}>{todo.title}</span>
                    {googleConnected && getSyncIcon(todo.sync_status)}
                  </div>
                  {todo.due_date && (
                    <p className={`text-xs mt-0.5 ${theme.textMuted}`}>
                      Due: {new Date(todo.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className={`text-red-500 hover:bg-red-500/20 rounded p-1 transition-all`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <>
                <div className="flex items-center justify-between pt-2">
                  <span className={`text-sm font-medium ${theme.textMuted}`}>
                    Completed ({completedTodos.length})
                  </span>
                  <button
                    onClick={clearCompleted}
                    className={`text-xs ${theme.textMuted} hover:text-red-500 transition-colors`}
                  >
                    Clear all
                  </button>
                </div>
                {completedTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all opacity-60 ${
                      isDark
                        ? 'bg-white/5 border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className={`text-sm line-through ${theme.textMuted}`}>{todo.title}</span>
                      {googleConnected && getSyncIcon(todo.sync_status)}
                    </div>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-500/50 hover:text-red-500 hover:bg-red-500/20 rounded p-1 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Detail Popup - positioned near button like word note popup */}
      {showDetailModal && createPortal(
        <div
          ref={popupRef}
          className={`fixed z-[9999] w-72 rounded-xl border shadow-2xl overflow-hidden animate-fadeInUp ${
            isDark ? 'bg-[#1a1a2e] border-purple-500/30' : 'bg-white border-purple-200'
          }`}
          style={{
            top: popupPosition.top,
            left: Math.max(8, Math.min(popupPosition.left, window.innerWidth - 296)),
          }}
          onClick={(e) => e.stopPropagation()}
        >
            {/* Header with gradient like word note popup */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-white">New Task</h3>
                <p className="text-xs text-white/70">Add details below</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-lg transition-all hover:bg-white/20 text-white/80 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form - Compact like word note popup */}
            <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
              {/* Title input */}
              <input
                type="text"
                value={taskForm.title}
                onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
                autoFocus
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${theme.input}`}
              />

              {/* Notes/Description */}
              <textarea
                value={taskForm.notes}
                onChange={(e) => setTaskForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Add description..."
                rows={2}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none ${theme.input}`}
              />

              {/* Due Date */}
              <div>
                <label className={`block text-xs mb-1 ${theme.textMuted}`}>Due Date</label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm(f => ({ ...f, due_date: e.target.value }))}
                  className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${theme.input}`}
                />
              </div>

              {/* Priority */}
              <div>
                <label className={`block text-xs mb-1 ${theme.textMuted}`}>Priority</label>
                <div className="flex gap-1">
                  {[
                    { value: 0, label: 'None', color: 'slate' },
                    { value: 1, label: 'Low', color: 'blue' },
                    { value: 2, label: 'Med', color: 'amber' },
                    { value: 3, label: 'High', color: 'red' },
                  ].map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTaskForm(f => ({ ...f, priority: value }))}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all border ${
                        taskForm.priority === value
                          ? color === 'slate'
                            ? isDark ? 'bg-slate-500/30 border-slate-500 text-slate-300' : 'bg-slate-100 border-slate-400 text-slate-700'
                            : color === 'blue'
                            ? 'bg-blue-500/20 border-blue-500 text-blue-500'
                            : color === 'amber'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                            : 'bg-red-500/20 border-red-500 text-red-500'
                          : isDark
                            ? 'border-white/10 text-slate-400 hover:bg-white/5'
                            : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <label className={`block text-xs mb-1 ${theme.textMuted}`}>Subtasks</label>

                {/* Existing subtasks */}
                {taskForm.subtasks.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {taskForm.subtasks.map((subtask) => (
                      <div key={subtask.id} className={`flex items-center gap-2 p-1.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                        <button
                          type="button"
                          onClick={() => toggleSubtask(subtask.id)}
                          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                            subtask.completed
                              ? 'bg-purple-500 border-purple-500'
                              : isDark ? 'border-white/20' : 'border-slate-300'
                          }`}
                        >
                          {subtask.completed && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span className={`flex-1 text-xs ${subtask.completed ? 'line-through opacity-50' : ''} ${theme.text}`}>
                          {subtask.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSubtask(subtask.id)}
                          className="text-red-400 hover:text-red-500 p-0.5"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add subtask input */}
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                    placeholder="Add subtask..."
                    className={`flex-1 px-2 py-1 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${theme.input}`}
                  />
                  <button
                    type="button"
                    onClick={addSubtask}
                    disabled={!newSubtask.trim()}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      newSubtask.trim()
                        ? 'bg-purple-500 text-white hover:bg-purple-600'
                        : isDark ? 'bg-white/10 text-slate-500' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

          {/* Footer - just Save button like word note popup */}
          <div className="px-3 pb-3">
            <button
              onClick={addDetailedTask}
              disabled={!taskForm.title.trim()}
              className={`w-full py-2 rounded-lg font-medium text-sm transition-all ${
                taskForm.title.trim()
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
