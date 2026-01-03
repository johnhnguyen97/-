import React, { useState, useEffect } from 'react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useTheme } from '../../contexts/ThemeContext';
import { Furigana } from '../common/Furigana';
import type { MCOption } from '../../types/drill';

interface DrillAnswerProps {
  mode: 'typing' | 'multiple_choice';
  mcOptions?: MCOption[];
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
  showFurigana?: boolean;
}

export const DrillAnswer: React.FC<DrillAnswerProps> = ({
  mode,
  mcOptions,
  onSubmit,
  onSkip,
  disabled = false,
  showFurigana = true,
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
      <div className="space-y-4">
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

        {/* I Don't Know button */}
        {onSkip && (
          <button
            onClick={onSkip}
            disabled={disabled}
            className={`w-full py-3 rounded-xl border-2 border-dashed transition-all ${
              isDark
                ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>I don't know - show answer</span>
            </div>
          </button>
        )}
      </div>
    );
  }

  // Track which options have hints revealed
  const [revealedHints, setRevealedHints] = useState<Set<string>>(new Set());

  // Reset hints when question changes (new mcOptions)
  useEffect(() => {
    setRevealedHints(new Set());
  }, [mcOptions]);

  const toggleHint = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    setRevealedHints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(optionId)) {
        newSet.delete(optionId);
      } else {
        newSet.add(optionId);
      }
      return newSet;
    });
  };

  // Multiple choice mode - Enhanced card UI
  return (
    <div className="space-y-4">
      {/* Answer options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mcOptions?.map((option) => {
          const isPlaying = speakingText === option.text;
          const hintRevealed = revealedHints.has(option.id);
          return (
            <button
              key={option.id}
              onClick={() => handleMCSelect(option)}
              disabled={disabled}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-200 text-left min-h-[80px] ${
                disabled
                  ? isDark
                    ? 'bg-gray-800 border-gray-700 cursor-not-allowed opacity-60'
                    : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                  : isDark
                    ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700 hover:border-purple-500 hover:from-purple-900/30 hover:to-violet-900/30 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-purple-400 hover:from-purple-50 hover:to-violet-50 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {/* Decorative gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Selection indicator line at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />

              <div className="relative p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Main answer text with optional furigana */}
                    <div className={`text-xl sm:text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {showFurigana && option.reading ? (
                        <Furigana
                          text={option.text}
                          reading={option.reading}
                          showFurigana={showFurigana}
                          textClassName={`${isDark ? 'text-white' : 'text-gray-800'}`}
                          furiganaClassName={`text-[0.5em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        />
                      ) : (
                        option.text
                      )}
                    </div>

                    {/* Reading (shown separately if furigana is off) */}
                    {!showFurigana && option.reading && (
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {option.reading}
                      </div>
                    )}

                    {/* Hint button or revealed hint */}
                    {option.english && (
                      <div className="mt-2">
                        {hintRevealed ? (
                          <div className={`inline-block text-sm px-2 py-0.5 rounded-md animate-fadeIn ${
                            isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {option.english}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => toggleHint(e, option.id)}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all ${
                              isDark
                                ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-300'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-600'
                            }`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            hint?
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Audio button */}
                  <button
                    onClick={(e) => handleSpeak(e, option.text)}
                    disabled={disabled}
                    className={`p-2.5 sm:p-3 rounded-xl transition-all flex-shrink-0 outline-none focus:outline-none focus:ring-0 ${
                      isPlaying
                        ? 'bg-purple-500 text-white scale-110 animate-pulse shadow-lg shadow-purple-500/30'
                        : isDark
                          ? 'bg-gray-700 text-gray-400 hover:bg-purple-800 hover:text-purple-300 group-hover:bg-purple-800/50 group-hover:text-purple-300'
                          : 'bg-gray-100 text-gray-500 hover:bg-purple-100 hover:text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                    } ${disabled ? 'opacity-50' : ''}`}
                    title="Listen to pronunciation"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                      <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                    </svg>
                  </button>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* I Don't Know button */}
      {onSkip && (
        <button
          onClick={onSkip}
          disabled={disabled}
          className={`w-full py-3 rounded-xl border-2 border-dashed transition-all ${
            isDark
              ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>I don't know - show answer</span>
          </div>
        </button>
      )}
    </div>
  );
};
