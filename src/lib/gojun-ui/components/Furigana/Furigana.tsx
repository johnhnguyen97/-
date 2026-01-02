/**
 * Furigana Component
 * Ruby text component for displaying readings above Japanese kanji
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface FuriganaProps {
  /** The main text (typically kanji) */
  text: string;
  /** The reading/pronunciation (hiragana/katakana) */
  reading: string;
  /** Whether to show the furigana reading */
  show?: boolean;
  /** Size of the furigana text relative to main text */
  size?: 'xs' | 'sm' | 'md';
  /** Additional class name */
  className?: string;
}

const sizeClasses = {
  xs: 'text-[0.5em]',
  sm: 'text-[0.6em]',
  md: 'text-[0.7em]',
};

export const Furigana: React.FC<FuriganaProps> = ({
  text,
  reading,
  show = true,
  size = 'sm',
  className,
}) => {
  // If reading matches text exactly, no need for furigana
  // Or if show is false, just render the text
  if (!show || text === reading) {
    return <span className={className}>{text}</span>;
  }

  return (
    <ruby className={cn('ruby-annotation', className)}>
      {text}
      <rp>(</rp>
      <rt className={cn(sizeClasses[size], 'text-gray-500 font-normal')}>
        {reading}
      </rt>
      <rp>)</rp>
    </ruby>
  );
};

/**
 * FuriganaText Component
 * Parses a string with furigana notation and renders it with ruby text
 *
 * Notation: {kanji|reading} or [kanji](reading)
 * Example: "{食|た}べる" or "[食](た)べる" → 食(た)べる
 */
export interface FuriganaTextProps {
  /** Text with furigana notation: {kanji|reading} or [kanji](reading) */
  text: string;
  /** Whether to show furigana */
  show?: boolean;
  /** Size of the furigana text */
  size?: 'xs' | 'sm' | 'md';
  /** Additional class name */
  className?: string;
}

export const FuriganaText: React.FC<FuriganaTextProps> = ({
  text,
  show = true,
  size = 'sm',
  className,
}) => {
  // Parse {kanji|reading} or [kanji](reading) patterns
  const parts = parseFuriganaNotation(text);

  return (
    <span className={className}>
      {parts.map((part, index) => (
        part.type === 'ruby' ? (
          <Furigana
            key={index}
            text={part.text}
            reading={part.reading!}
            show={show}
            size={size}
          />
        ) : (
          <span key={index}>{part.text}</span>
        )
      ))}
    </span>
  );
};

interface ParsedPart {
  type: 'text' | 'ruby';
  text: string;
  reading?: string;
}

function parseFuriganaNotation(input: string): ParsedPart[] {
  const parts: ParsedPart[] = [];

  // Match {kanji|reading} or [kanji](reading)
  const regex = /\{([^|]+)\|([^}]+)\}|\[([^\]]+)\]\(([^)]+)\)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(input)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        text: input.slice(lastIndex, match.index),
      });
    }

    // Add ruby text
    const kanji = match[1] || match[3];
    const reading = match[2] || match[4];
    parts.push({
      type: 'ruby',
      text: kanji,
      reading,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < input.length) {
    parts.push({
      type: 'text',
      text: input.slice(lastIndex),
    });
  }

  return parts;
}

export default Furigana;
