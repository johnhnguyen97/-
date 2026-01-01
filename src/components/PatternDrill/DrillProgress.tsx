import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { DrillSessionStats } from '../../types/drill';

interface DrillProgressProps {
  current: number;
  total: number;
  stats: DrillSessionStats;
}

export const DrillProgress: React.FC<DrillProgressProps> = ({ current, total, stats }) => {
  const { isDark } = useTheme();

  // Generate segments for the progress bar
  const segments = Array.from({ length: total }, (_, i) => i);

  // Determine segment status
  const getSegmentStatus = (index: number) => {
    if (index >= current) return 'upcoming';
    if (index === current - 1) return 'current';

    // Check questionResults for answered questions
    const result = stats.questionResults?.[index];
    if (result) {
      if (result.skipped) return 'skipped';
      return result.correct ? 'correct' : 'incorrect';
    }

    return 'upcoming';
  };

  // Theme classes
  const theme = {
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    segmentBg: isDark ? 'bg-gray-700' : 'bg-gray-200',
  };

  return (
    <div className="space-y-3">
      {/* Segmented Progress Bar */}
      <div className="flex gap-1">
        {segments.map((i) => {
          const status = getSegmentStatus(i);
          return (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                status === 'correct'
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : status === 'incorrect'
                    ? 'bg-gradient-to-r from-red-400 to-rose-500'
                    : status === 'skipped'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                      : status === 'current'
                        ? 'bg-gradient-to-r from-purple-400 to-violet-500 animate-pulse'
                        : theme.segmentBg
              }`}
            />
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-sm">
        {/* Left: Correct/Incorrect counts */}
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1.5 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{stats.correctAnswers}</span>
          </span>
          <span className={`flex items-center gap-1.5 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium">{stats.incorrectAnswers}</span>
          </span>
          {/* Skipped count (if any) */}
          {stats.skippedAnswers > 0 && (
            <span className={`flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{stats.skippedAnswers}</span>
            </span>
          )}
        </div>

        {/* Center: Question counter */}
        <div className={`font-medium ${theme.textMuted}`}>
          <span className={theme.text}>{current}</span>
          <span className="mx-1">/</span>
          <span>{total}</span>
        </div>

        {/* Right: Accuracy badge */}
        {stats.correctAnswers + stats.incorrectAnswers > 0 && (
          <div className={`px-2.5 py-1 rounded-lg text-sm font-medium ${
            stats.accuracy >= 80
              ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
              : stats.accuracy >= 60
                ? isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                : isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
          }`}>
            {stats.accuracy}%
          </div>
        )}
      </div>
    </div>
  );
};
