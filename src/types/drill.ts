// Pattern Drill Types

// ============================================================================
// CONJUGATION TYPES - Expanded to 25+ forms
// ============================================================================

export type VerbConjugationType =
  // Polite (ます) forms - Phase 1
  | 'masu_positive'           // 食べます
  | 'masu_negative'           // 食べません
  | 'masu_past_positive'      // 食べました
  | 'masu_past_negative'      // 食べませんでした
  // Plain (dictionary) forms - Phase 2
  | 'plain_positive'          // 食べる (dictionary form)
  | 'plain_negative'          // 食べない
  | 'plain_past_positive'     // 食べた
  | 'plain_past_negative'     // 食べなかった
  // Te-form - Phase 3
  | 'te_form'                 // 食べて
  | 'te_iru'                  // 食べている (progressive)
  // Desire forms - Phase 4
  | 'tai_form'                // 食べたい
  | 'tai_negative'            // 食べたくない
  | 'tai_past'                // 食べたかった
  // Volitional (意志形) - Phase 4
  | 'volitional'              // 食べよう
  | 'volitional_polite'       // 食べましょう
  // Potential (可能形) - Phase 5
  | 'potential_positive'      // 食べられる
  | 'potential_negative'      // 食べられない
  // Conditional (条件形) - Phase 6
  | 'conditional_ba'          // 食べれば
  | 'conditional_tara'        // 食べたら
  | 'conditional_to'          // 食べると
  | 'conditional_nara'        // 食べるなら
  // Passive (受身形) - Phase 7
  | 'passive_positive'        // 食べられる
  | 'passive_negative'        // 食べられない
  // Causative (使役形) - Phase 7
  | 'causative_positive'      // 食べさせる
  | 'causative_negative'      // 食べさせない
  | 'causative_passive'       // 食べさせられる
  // Imperative (命令形) - Phase 8
  | 'imperative'              // 食べろ / 食べよ
  | 'imperative_negative';    // 食べるな

// Legacy aliases for backward compatibility
export type LegacyVerbConjugationType =
  | 'present_positive'   // → masu_positive
  | 'present_negative'   // → masu_negative
  | 'past_positive'      // → masu_past_positive
  | 'past_negative'      // → masu_past_negative
  | 'te_form'
  | 'tai_form'
  | 'potential';         // → potential_positive

export type AdjectiveConjugationType =
  // い-adjective forms
  | 'present_positive'        // 高い
  | 'present_negative'        // 高くない
  | 'past_positive'           // 高かった
  | 'past_negative'           // 高くなかった
  | 'te_form'                 // 高くて
  | 'adverb'                  // 高く
  // な-adjective forms
  | 'na_present_positive'     // 静かだ / 静かです
  | 'na_present_negative'     // 静かじゃない
  | 'na_past_positive'        // 静かだった
  | 'na_past_negative'        // 静かじゃなかった
  | 'na_te_form';             // 静かで

export type ConjugationType = VerbConjugationType | AdjectiveConjugationType | LegacyVerbConjugationType;
export type VerbGroup = 'group1' | 'group2' | 'group3';
export type AdjectiveType = 'i_adjective' | 'na_adjective';
export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type WordType = 'verb' | 'adjective';

// ============================================================================
// CONJUGATION PHASES - Progressive learning structure
// ============================================================================

export interface ConjugationPhase {
  id: number;
  name: string;
  nameJp: string;
  description: string;
  forms: VerbConjugationType[];
  jlptLevels: JLPTLevel[];
}

export const CONJUGATION_PHASES: ConjugationPhase[] = [
  {
    id: 1,
    name: 'Basic Polite',
    nameJp: '丁寧形',
    description: 'Present/past polite forms (ます)',
    forms: ['masu_positive', 'masu_negative', 'masu_past_positive', 'masu_past_negative'],
    jlptLevels: ['N5'],
  },
  {
    id: 2,
    name: 'Plain Forms',
    nameJp: '普通形',
    description: 'Dictionary and plain conjugations',
    forms: ['plain_positive', 'plain_negative', 'plain_past_positive', 'plain_past_negative'],
    jlptLevels: ['N5', 'N4'],
  },
  {
    id: 3,
    name: 'Te-form & Progressive',
    nameJp: 'て形',
    description: 'Te-form and ongoing actions',
    forms: ['te_form', 'te_iru'],
    jlptLevels: ['N5', 'N4'],
  },
  {
    id: 4,
    name: 'Desire & Volitional',
    nameJp: '願望・意志',
    description: 'Want to do, let\'s do',
    forms: ['tai_form', 'tai_negative', 'tai_past', 'volitional', 'volitional_polite'],
    jlptLevels: ['N4'],
  },
  {
    id: 5,
    name: 'Potential',
    nameJp: '可能形',
    description: 'Can do / able to',
    forms: ['potential_positive', 'potential_negative'],
    jlptLevels: ['N4'],
  },
  {
    id: 6,
    name: 'Conditional',
    nameJp: '条件形',
    description: 'If/when forms (-ば, -たら, -と, -なら)',
    forms: ['conditional_ba', 'conditional_tara', 'conditional_to', 'conditional_nara'],
    jlptLevels: ['N4', 'N3'],
  },
  {
    id: 7,
    name: 'Passive & Causative',
    nameJp: '受身・使役',
    description: 'Passive and causative forms',
    forms: ['passive_positive', 'passive_negative', 'causative_positive', 'causative_negative', 'causative_passive'],
    jlptLevels: ['N3', 'N2'],
  },
  {
    id: 8,
    name: 'Imperative',
    nameJp: '命令形',
    description: 'Command forms',
    forms: ['imperative', 'imperative_negative'],
    jlptLevels: ['N3'],
  },
];

// Human-readable form names
export const FORM_DISPLAY_NAMES: Record<string, { en: string; jp: string }> = {
  // Polite forms
  masu_positive: { en: 'Polite Present', jp: 'ます形' },
  masu_negative: { en: 'Polite Negative', jp: 'ません形' },
  masu_past_positive: { en: 'Polite Past', jp: 'ました形' },
  masu_past_negative: { en: 'Polite Past Negative', jp: 'ませんでした形' },
  // Plain forms
  plain_positive: { en: 'Dictionary Form', jp: '辞書形' },
  plain_negative: { en: 'Plain Negative', jp: 'ない形' },
  plain_past_positive: { en: 'Plain Past', jp: 'た形' },
  plain_past_negative: { en: 'Plain Past Negative', jp: 'なかった形' },
  // Te-form
  te_form: { en: 'Te-form', jp: 'て形' },
  te_iru: { en: 'Progressive', jp: 'ている形' },
  // Desire
  tai_form: { en: 'Want to (~tai)', jp: 'たい形' },
  tai_negative: { en: 'Don\'t want to', jp: 'たくない形' },
  tai_past: { en: 'Wanted to', jp: 'たかった形' },
  // Volitional
  volitional: { en: 'Volitional (Let\'s)', jp: '意志形' },
  volitional_polite: { en: 'Polite Volitional', jp: 'ましょう形' },
  // Potential
  potential_positive: { en: 'Potential (Can)', jp: '可能形' },
  potential_negative: { en: 'Cannot', jp: '可能否定形' },
  // Conditional
  conditional_ba: { en: 'Conditional (-ba)', jp: 'ば形' },
  conditional_tara: { en: 'Conditional (-tara)', jp: 'たら形' },
  conditional_to: { en: 'Conditional (-to)', jp: 'と形' },
  conditional_nara: { en: 'Conditional (-nara)', jp: 'なら形' },
  // Passive
  passive_positive: { en: 'Passive', jp: '受身形' },
  passive_negative: { en: 'Passive Negative', jp: '受身否定形' },
  // Causative
  causative_positive: { en: 'Causative', jp: '使役形' },
  causative_negative: { en: 'Causative Negative', jp: '使役否定形' },
  causative_passive: { en: 'Causative-Passive', jp: '使役受身形' },
  // Imperative
  imperative: { en: 'Imperative (Command)', jp: '命令形' },
  imperative_negative: { en: 'Negative Command', jp: '禁止形' },
  // Legacy (backward compatibility)
  present_positive: { en: 'Polite Present', jp: 'ます形' },
  present_negative: { en: 'Polite Negative', jp: 'ません形' },
  past_positive: { en: 'Polite Past', jp: 'ました形' },
  past_negative: { en: 'Polite Past Negative', jp: 'ませんでした形' },
  potential: { en: 'Potential', jp: '可能形' },
};

// Verb group display names
export const VERB_GROUP_NAMES: Record<VerbGroup, { en: string; jp: string; short: string }> = {
  group1: { en: 'Godan (U-verbs)', jp: '五段動詞', short: 'Godan' },
  group2: { en: 'Ichidan (Ru-verbs)', jp: '一段動詞', short: 'Ichidan' },
  group3: { en: 'Irregular', jp: '不規則動詞', short: 'Irregular' },
};

// ============================================================================
// DATA INTERFACES
// ============================================================================

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
  // New fields for enhanced display
  dictionary_form?: string;
  reading?: string;
  romaji?: string;
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
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
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

// ============================================================================
// SETTINGS
// ============================================================================

export const DRILL_SETTINGS_KEY = 'gojun-drill-settings';

export interface DrillSettings {
  mode: 'typing' | 'multiple_choice';
  practiceMode: DrillPracticeMode;
  bidirectional: boolean;
  selectedPhases: number[];
  selectedWordTypes: WordType[];
  jlptLevel: JLPTLevel;
  questionsPerSession: number;
  // New display options
  showFurigana: boolean;
  showRomaji: boolean;
  showGrammarTips: boolean;
}

export const DEFAULT_DRILL_SETTINGS: DrillSettings = {
  mode: 'multiple_choice',
  practiceMode: 'word',
  bidirectional: false,
  selectedPhases: [1],
  selectedWordTypes: ['verb'],
  jlptLevel: 'N5',
  questionsPerSession: 10,
  // New defaults
  showFurigana: true,
  showRomaji: false,
  showGrammarTips: true,
};

// ============================================================================
// GAME STATE
// ============================================================================

export interface DrillSessionStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  accuracy: number;
  categoryStats: Record<string, { correct: number; total: number }>;
  // Per-question results for segmented progress bar
  questionResults: Array<{ correct: boolean; skipped: boolean }>;
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
  isSkipped: boolean;
  sessionStats: DrillSessionStats;
  settings: DrillSettings;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

export function getFormDisplayName(form: string, language: 'en' | 'jp' = 'en'): string {
  const names = FORM_DISPLAY_NAMES[form];
  if (!names) return form;
  return language === 'en' ? names.en : names.jp;
}

export function getVerbGroupDisplayName(
  group: VerbGroup,
  format: 'full' | 'short' = 'full',
  language: 'en' | 'jp' = 'en'
): string {
  const names = VERB_GROUP_NAMES[group];
  if (!names) return group;
  if (format === 'short') return names.short;
  return language === 'en' ? names.en : names.jp;
}

// Map legacy form names to new names
export function mapLegacyFormName(form: string): string {
  const legacyMap: Record<string, string> = {
    present_positive: 'masu_positive',
    present_negative: 'masu_negative',
    past_positive: 'masu_past_positive',
    past_negative: 'masu_past_negative',
    potential: 'potential_positive',
  };
  return legacyMap[form] || form;
}
