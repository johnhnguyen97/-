import React from 'react';

interface FuriganaProps {
  /** The text to display (usually kanji) */
  text: string;
  /** The reading/pronunciation (usually hiragana) */
  reading?: string;
  /** Whether to show furigana above the text */
  showFurigana?: boolean;
  /** Optional romaji to display below */
  romaji?: string;
  /** Whether to show romaji */
  showRomaji?: boolean;
  /** Additional class names for the container */
  className?: string;
  /** Class names for the main text */
  textClassName?: string;
  /** Class names for the furigana */
  furiganaClassName?: string;
  /** Class names for the romaji */
  romajiClassName?: string;
}

/**
 * Furigana component - displays Japanese text with optional ruby annotations
 * for readings (furigana) above and romaji below.
 *
 * Uses HTML <ruby> elements for semantic furigana display.
 */
export const Furigana: React.FC<FuriganaProps> = ({
  text,
  reading,
  showFurigana = true,
  romaji,
  showRomaji = false,
  className = '',
  textClassName = '',
  furiganaClassName = 'text-[0.6em] text-gray-500',
  romajiClassName = 'text-xs text-gray-400 mt-0.5',
}) => {
  // If no furigana needed or text equals reading, just render text
  const shouldShowFurigana = showFurigana && reading && text !== reading;
  const shouldShowRomaji = showRomaji && romaji;

  if (!shouldShowFurigana && !shouldShowRomaji) {
    return <span className={`${className} ${textClassName}`}>{text}</span>;
  }

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      {shouldShowFurigana ? (
        <ruby className="ruby-container">
          <span className={textClassName}>{text}</span>
          <rp>(</rp>
          <rt className={furiganaClassName}>{reading}</rt>
          <rp>)</rp>
        </ruby>
      ) : (
        <span className={textClassName}>{text}</span>
      )}
      {shouldShowRomaji && (
        <span className={romajiClassName}>{romaji}</span>
      )}
    </span>
  );
};

/**
 * Parse a word and its reading to create furigana segments.
 * This is useful for complex words where only some kanji need readings.
 *
 * @example
 * // For 食べる (たべる), only 食 needs furigana
 * parseFuriganaSegments('食べる', 'たべる')
 * // Returns: [{ text: '食', reading: 'た' }, { text: 'べる', reading: '' }]
 */
export function parseFuriganaSegments(
  text: string,
  reading: string
): Array<{ text: string; reading: string }> {
  // Simple implementation - treats entire text as one segment
  // A more sophisticated version would analyze kanji boundaries
  if (!reading || text === reading) {
    return [{ text, reading: '' }];
  }

  return [{ text, reading }];
}

/**
 * Check if a character is kanji (CJK Unified Ideographs range)
 */
export function isKanji(char: string): boolean {
  const code = char.charCodeAt(0);
  // CJK Unified Ideographs range
  return (code >= 0x4E00 && code <= 0x9FFF) ||
         // CJK Unified Ideographs Extension A
         (code >= 0x3400 && code <= 0x4DBF);
}

/**
 * Check if a string contains any kanji
 */
export function containsKanji(text: string): boolean {
  for (const char of text) {
    if (isKanji(char)) return true;
  }
  return false;
}

export default Furigana;
