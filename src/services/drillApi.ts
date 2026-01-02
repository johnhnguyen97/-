import type {
  DrillSentence,
  DrillPrompt,
  DrillConjugation,
  MCOption,
  ExampleSentence,
  DrillPracticeMode,
  WordType,
  JLPTLevel,
} from '../types/drill';
import { validateConjugation, type ValidationResult } from './grammarEngine';

export interface VerbInfo {
  dictionary_form: string;
  reading: string;
  meaning: string;
  verb_group: string;
  is_transitive: boolean | null;
}

export interface DrillQuestion {
  sentence: DrillSentence;
  prompt: DrillPrompt;
  correctAnswer: DrillConjugation;
  mcOptions?: MCOption[];
  practiceMode?: DrillPracticeMode;
  exampleSentence?: ExampleSentence;
  verbInfo?: VerbInfo;
}

export interface DrillSessionResponse {
  questions: DrillQuestion[];
  meta?: {
    source: string;
    totalVerbs: number;
    totalCombinations: number;
    requestedCount: number;
    actualCount: number;
    jlptLevel: string;
    phases: number[];
  };
}

export interface DrillSessionParams {
  phases: number[];
  jlptLevel: JLPTLevel;
  wordTypes: WordType[];
  count: number;
  practiceMode: DrillPracticeMode;
  bidirectional: boolean;
}

/**
 * Fetch drill session from API (now powered by grammar engine)
 */
export async function getDrillSession(
  accessToken: string,
  params: DrillSessionParams
): Promise<DrillSessionResponse> {
  const searchParams = new URLSearchParams({
    phases: params.phases.join(','),
    jlptLevel: params.jlptLevel,
    wordTypes: params.wordTypes.join(','),
    count: String(params.count),
    practiceMode: params.practiceMode,
    bidirectional: String(params.bidirectional),
  });

  const response = await fetch(`/api/drill?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch drill session: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    questions: data.questions || [],
    meta: data.meta,
  };
}

/**
 * Validate user answer using grammar engine
 * This provides authoritative validation against the database
 */
export async function validateAnswer(
  dictionaryForm: string,
  targetForm: string,
  userInput: string
): Promise<ValidationResult> {
  return validateConjugation(dictionaryForm, targetForm, userInput);
}

/**
 * Check if answer is correct (local check for immediate feedback)
 * For authoritative validation, use validateAnswer()
 */
export function checkAnswerLocal(
  userAnswer: string,
  correctAnswer: DrillConjugation
): boolean {
  const normalize = (s: string) => s.trim().replace(/\s+/g, '').toLowerCase();
  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer.japanese);
  const normalizedReading = normalize(correctAnswer.reading);
  const normalizedRomaji = normalize(correctAnswer.romaji || '');

  return (
    normalizedUser === normalizedCorrect ||
    normalizedUser === normalizedReading ||
    normalizedUser === normalizedRomaji
  );
}

/**
 * Update user accuracy stats
 */
export async function updateUserAccuracy(
  accessToken: string,
  results: Array<{ category: string; correct: boolean }>
): Promise<void> {
  // This endpoint may not exist anymore - stats are now tracked via userStatsApi
  try {
    const response = await fetch('/api/drill-accuracy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ results }),
    });

    if (!response.ok) {
      console.warn('Accuracy tracking endpoint not available');
    }
  } catch {
    // Silently fail - main stats are tracked elsewhere
  }
}

// Re-export grammar engine functions for convenience
export {
  validateConjugation,
  getVerb,
  getConjugation,
  listVerbs,
  getRandomDrill,
  batchValidate,
  checkAndCorrectAI,
  quickConjugate,
  CONJUGATION_LABELS,
  VERB_GROUP_LABELS,
} from './grammarEngine';
