import type { RadicalDrillQuestion } from '../../../types/kanji';

interface RadicalResultsProps {
  questions: RadicalDrillQuestion[];
  answers: Map<string, { answer: string; isCorrect: boolean }>;
  onRestart: () => void;
  isDark: boolean;
}

export function RadicalResults({ questions, answers, onRestart, isDark }: RadicalResultsProps) {
  const correctCount = Array.from(answers.values()).filter((a) => a.isCorrect).length;
  const totalCount = questions.length;
  const accuracy = Math.round((correctCount / totalCount) * 100);

  const getGrade = () => {
    if (accuracy >= 90) return { emoji: '🏆', label: 'Excellent!', color: 'text-amber-500' };
    if (accuracy >= 70) return { emoji: '🎉', label: 'Great job!', color: 'text-emerald-500' };
    if (accuracy >= 50) return { emoji: '👍', label: 'Good effort!', color: 'text-blue-500' };
    return { emoji: '💪', label: 'Keep practicing!', color: 'text-purple-500' };
  };

  const grade = getGrade();

  const theme = {
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-200',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
    correct: isDark ? 'bg-emerald-600/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200',
    incorrect: isDark ? 'bg-red-600/20 border-red-500/30' : 'bg-red-50 border-red-200',
    button: isDark
      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
    buttonSecondary: isDark
      ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
      : 'bg-white hover:bg-gray-50 text-gray-700 border-stone-200',
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <div className={`p-8 rounded-2xl border text-center ${theme.card}`}>
        <div className="text-6xl mb-4">{grade.emoji}</div>
        <h2 className={`text-2xl font-bold mb-2 ${grade.color}`}>{grade.label}</h2>

        <div className={`text-5xl font-bold mb-2 ${theme.text}`}>
          {accuracy}%
        </div>

        <p className={theme.textMuted}>
          You got {correctCount} out of {totalCount} questions correct
        </p>

        {/* Score breakdown */}
        <div className="flex justify-center gap-6 mt-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {correctCount}
            </div>
            <div className={`text-sm ${theme.textMuted}`}>Correct</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {totalCount - correctCount}
            </div>
            <div className={`text-sm ${theme.textMuted}`}>Incorrect</div>
          </div>
        </div>
      </div>

      {/* Question Review */}
      <div className={`rounded-2xl border overflow-hidden ${theme.card}`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
          <h3 className={`font-medium ${theme.text}`}>Review Answers</h3>
        </div>

        <div className="divide-y divide-stone-200 dark:divide-white/10 max-h-80 overflow-y-auto">
          {questions.map((question, index) => {
            const answer = answers.get(question.id);
            const isCorrect = answer?.isCorrect ?? false;

            return (
              <div
                key={question.id}
                className={`p-4 ${isCorrect ? theme.correct : theme.incorrect}`}
              >
                <div className="flex items-start gap-3">
                  {/* Result icon */}
                  <span className="text-xl mt-0.5">
                    {isCorrect ? '✓' : '✗'}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Question */}
                    <div className="flex items-center gap-2 mb-1">
                      {question.radical && (
                        <span className={`text-2xl font-serif ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          {question.radical.character}
                        </span>
                      )}
                      <span className={`text-sm ${theme.textMuted}`}>
                        Q{index + 1}: {question.questionText}
                      </span>
                    </div>

                    {/* Answer */}
                    <div className={`text-sm ${theme.text}`}>
                      {!isCorrect && (
                        <>
                          <span className="line-through opacity-50 mr-2">{answer?.answer}</span>
                          <span>→</span>
                        </>
                      )}
                      <span className={`font-medium ml-1 ${isCorrect ? '' : isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {question.correctAnswer}
                      </span>
                    </div>

                    {/* Explanation */}
                    {!isCorrect && question.explanation && (
                      <div className={`text-xs mt-1 ${theme.textMuted}`}>
                        {question.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${theme.button}`}
        >
          Practice Again
        </button>
      </div>
    </div>
  );
}
