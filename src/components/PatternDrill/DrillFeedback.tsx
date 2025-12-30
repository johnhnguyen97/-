import React from 'react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import type { DrillConjugation } from '../../types/drill';

interface DrillFeedbackProps {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: DrillConjugation;
  explanation: string;
  onNext: () => void;
  isLast?: boolean;
}

export const DrillFeedback: React.FC<DrillFeedbackProps> = ({
  isCorrect,
  userAnswer,
  correctAnswer,
  explanation,
  onNext,
  isLast = false,
}) => {
  const { speak, speaking } = useSpeechSynthesis();

  return (
    <div className={`p-6 rounded-2xl ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className={`text-4xl ${isCorrect ? 'animate-bounce' : ''}`}>{isCorrect ? '✓' : '✗'}</span>
        <span className={`text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {!isCorrect && (
          <div className="text-center">
            <span className="text-sm text-gray-500">Your answer:</span>
            <div className="text-xl text-red-600 line-through">{userAnswer}</div>
          </div>
        )}
        <div className="text-center">
          <span className="text-sm text-gray-500">{isCorrect ? 'Answer:' : 'Correct answer:'}</span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-gray-800">{correctAnswer.japanese}</span>
            <button
              onClick={() => speak(correctAnswer.japanese)}
              className={`w-12 h-12 rounded-full transition-all flex items-center justify-center ${speaking ? 'bg-indigo-200 animate-pulse scale-110' : 'bg-gray-100 hover:bg-indigo-100 hover:scale-105'}`}
              title="Play audio"
            >
              🔊
            </button>
          </div>
          <div className="text-gray-500">({correctAnswer.reading})</div>
        </div>
      </div>

      <div className="bg-white/50 rounded-xl p-4 mb-4">
        <div className="text-sm text-gray-600">{explanation}</div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        {isLast ? 'See Results' : 'Next Question →'}
      </button>
    </div>
  );
};
