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
 * for readings (furigana) above kanji characters only.
 *
 * Uses HTML <ruby> elements for semantic furigana display.
 * Smart parsing ensures furigana only appears above kanji, not hiragana/katakana.
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

  // Parse text into segments with smart furigana placement
  const segments = shouldShowFurigana
    ? parseFuriganaSegments(text, reading || '')
    : [{ text, reading: '' }];

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <span className={textClassName}>
        {segments.map((segment, index) => (
          segment.reading ? (
            <ruby key={index} className="ruby-container">
              {segment.text}
              <rp>(</rp>
              <rt className={furiganaClassName}>{segment.reading}</rt>
              <rp>)</rp>
            </ruby>
          ) : (
            <span key={index}>{segment.text}</span>
          )
        ))}
      </span>
      {shouldShowRomaji && (
        <span className={romajiClassName}>{romaji}</span>
      )}
    </span>
  );
};

/**
 * Check if a character is hiragana
 */
export function isHiragana(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x3040 && code <= 0x309F;
}

/**
 * Check if a character is katakana
 */
export function isKatakana(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x30A0 && code <= 0x30FF;
}

/**
 * Parse a word and its reading to create furigana segments.
 * Only kanji characters get furigana - hiragana/katakana are shown as-is.
 *
 * @example
 * parseFuriganaSegments('食べる', 'たべる')
 * // Returns: [{ text: '食', reading: 'た' }, { text: 'べる', reading: '' }]
 *
 * parseFuriganaSegments('来ます', 'きます')
 * // Returns: [{ text: '来', reading: 'き' }, { text: 'ます', reading: '' }]
 *
 * parseFuriganaSegments('来ませんでした', 'きませんでした')
 * // Returns: [{ text: '来', reading: 'き' }, { text: 'ませんでした', reading: '' }]
 */
export function parseFuriganaSegments(
  text: string,
  reading: string
): Array<{ text: string; reading: string }> {
  // If no reading or text equals reading, no furigana needed
  if (!reading || text === reading) {
    return [{ text, reading: '' }];
  }

  // If text is all hiragana/katakana, no furigana needed
  if (!containsKanji(text)) {
    return [{ text, reading: '' }];
  }

  const segments: Array<{ text: string; reading: string }> = [];

  // Find trailing kana in text that matches trailing kana in reading
  let textIndex = text.length - 1;
  let readingIndex = reading.length - 1;
  let trailingKana = '';

  // Match trailing hiragana/katakana from end
  while (textIndex >= 0 && readingIndex >= 0) {
    const textChar = text[textIndex];
    const readingChar = reading[readingIndex];

    // If text char is hiragana/katakana and matches reading
    if ((isHiragana(textChar) || isKatakana(textChar)) && textChar === readingChar) {
      trailingKana = textChar + trailingKana;
      textIndex--;
      readingIndex--;
    } else {
      break;
    }
  }

  // Find leading kana in text that matches leading kana in reading
  let leadingKana = '';
  let leadTextIndex = 0;
  let leadReadIndex = 0;

  while (leadTextIndex <= textIndex && leadReadIndex <= readingIndex) {
    const textChar = text[leadTextIndex];
    const readingChar = reading[leadReadIndex];

    if ((isHiragana(textChar) || isKatakana(textChar)) && textChar === readingChar) {
      leadingKana += textChar;
      leadTextIndex++;
      leadReadIndex++;
    } else {
      break;
    }
  }

  // Build segments
  if (leadingKana) {
    segments.push({ text: leadingKana, reading: '' });
  }

  // Middle part (kanji with furigana)
  const kanjiPart = text.substring(leadTextIndex, textIndex + 1);
  const kanjiReading = reading.substring(leadReadIndex, readingIndex + 1);

  if (kanjiPart) {
    segments.push({ text: kanjiPart, reading: kanjiReading });
  }

  if (trailingKana) {
    segments.push({ text: trailingKana, reading: '' });
  }

  // If we couldn't parse it properly, fall back to simple mode
  if (segments.length === 0) {
    return [{ text, reading }];
  }

  return segments;
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
