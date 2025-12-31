interface RadicalProgressProps {
  current: number;
  total: number;
  correctCount: number;
  isDark: boolean;
}

export function RadicalProgress({ current, total, correctCount, isDark }: RadicalProgressProps) {
  const progress = (current / total) * 100;
  const accuracy = current > 1 ? Math.round((correctCount / (current - 1)) * 100) : 0;

  const theme = {
    container: isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-stone-200',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
    progressBg: isDark ? 'bg-white/10' : 'bg-gray-200',
    progressBar: 'bg-gradient-to-r from-amber-500 to-orange-500',
    stat: isDark ? 'bg-white/10' : 'bg-white',
  };

  return (
    <div className={`p-4 rounded-xl border ${theme.container}`}>
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-sm font-medium ${theme.text}`}>
            Question {current} of {total}
          </span>
          <span className={`text-sm ${theme.textMuted}`}>{Math.round(progress)}%</span>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${theme.progressBg}`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${theme.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className={`flex-1 p-2 rounded-lg text-center ${theme.stat}`}>
          <div className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {correctCount}
          </div>
          <div className={`text-xs ${theme.textMuted}`}>Correct</div>
        </div>
        <div className={`flex-1 p-2 rounded-lg text-center ${theme.stat}`}>
          <div className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {current - 1 - correctCount}
          </div>
          <div className={`text-xs ${theme.textMuted}`}>Wrong</div>
        </div>
        <div className={`flex-1 p-2 rounded-lg text-center ${theme.stat}`}>
          <div className={`text-lg font-bold ${theme.text}`}>
            {current > 1 ? `${accuracy}%` : '-'}
          </div>
          <div className={`text-xs ${theme.textMuted}`}>Accuracy</div>
        </div>
      </div>
    </div>
  );
}
