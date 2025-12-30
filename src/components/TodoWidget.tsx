import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TodoWidgetProps {
  compact?: boolean;
}

export function TodoWidget({ compact = false }: TodoWidgetProps) {
  const { isDark } = useTheme();
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('gojun-todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    localStorage.setItem('gojun-todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    setTodos([todo, ...todos]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  const theme = {
    bg: isDark ? 'bg-white/5' : 'bg-white',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    input: isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400',
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div className={`backdrop-blur-xl rounded-2xl border ${theme.bg} ${theme.border} p-4 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`font-bold flex items-center gap-2 ${theme.text}`}>
          <span>✓</span> {compact ? 'Tasks' : 'To-Do List'}
        </h3>
        <span className={`text-sm ${theme.textMuted}`}>
          {activeTodos.length} active
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
        {activeTodos.length === 0 && completedTodos.length === 0 ? (
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
                <span className={`flex-1 text-sm ${theme.text}`}>{todo.text}</span>
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
                    <span className={`flex-1 text-sm line-through ${theme.textMuted}`}>{todo.text}</span>
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
