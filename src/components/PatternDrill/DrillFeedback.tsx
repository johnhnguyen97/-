import React, { useEffect, useState } from 'react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import type { DrillConjugation } from '../../types/drill';

interface DrillFeedbackProps {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: DrillConjugation;
  explanation: string;
  onNext: () => void;
  isLast?: boolean;
  isSkipped?: boolean;
}

export const DrillFeedback: React.FC<DrillFeedbackProps> = ({
  isCorrect,
  userAnswer,
  correctAnswer,
  explanation,
  onNext,
  isLast = false,
  isSkipped = false,
}) => {
  const { speak, speaking } = useSpeechSynthesis();
  const [showAnimation, setShowAnimation] = useState(true);

  // Reset animation state when feedback changes
  useEffect(() => {
    setShowAnimation(true);
    const timer = setTimeout(() => setShowAnimation(false), 600);
    return () => clearTimeout(timer);
  }, [isCorrect, isSkipped, userAnswer]);

  // Determine the feedback type
  const feedbackType = isSkipped ? 'skipped' : (isCorrect ? 'correct' : 'incorrect');

  // Styles based on feedback type
  const containerStyles = {
    correct: 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200',
    incorrect: 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200',
    skipped: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200',
  };

  const iconStyles = {
    correct: { icon: '✓', color: 'text-green-600', bgColor: 'bg-green-100' },
    incorrect: { icon: '✗', color: 'text-red-600', bgColor: 'bg-red-100' },
    skipped: { icon: '→', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  };

  const titleStyles = {
    correct: { text: 'Correct!', color: 'text-green-600' },
    incorrect: { text: 'Incorrect', color: 'text-red-600' },
    skipped: { text: 'Answer Revealed', color: 'text-amber-600' },
  };

  const animationClass = showAnimation ? (
    feedbackType === 'correct' ? 'animate-correct-pulse' :
    feedbackType === 'incorrect' ? 'animate-wrong-shake' :
    'animate-skipped-fade'
  ) : '';

  return (
    <div className={`p-6 rounded-2xl ${containerStyles[feedbackType]} ${animationClass} transition-all`}>
      {/* Header with icon and title */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <span
          className={`w-12 h-12 rounded-full ${iconStyles[feedbackType].bgColor} flex items-center justify-center
            ${feedbackType === 'correct' && showAnimation ? 'animate-star-pop' : ''}`}
        >
          <span className={`text-2xl font-bold ${iconStyles[feedbackType].color}`}>
            {iconStyles[feedbackType].icon}
          </span>
        </span>
        <span className={`text-2xl font-bold ${titleStyles[feedbackType].color}`}>
          {titleStyles[feedbackType].text}
        </span>
      </div>

      {/* Answer comparison */}
      <div className="space-y-3 mb-4">
        {/* User's answer (only show if not correct and not skipped) */}
        {!isCorrect && !isSkipped && userAnswer && (
          <div className="text-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Your answer</span>
            <div className="text-xl text-red-500 line-through opacity-75">{userAnswer}</div>
          </div>
        )}

        {/* Skipped message */}
        {isSkipped && (
          <div className="text-center mb-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              You chose to reveal the answer
            </span>
          </div>
        )}

        {/* Correct answer */}
        <div className="text-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {isCorrect ? 'Answer' : 'Correct answer'}
          </span>
          <div className="flex items-center justify-center gap-3 mt-1">
            <div className={`relative ${feedbackType === 'correct' && showAnimation ? 'animate-correct-glow' : ''} rounded-xl px-4 py-2`}>
              <span className="text-3xl font-bold text-gray-800">{correctAnswer.japanese}</span>
            </div>
            <button
              onClick={() => speak(correctAnswer.japanese)}
              className={`w-12 h-12 rounded-full transition-all flex items-center justify-center shadow-md
                ${speaking
                  ? 'bg-indigo-500 text-white animate-pulse scale-110'
                  : 'bg-white hover:bg-indigo-50 hover:scale-105 border border-gray-200'
                }`}
              title="Play audio"
            >
              <span className="text-xl">{speaking ? '🔊' : '🔈'}</span>
            </button>
          </div>
          <div className="text-gray-500 text-lg mt-1">({correctAnswer.reading})</div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-4 border border-gray-100">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div className="text-sm text-gray-600 leading-relaxed">{explanation}</div>
        </div>
      </div>

      {/* Streak indicator for correct answers */}
      {isCorrect && (
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200">
            <span className="text-lg animate-fire-pulse">🔥</span>
            <span className="text-sm font-medium text-green-700">Great job! Keep it up!</span>
          </div>
        </div>
      )}

      {/* Encouragement for skipped/incorrect */}
      {(isSkipped || !isCorrect) && (
        <div className="flex justify-center mb-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
            isSkipped
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <span className="text-lg">{isSkipped ? '📝' : '💪'}</span>
            <span className="text-sm font-medium">
              {isSkipped ? 'Take note of this pattern!' : 'Don\'t worry, keep practicing!'}
            </span>
          </div>
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        className={`w-full py-4 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]
          ${isCorrect
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
            : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
          }`}
      >
        <span className="flex items-center justify-center gap-2">
          <span>{isLast ? 'See Results' : 'Next Question'}</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      </button>
    </div>
  );
};
