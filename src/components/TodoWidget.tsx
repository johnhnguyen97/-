import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

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
  created_at: string;
  updated_at: string;
}

interface TodoWidgetProps {
  compact?: boolean;
}

export function TodoWidget({ compact = false }: TodoWidgetProps) {
  const { isDark } = useTheme();
  const { session } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const theme = {
    bg: isDark ? 'bg-white/5' : 'bg-white',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    input: isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400',
  };

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

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    const tempId = Date.now().toString();
    const optimisticTodo: TodoItem = {
      id: tempId,
      title: newTodo.trim(),
      is_completed: false,
      task_type: 'custom',
      priority: 0,
      sync_status: 'local',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    setTodos(prev => [optimisticTodo, ...prev]);
    setNewTodo('');

    if (!session?.access_token) {
      // Save to localStorage for non-logged-in users
      const localTodos = JSON.parse(localStorage.getItem('gojun-todos') || '[]');
      localTodos.unshift({ id: tempId, text: newTodo.trim(), completed: false, createdAt: Date.now() });
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
        body: JSON.stringify({ title: newTodo.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic todo with real one
        setTodos(prev => prev.map(t => t.id === tempId ? data.todo : t));
      } else {
        // Revert on error
        setTodos(prev => prev.filter(t => t.id !== tempId));
      }
    } catch (error) {
      console.error('Failed to add todo:', error);
      setTodos(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newCompleted = !todo.is_completed;

    // Optimistic update
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : undefined } : t
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

      if (!response.ok) {
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

      if (!response.ok && todoToDelete) {
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

      if (!response.ok) {
        // Revert on error
        setTodos(prev => [...prev, ...completedTodos]);
      }
    } catch (error) {
      console.error('Failed to clear completed:', error);
      setTodos(prev => [...prev, ...completedTodos]);
    }
  };

  const activeTodos = todos.filter(t => !t.is_completed);
  const completedTodos = todos.filter(t => t.is_completed);

  return (
    <div className={`backdrop-blur-xl rounded-2xl border ${theme.bg} ${theme.border} p-4 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`font-bold flex items-center gap-2 ${theme.text}`}>
          <span>✓</span> {compact ? 'Tasks' : 'To-Do List'}
          {session?.access_token && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
              synced
            </span>
          )}
        </h3>
        <span className={`text-sm ${theme.textMuted}`}>
          {isLoading ? '...' : `${activeTodos.length} active`}
        </span>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a task..."
          className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${theme.input}`}
        />
        <button
          onClick={addTodo}
          disabled={!newTodo.trim()}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            newTodo.trim()
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
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
                  <span className={`text-sm ${theme.text}`}>{todo.title}</span>
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
                    <span className={`flex-1 text-sm line-through ${theme.textMuted}`}>{todo.title}</span>
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
    </div>
  );
}
