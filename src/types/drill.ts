// Pattern Drill Types

export type VerbConjugationType =
  | 'present_positive'
  | 'present_negative'
  | 'past_positive'
  | 'past_negative'
  | 'te_form'
  | 'tai_form'
  | 'potential';

export type AdjectiveConjugationType =
  | 'present_positive'
  | 'present_negative'
  | 'past_positive'
  | 'past_negative';

export type ConjugationType = VerbConjugationType | AdjectiveConjugationType;
export type VerbGroup = 'group1' | 'group2' | 'group3';
export type AdjectiveType = 'i_adjective' | 'na_adjective';
export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type WordType = 'verb' | 'adjective';

export interface DrillConjugation {
  japanese: string;
  reading: string;
  romaji: string;
}

export interface DrillSentence {
  id: string;
  japanese_base: string;
  english: string;
  word_type: WordType;
  verb_group?: VerbGroup;
  adjective_type?: AdjectiveType;
  jlpt_level: JLPTLevel;
  conjugations: Record<string, DrillConjugation>;
  created_at?: string;
}

export interface DrillPrompt {
  id: string;
  from_form: string;
  to_form: string;
  prompt_en: string;
  prompt_jp: string;
  explanation: string;
  word_type: 'verb' | 'adjective' | 'both';
  phase: 1 | 2 | 3;
  created_at?: string;
}

export interface UserDrillAccuracy {
  id: string;
  user_id: string;
  category: string;
  correct_count: number;
  total_count: number;
  last_practiced: string;
  created_at: string;
  updated_at: string;
}

export interface MCOption {
  id: string;
  text: string;
  reading: string;
  isCorrect: boolean;
  english?: string;
}

export interface ExampleSentence {
  id: string;
  japanese: string;
  english: string;
  word_key: string;
  word_reading: string;
  tatoeba_id: number;
  jlpt_level: string;
}

export type DrillPracticeMode = 'word' | 'sentence';

export interface DrillSettings {
  mode: 'typing' | 'multiple_choice';
  practiceMode: DrillPracticeMode;
  bidirectional: boolean;
  selectedPhases: number[];
  selectedWordTypes: WordType[];
  jlptLevel: JLPTLevel;
  questionsPerSession: number;
}

export interface DrillSessionStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  categoryStats: Record<string, { correct: number; total: number }>;
}

export interface DrillQuestionState {
  sentence: DrillSentence;
  prompt: DrillPrompt;
  correctAnswer: DrillConjugation;
  mcOptions?: MCOption[];
  practiceMode?: DrillPracticeMode;
  exampleSentence?: ExampleSentence;
}

export interface DrillGameState {
  status: 'loading' | 'playing' | 'answered' | 'complete';
  questions: DrillQuestionState[];
  currentIndex: number;
  userAnswer: string;
  isCorrect: boolean | null;
  sessionStats: DrillSessionStats;
  settings: DrillSettings;
}

export const DEFAULT_DRILL_SETTINGS: DrillSettings = {
  mode: 'multiple_choice',
  practiceMode: 'word',
  bidirectional: false,
  selectedPhases: [1],
  selectedWordTypes: ['verb'],
  jlptLevel: 'N5',
  questionsPerSession: 10,
};

export function getDrillCategory(
  wordType: WordType,
  fromForm: string,
  toForm: string
): string {
  return `${wordType}_${fromForm}_to_${toForm}`;
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .replace(/\s+/g, '')
    .replace(/です$/, '')
    .toLowerCase();
}

export function checkAnswer(
  userAnswer: string,
  correctAnswer: DrillConjugation
): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer.japanese);
  const normalizedReading = normalizeAnswer(correctAnswer.reading);
  return normalizedUser === normalizedCorrect || normalizedUser === normalizedReading;
}
