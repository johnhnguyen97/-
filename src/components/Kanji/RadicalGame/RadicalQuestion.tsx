import type { RadicalDrillQuestion } from '../../../types/kanji';

interface RadicalQuestionProps {
  question: RadicalDrillQuestion;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
  showFeedback: boolean;
  onNext: () => void;
  isDark: boolean;
}

export function RadicalQuestion({
  question,
  onAnswer,
  selectedAnswer,
  showFeedback,
  onNext,
  isDark,
}: RadicalQuestionProps) {
  const isCorrect = selectedAnswer === question.correctAnswer;

  const theme = {
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-stone-200',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
    radical: isDark ? 'text-amber-400' : 'text-amber-600',
    option: (isSelected: boolean, isCorrectOption: boolean, showResult: boolean) => {
      if (!showResult) {
        return isSelected
          ? isDark
            ? 'bg-amber-600/20 border-amber-500/50 ring-2 ring-amber-500/30'
            : 'bg-amber-100 border-amber-400 ring-2 ring-amber-200'
          : isDark
            ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            : 'bg-white border-stone-200 hover:bg-gray-50 hover:border-stone-300';
      }

      if (isCorrectOption) {
        return isDark
          ? 'bg-emerald-600/20 border-emerald-500/50 ring-2 ring-emerald-500/30'
          : 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-200';
      }

      if (isSelected && !isCorrectOption) {
        return isDark
          ? 'bg-red-600/20 border-red-500/50 ring-2 ring-red-500/30'
          : 'bg-red-100 border-red-400 ring-2 ring-red-200';
      }

      return isDark
        ? 'bg-white/5 border-white/10 opacity-50'
        : 'bg-white border-stone-200 opacity-50';
    },
    feedback: isCorrect
      ? isDark
        ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : isDark
        ? 'bg-red-600/20 border-red-500/30 text-red-400'
        : 'bg-red-50 border-red-200 text-red-700',
    nextButton: isDark
      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
  };

  return (
    <div className="space-y-6">
      {/* Question Card */}
      <div className={`p-6 rounded-2xl border ${theme.card}`}>
        {/* Radical Display */}
        <div className="text-center mb-6">
          {question.radical && (
            <div className={`text-7xl md:text-8xl font-serif mb-4 ${theme.radical}`}>
              {question.radical.character}
            </div>
          )}
          <p className={`text-lg ${theme.text}`}>{question.questionText}</p>
        </div>

        {/* Options */}
        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option.text;
            const isCorrectOption = option.isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => !showFeedback && onAnswer(option.text)}
                disabled={showFeedback}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  theme.option(isSelected, isCorrectOption, showFeedback)
                } ${!showFeedback ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {/* Option letter */}
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isDark ? 'bg-white/10' : 'bg-gray-100'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>

                  {/* Option text */}
                  <div className="flex-1">
                    <span className={`font-medium ${theme.text}`}>{option.text}</span>
                    {option.subText && (
                      <span className={`ml-2 text-sm ${theme.textMuted}`}>({option.subText})</span>
                    )}
                  </div>

                  {/* Result icon */}
                  {showFeedback && isCorrectOption && (
                    <span className="text-2xl">✓</span>
                  )}
                  {showFeedback && isSelected && !isCorrectOption && (
                    <span className="text-2xl">✗</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`p-4 rounded-xl border ${theme.feedback}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{isCorrect ? '🎉' : '💡'}</span>
            <div>
              <div className="font-bold mb-1">
                {isCorrect ? 'Correct!' : 'Not quite...'}
              </div>
              {question.explanation && (
                <div className="text-sm opacity-90">{question.explanation}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      {showFeedback && (
        <button
          onClick={onNext}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${theme.nextButton}`}
        >
          Continue
        </button>
      )}
    </div>
  );
}
