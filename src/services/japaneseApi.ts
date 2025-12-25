import type { JapaneseWord, ParsedWord, GrammarNote } from '../types';

export interface SentenceTranslation {
  fullTranslation: string;
  wordOrder: string[];
  wordOrderDisplay: string;
  words: JapaneseWord[];
  grammarNotes?: GrammarNote[];
}

/**
 * Translates an entire sentence using AI for natural Japanese
 * Requires authentication - pass the session access token
 */
export async function translateSentence(
  sentence: string,
  parsedWords: ParsedWord[],
  accessToken: string
): Promise<SentenceTranslation> {
  const response = await fetch('/api/translate-sentence', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ sentence, parsedWords }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Translation failed');
  }

  return response.json();
}
