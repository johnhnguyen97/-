import React from 'react';
import type { DrillSessionStats } from '../../types/drill';

interface DrillProgressProps {
  current: number;
  total: number;
  stats: DrillSessionStats;
}

export const DrillProgress: React.FC<DrillProgressProps> = ({ current, total, stats }) => {
  const progress = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 font-medium">{current} / {total}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-green-600">✓ {stats.correctAnswers}</span>
        <span className="text-red-500">✗ {stats.incorrectAnswers}</span>
        {stats.correctAnswers + stats.incorrectAnswers > 0 && (
          <span className="text-gray-500">({stats.accuracy}%)</span>
        )}
      </div>
    </div>
  );
};
