import React, { useState } from 'react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useTheme } from '../../contexts/ThemeContext';
import type { MCOption } from '../../types/drill';

interface DrillAnswerProps {
  mode: 'typing' | 'multiple_choice';
  mcOptions?: MCOption[];
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export const DrillAnswer: React.FC<DrillAnswerProps> = ({
  mode,
  mcOptions,
  onSubmit,
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const [typedAnswer, setTypedAnswer] = useState('');
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const { speak, speaking } = useSpeechSynthesis();

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    setSpeakingText(text);
    speak(text);
  };

  // Reset speaking text when speech ends
  React.useEffect(() => {
    if (!speaking) {
      setSpeakingText(null);
    }
  }, [speaking]);

  const handleTypingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedAnswer.trim()) {
      onSubmit(typedAnswer.trim());
      setTypedAnswer('');
    }
  };

  const handleMCSelect = (option: MCOption) => {
    if (!disabled) {
      onSubmit(option.text);
    }
  };

  if (mode === 'typing') {
    return (
      <form onSubmit={handleTypingSubmit} className="space-y-4">
        <input
          type="text"
          value={typedAnswer}
          onChange={(e) => setTypedAnswer(e.target.value)}
          placeholder="Type your answer in Japanese..."
          disabled={disabled}
          className={`w-full px-4 py-3 text-xl text-center border-2 rounded-xl outline-none transition-all ${
            isDark
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:bg-gray-900'
              : 'bg-white border-gray-200 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100'
          } disabled:cursor-not-allowed`}
          autoFocus
        />
        <button
          type="submit"
          disabled={disabled || !typedAnswer.trim()}
          className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Submit Answer
        </button>
      </form>
    );
  }

  // Multiple choice mode
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {mcOptions?.map((option) => {
        const isPlaying = speakingText === option.text;
        return (
          <button
            key={option.id}
            onClick={() => handleMCSelect(option)}
            disabled={disabled}
            className={`group relative p-4 rounded-xl border-2 transition-all text-left ${
              disabled
                ? isDark
                  ? 'bg-gray-800 border-gray-700 cursor-not-allowed'
                  : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                : isDark
                  ? 'bg-gray-800/50 border-gray-700 hover:border-purple-500 hover:bg-purple-900/20 hover:shadow-md active:scale-[0.98]'
                  : 'bg-white border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:shadow-md active:scale-[0.98]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className={`text-xl font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{option.text}</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{option.reading}</div>
                {option.english && (
                  <div className={`text-sm mt-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>({option.english})</div>
                )}
              </div>
              {/* Audio button - only highlights when this specific option is playing */}
              <button
                onClick={(e) => handleSpeak(e, option.text)}
                disabled={disabled}
                className={`p-2 rounded-full transition-all flex-shrink-0 ${
                  isPlaying
                    ? 'bg-purple-500 text-white scale-110 animate-pulse'
                    : isDark
                      ? 'bg-gray-700 text-gray-400 hover:bg-purple-900/50 hover:text-purple-400 group-hover:bg-purple-900/50 group-hover:text-purple-400'
                      : 'bg-gray-100 text-gray-500 hover:bg-purple-100 hover:text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                } ${disabled ? 'opacity-50' : ''}`}
                title="Listen to pronunciation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                  <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                </svg>
              </button>
            </div>
          </button>
        );
      })}
    </div>
  );
};
