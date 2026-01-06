import React, { useState } from 'react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useTheme } from '../../contexts/ThemeContext';
import { Furigana } from '../common/Furigana';
import { KanjiPopover } from '../common/KanjiPopover';
import { FavoriteButton } from '../FavoriteButton';
import { WordNoteButton } from '../WordNoteButton';
import { SentenceFavoriteButton } from '../SentenceFavoriteButton';
import { getVerbGroupDisplayName } from '../../types/drill';
import type { DrillSentence, DrillPrompt, ExampleSentence, DrillPracticeMode } from '../../types/drill';

/**
 * Checks if a character is a kanji (CJK Unified Ideographs)
 */
function isKanji(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9faf) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf)    // CJK Unified Ideographs Extension A
  );
}

/**
 * Makes kanji in text interactive with dictionary popover
 */
function makeKanjiInteractive(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let currentRun = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (isKanji(char)) {
      if (currentRun) {
        elements.push(<span key={`t-${i}`}>{currentRun}</span>);
        currentRun = '';
      }
      elements.push(
        <KanjiPopover key={`k-${i}`} character={char}>
          {char}
        </KanjiPopover>
      );
    } else {
      currentRun += char;
    }
  }

  if (currentRun) {
    elements.push(<span key="t-end">{currentRun}</span>);
  }

  return <>{elements}</>;
}

/**
 * Highlights the target word in a sentence by underlining it
 * Also makes kanji interactive with dictionary popover
 */
function highlightTargetWord(
  sentence: string,
  targetWord: string,
  isDark: boolean
): React.ReactNode {
  if (!targetWord || !sentence) return makeKanjiInteractive(sentence);

  // Get the verb stem (remove る for ichidan, last character for godan)
  const stem = targetWord.endsWith('る')
    ? targetWord.slice(0, -1)
    : targetWord.slice(0, -1);

  // Try to find the target word or its stem in the sentence
  // First try exact match, then try stem match
  let matchIndex = sentence.indexOf(targetWord);
  let matchLength = targetWord.length;

  if (matchIndex === -1 && stem.length >= 2) {
    // Look for stem + any conjugation ending
    const stemIndex = sentence.indexOf(stem);
    if (stemIndex !== -1) {
      // Find where the conjugated form ends (next particle, punctuation, or space)
      const afterStem = sentence.slice(stemIndex + stem.length);
      const endMatch = afterStem.match(/^[ぁ-ん]{0,4}(?=[はがをにでとのかもやへ、。！？]|$)/);
      if (endMatch) {
        matchIndex = stemIndex;
        matchLength = stem.length + endMatch[0].length;
      }
    }
  }

  if (matchIndex === -1) return makeKanjiInteractive(sentence);

  const before = sentence.slice(0, matchIndex);
  const match = sentence.slice(matchIndex, matchIndex + matchLength);
  const after = sentence.slice(matchIndex + matchLength);

  const underlineStyle = isDark
    ? 'underline decoration-amber-400 decoration-2 underline-offset-4'
    : 'underline decoration-amber-500 decoration-2 underline-offset-4';

  return (
    <>
      {makeKanjiInteractive(before)}
      <span className={underlineStyle}>{makeKanjiInteractive(match)}</span>
      {makeKanjiInteractive(after)}
    </>
  );
}

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
  const { speak, isSpeaking } = useSpeechSynthesis();
  const [_notePopupOpen, setNotePopupOpen] = useState(false);

  const handleSpeak = (text: string) => {
    speak(text);
  };

  // Show example sentence in sentence mode
  const showSentence = practiceMode === 'sentence' && exampleSentence;

  // Theme classes
  const theme = {
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    card: isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100',
  };

  // Get audio button style based on whether this specific text is playing
  const getAudioBtnStyle = (isPlaying: boolean) => {
    if (isPlaying) {
      return 'bg-indigo-500 text-white animate-pulse shadow-lg shadow-indigo-500/30';
    }
    return isDark
      ? 'bg-gray-700 text-gray-400 hover:bg-indigo-500/30 hover:text-indigo-300'
      : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600';
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

    const isPlaying = isSpeaking(text);

    return (
      <button
        onClick={() => handleSpeak(text)}
        className={`rounded-full transition-all flex-shrink-0 flex items-center justify-center outline-none focus:outline-none focus:ring-0 ${sizeClasses[size]} ${getAudioBtnStyle(isPlaying)}`}
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

      {/* Base word or sentence */}
      {showSentence ? (
        <div className="space-y-3">
          {/* Example sentence with target word underlined */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-3xl font-bold ${theme.text}`}>
              {highlightTargetWord(exampleSentence.japanese, sentence.dictionary_form || sentence.japanese_base, isDark)}
            </span>
            <div className="flex items-center gap-1">
              <AudioButton text={exampleSentence.japanese} size="md" />
              <SentenceFavoriteButton
                japanese={exampleSentence.japanese}
                english={exampleSentence.english}
                source="pattern-drill"
                sourceId={exampleSentence.id}
              />
            </div>
          </div>

          {/* English translation */}
          <div className={`text-lg ${theme.textMuted}`}>
            "{exampleSentence.english}"
          </div>

          {/* Highlighted word */}
          <div className={`relative mt-4 px-5 py-3 rounded-xl inline-block ${
            isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
          }`}>
            {/* Conjugate label with buttons inline */}
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                Conjugate this word:
              </span>
              <div className={`flex gap-0.5 p-0.5 rounded-lg ${
                isDark ? 'bg-gray-800/50' : 'bg-white/80'
              }`}>
                <FavoriteButton
                  word={sentence.dictionary_form || sentence.japanese_base}
                  reading={sentence.reading || ''}
                  english={sentence.english}
                  partOfSpeech={sentence.word_type === 'verb' ? 'verb' : sentence.adjective_type || 'adjective'}
                />
                <WordNoteButton
                  word={sentence.dictionary_form || sentence.japanese_base}
                  reading={sentence.reading || ''}
                  english={sentence.english}
                  onPopupChange={setNotePopupOpen}
                />
              </div>
            </div>
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
              <AudioButton text={sentence.reading || sentence.japanese_base} size="sm" />
            </div>
            <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              ({sentence.english})
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Single word mode - wrapped in conjugate box */}
          <div className={`relative inline-block px-6 py-4 rounded-xl ${
            isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
          }`}>
            {/* Conjugate label with buttons inline */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                Conjugate this word:
              </span>
              <div className={`flex gap-0.5 p-0.5 rounded-lg ${
                isDark ? 'bg-gray-800/50' : 'bg-white/80'
              }`}>
                <FavoriteButton
                  word={sentence.dictionary_form || sentence.japanese_base}
                  reading={sentence.reading || ''}
                  english={sentence.english}
                  partOfSpeech={sentence.word_type === 'verb' ? 'verb' : sentence.adjective_type || 'adjective'}
                />
                <WordNoteButton
                  word={sentence.dictionary_form || sentence.japanese_base}
                  reading={sentence.reading || ''}
                  english={sentence.english}
                  onPopupChange={setNotePopupOpen}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {showFurigana && sentence.reading ? (
                <Furigana
                  text={sentence.japanese_base}
                  reading={sentence.reading}
                  showFurigana={showFurigana}
                  romaji={sentence.romaji}
                  showRomaji={showRomaji}
                  textClassName={`text-4xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}
                  furiganaClassName={`text-[0.5em] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                />
              ) : (
                <span className={`text-4xl font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  {sentence.japanese_base}
                </span>
              )}
              <AudioButton text={sentence.reading || sentence.japanese_base} size="lg" />
            </div>

            {/* Romaji (shown separately if no furigana) */}
            {showRomaji && sentence.romaji && !showFurigana && (
              <div className={`text-sm font-mono mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {sentence.romaji}
              </div>
            )}

            <span className={`text-sm mt-2 block ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              ({sentence.english})
            </span>
          </div>
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
