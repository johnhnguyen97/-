import React, { useState } from 'react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useTheme } from '../../contexts/ThemeContext';
import { Furigana } from '../common/Furigana';
import { FavoriteButton } from '../FavoriteButton';
import { WordNoteButton } from '../WordNoteButton';
import { VERB_GROUP_NAMES, getVerbGroupDisplayName } from '../../types/drill';
import type { DrillSentence, DrillPrompt, ExampleSentence, DrillPracticeMode } from '../../types/drill';

interface DrillQuestionDisplayProps {
  sentence: DrillSentence;
  prompt: DrillPrompt;
  practiceMode?: DrillPracticeMode;
  exampleSentence?: ExampleSentence;
  showFurigana?: boolean;
  showRomaji?: boolean;
}

export const DrillQuestionDisplay: React.FC<DrillQuestionDisplayProps> = ({
  sentence,
  prompt,
  practiceMode = 'word',
  exampleSentence,
  showFurigana = true,
  showRomaji = false,
}) => {
  const { isDark } = useTheme();
  const { speak, speaking } = useSpeechSynthesis();
  const [_notePopupOpen, setNotePopupOpen] = useState(false);

  const handleSpeak = (text: string) => {
    speak(text);
  };

  // Show example sentence in sentence mode
  const showSentence = practiceMode === 'sentence' && exampleSentence;

  // Get verb group badge colors
  const getVerbGroupStyle = () => {
    if (sentence.word_type !== 'verb' || !sentence.verb_group) return null;

    const styles = {
      group1: isDark
        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        : 'bg-blue-100 text-blue-700 border-blue-200',
      group2: isDark
        ? 'bg-green-500/20 text-green-300 border-green-500/30'
        : 'bg-green-100 text-green-700 border-green-200',
      group3: isDark
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        : 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return styles[sentence.verb_group] || styles.group1;
  };

  // Theme classes
  const theme = {
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    card: isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100',
    audioBtn: speaking
      ? 'bg-indigo-500 text-white animate-pulse shadow-lg shadow-indigo-500/30'
      : isDark
        ? 'bg-gray-700 text-gray-400 hover:bg-indigo-500/30 hover:text-indigo-300'
        : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600',
  };

  // Audio button component
  const AudioButton = ({ text, size = 'md' }: { text: string; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'p-1.5 w-8 h-8',
      md: 'p-2 w-10 h-10',
      lg: 'p-2.5 w-12 h-12',
    };
    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <button
        onClick={() => handleSpeak(text)}
        className={`rounded-full transition-all flex-shrink-0 flex items-center justify-center ${sizeClasses[size]} ${theme.audioBtn}`}
        title="Listen to pronunciation"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconSizes[size]}
        >
          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
          <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
        </svg>
      </button>
    );
  };

  return (
    <div className="text-center space-y-4">
      {/* Prompt */}
      <div className={`text-lg mb-2 ${theme.textMuted}`}>{prompt.prompt_en}</div>

      {/* Dictionary Form Info Card - NEW */}
      {sentence.word_type === 'verb' && sentence.verb_group && (
        <div className={`relative inline-flex items-center gap-3 px-4 py-2 rounded-xl border ${theme.card}`}>
          {/* Favorite & Note buttons */}
          <div className="absolute -top-1 -right-1 flex gap-0.5 z-20">
            <FavoriteButton
              word={sentence.dictionary_form || sentence.japanese_base}
              reading={sentence.reading || ''}
              english={sentence.english}
              partOfSpeech={sentence.word_type === 'verb' ? 'verb' : 'adjective'}
              isFavorited={false}
            />
            <WordNoteButton
              word={sentence.dictionary_form || sentence.japanese_base}
              reading={sentence.reading || ''}
              english={sentence.english}
              onPopupChange={setNotePopupOpen}
            />
          </div>

          <div className="text-left">
            <div className={`text-xs uppercase tracking-wide font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Dictionary Form
            </div>
            <div className="flex items-center gap-2">
              {showFurigana && sentence.reading ? (
                <Furigana
                  text={sentence.dictionary_form || sentence.japanese_base}
                  reading={sentence.reading}
                  showFurigana={showFurigana}
                  romaji={sentence.romaji}
                  showRomaji={showRomaji}
                  textClassName={`text-xl font-bold ${theme.text}`}
                  furiganaClassName={`text-[0.5em] ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}
                />
              ) : (
                <span className={`text-xl font-bold ${theme.text}`}>
                  {sentence.dictionary_form || sentence.japanese_base}
                </span>
              )}
              <AudioButton text={sentence.dictionary_form || sentence.japanese_base} size="sm" />
            </div>
            {showRomaji && sentence.romaji && !showFurigana && (
              <div className={`text-sm font-mono ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>
                {sentence.romaji}
              </div>
            )}
          </div>

          {/* Verb Group Badge */}
          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${getVerbGroupStyle()}`}>
            <div>{getVerbGroupDisplayName(sentence.verb_group, 'short')}</div>
            <div className="text-xs opacity-75">{VERB_GROUP_NAMES[sentence.verb_group]?.jp}</div>
          </div>
        </div>
      )}

      {/* Base word or sentence */}
      {showSentence ? (
        <div className="space-y-3">
          {/* Example sentence */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-3xl font-bold ${theme.text}`}>
              {exampleSentence.japanese}
            </span>
            <AudioButton text={exampleSentence.japanese} size="md" />
          </div>

          {/* English translation */}
          <div className={`text-lg ${theme.textMuted}`}>
            "{exampleSentence.english}"
          </div>

          {/* Highlighted word */}
          <div className={`mt-4 p-3 rounded-xl inline-block ${
            isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50'
          }`}>
            <span className={`text-sm block mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              Conjugate this word:
            </span>
            <div className="flex items-center justify-center gap-2">
              {showFurigana && sentence.reading ? (
                <Furigana
                  text={sentence.japanese_base}
                  reading={sentence.reading}
                  showFurigana={showFurigana}
                  textClassName={`text-2xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}
                  furiganaClassName={`text-[0.5em] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                />
              ) : (
                <span className={`text-2xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  {sentence.japanese_base}
                </span>
              )}
              <AudioButton text={sentence.japanese_base} size="sm" />
            </div>
            <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              ({sentence.english})
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Single word mode */}
          <div className="relative inline-block">
            {/* Favorite & Note buttons for non-verb words or words without verb_group */}
            {(!sentence.verb_group) && (
              <div className="absolute -top-1 -right-1 flex gap-0.5 z-20">
                <FavoriteButton
                  word={sentence.dictionary_form || sentence.japanese_base}
                  reading={sentence.reading || ''}
                  english={sentence.english}
                  partOfSpeech={sentence.word_type === 'verb' ? 'verb' : sentence.adjective_type || 'adjective'}
                  isFavorited={false}
                />
                <WordNoteButton
                  word={sentence.dictionary_form || sentence.japanese_base}
                  reading={sentence.reading || ''}
                  english={sentence.english}
                  onPopupChange={setNotePopupOpen}
                />
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              {showFurigana && sentence.reading ? (
                <Furigana
                  text={sentence.japanese_base}
                  reading={sentence.reading}
                  showFurigana={showFurigana}
                  romaji={sentence.romaji}
                  showRomaji={showRomaji}
                  textClassName={`text-4xl font-bold ${theme.text}`}
                  furiganaClassName={`text-[0.5em] ${theme.textMuted}`}
                />
              ) : (
                <span className={`text-4xl font-bold ${theme.text}`}>
                  {sentence.japanese_base}
                </span>
              )}
              <AudioButton text={sentence.japanese_base} size="lg" />
            </div>
          </div>

          {/* Romaji (shown separately if no furigana) */}
          {showRomaji && sentence.romaji && !showFurigana && (
            <div className={`text-sm font-mono ${theme.textMuted}`}>
              {sentence.romaji}
            </div>
          )}

          <div className={`text-xl ${theme.textMuted}`}>({sentence.english})</div>
        </div>
      )}

      {/* Word type badges */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            sentence.word_type === 'verb'
              ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
              : isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
          }`}
        >
          {sentence.word_type === 'verb' ? 'Verb' : 'Adjective'}
          {sentence.verb_group && ` (${getVerbGroupDisplayName(sentence.verb_group, 'short')})`}
          {sentence.adjective_type && ` (${sentence.adjective_type.replace('_', '-')})`}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
        }`}>
          {sentence.jlpt_level}
        </span>
      </div>
    </div>
  );
};
