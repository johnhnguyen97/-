import React from 'react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import type { DrillSentence, DrillPrompt, ExampleSentence, DrillPracticeMode } from '../../types/drill';

interface DrillQuestionDisplayProps {
  sentence: DrillSentence;
  prompt: DrillPrompt;
  practiceMode?: DrillPracticeMode;
  exampleSentence?: ExampleSentence;
}

export const DrillQuestionDisplay: React.FC<DrillQuestionDisplayProps> = ({
  sentence,
  prompt,
  practiceMode = 'word',
  exampleSentence,
}) => {
  const { speak, speaking } = useSpeechSynthesis();

  const handleSpeak = (text: string) => {
    speak(text);
  };

  // Show example sentence in sentence mode
  const showSentence = practiceMode === 'sentence' && exampleSentence;

  return (
    <div className="text-center space-y-4">
      {/* Prompt */}
      <div className="text-lg text-gray-600 mb-2">{prompt.prompt_en}</div>

      {/* Base word or sentence */}
      {showSentence ? (
        <div className="space-y-3">
          {/* Example sentence */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-gray-800">
              {exampleSentence.japanese}
            </span>
            <button
              onClick={() => handleSpeak(exampleSentence.japanese)}
              className={`p-2 rounded-full transition-all ${
                speaking
                  ? 'bg-indigo-100 text-indigo-600 animate-pulse'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
              }`}
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

          {/* English translation */}
          <div className="text-gray-500 text-lg">
            "{exampleSentence.english}"
          </div>

          {/* Highlighted word */}
          <div className="mt-4 p-3 bg-amber-50 rounded-xl inline-block">
            <span className="text-sm text-amber-600 block mb-1">
              Conjugate this word:
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-amber-700">
                {sentence.japanese_base}
              </span>
              <button
                onClick={() => handleSpeak(sentence.japanese_base)}
                className={`p-1.5 rounded-full transition-all ${
                  speaking
                    ? 'bg-amber-200 text-amber-700 animate-pulse'
                    : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
                </svg>
              </button>
            </div>
            <span className="text-sm text-amber-600">
              ({sentence.english})
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Single word mode */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-gray-800">
              {sentence.japanese_base}
            </span>
            <button
              onClick={() => handleSpeak(sentence.japanese_base)}
              className={`p-2 rounded-full transition-all ${
                speaking
                  ? 'bg-indigo-100 text-indigo-600 animate-pulse'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
              }`}
              title="Listen to pronunciation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
              </svg>
            </button>
          </div>
          <div className="text-gray-500 text-xl">({sentence.english})</div>
        </div>
      )}

      {/* Word type badge */}
      <div className="flex justify-center gap-2 mt-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            sentence.word_type === 'verb'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-purple-100 text-purple-700'
          }`}
        >
          {sentence.word_type === 'verb' ? 'Verb' : 'Adjective'}
          {sentence.verb_group && ` (Group ${sentence.verb_group.replace('group', '')})`}
          {sentence.adjective_type && ` (${sentence.adjective_type.replace('_', '-')})`}
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
          {sentence.jlpt_level}
        </span>
      </div>
    </div>
  );
};
