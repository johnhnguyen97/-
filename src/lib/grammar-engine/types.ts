/**
 * Gojun Grammar Engine - Type Definitions
 * The foundation for all grammar validation
 */

// ============================================
// VERB TYPES
// ============================================

export type VerbGroup = 'godan' | 'ichidan' | 'irregular-suru' | 'irregular-kuru';

export type GodanEnding = 'u' | 'ku' | 'gu' | 'su' | 'tsu' | 'nu' | 'bu' | 'mu' | 'ru';

export type ConjugationType =
  // Dictionary/Plain forms
  | 'dictionary'        // 食べる, 書く
  | 'negative'          // 食べない, 書かない
  | 'past'              // 食べた, 書いた
  | 'past_negative'     // 食べなかった, 書かなかった
  // Polite forms
  | 'masu'              // 食べます, 書きます
  | 'masen'             // 食べません, 書きません
  | 'mashita'           // 食べました, 書きました
  | 'masen_deshita'     // 食べませんでした, 書きませんでした
  // Te/Ta forms
  | 'te'                // 食べて, 書いて
  | 'ta'                // 食べた, 書いた (same as past)
  // Potential
  | 'potential'         // 食べられる, 書ける
  | 'potential_negative'// 食べられない, 書けない
  // Volitional
  | 'volitional'        // 食べよう, 書こう
  | 'volitional_polite' // 食べましょう, 書きましょう
  // Imperative
  | 'imperative'        // 食べろ, 書け
  | 'imperative_negative' // 食べるな, 書くな
  // Passive
  | 'passive'           // 食べられる, 書かれる
  | 'passive_negative'  // 食べられない, 書かれない
  // Causative
  | 'causative'         // 食べさせる, 書かせる
  | 'causative_negative'// 食べさせない, 書かせない
  | 'causative_passive' // 食べさせられる, 書かせられる
  // Conditional
  | 'conditional_ba'    // 食べれば, 書けば
  | 'conditional_tara'  // 食べたら, 書いたら
  // Desire
  | 'tai'               // 食べたい, 書きたい
  | 'tai_negative'      // 食べたくない, 書きたくない
  | 'tai_past'          // 食べたかった, 書きたかった
  // Progressive
  | 'te_iru'            // 食べている, 書いている
  | 'te_iru_negative'   // 食べていない, 書いていない
  ;

export interface Verb {
  id: string;
  dictionary_form: string;      // 食べる, 書く, する, 来る
  reading: string;              // たべる, かく, する, くる
  romaji: string;               // taberu, kaku, suru, kuru
  meaning: string;              // eat, write, do, come
  group: VerbGroup;
  godan_ending?: GodanEnding;   // Only for godan verbs
  jlpt_level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  is_transitive?: boolean;
  intransitive_pair?: string;   // ID of intransitive pair
  transitive_pair?: string;     // ID of transitive pair
  tags?: string[];              // ['common', 'formal', 'casual', etc.]
  conjugations: Record<ConjugationType, ConjugationResult>;
}

export interface ConjugationResult {
  kanji: string;        // 食べて
  reading: string;      // たべて
  romaji: string;       // tabete
}

// ============================================
// ADJECTIVE TYPES
// ============================================

export type AdjectiveType = 'i-adjective' | 'na-adjective' | 'irregular';

export type AdjectiveConjugationType =
  | 'dictionary'        // 高い, 静か
  | 'negative'          // 高くない, 静かじゃない
  | 'past'              // 高かった, 静かだった
  | 'past_negative'     // 高くなかった, 静かじゃなかった
  | 'te'                // 高くて, 静かで
  | 'adverb'            // 高く, 静かに
  | 'noun_modifier'     // 高い (+ noun), 静かな (+ noun)
  ;

export interface Adjective {
  id: string;
  dictionary_form: string;
  reading: string;
  romaji: string;
  meaning: string;
  type: AdjectiveType;
  jlpt_level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  conjugations: Record<AdjectiveConjugationType, ConjugationResult>;
}

// ============================================
// GRAMMAR TOPIC TYPES
// ============================================

export interface GrammarTopic {
  id: string;
  slug: string;                 // 'te-form', 'particle-wa'
  title: string;                // 'Te-form Conjugation'
  title_ja?: string;            // 'て形'
  jlpt_level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  category: GrammarCategory;
  summary?: string;
  sections: GrammarSection[];
  related_topics?: string[];    // IDs of related topics
  source_url?: string;
}

export type GrammarCategory =
  | 'verb-conjugation'
  | 'adjective-conjugation'
  | 'particles'
  | 'sentence-patterns'
  | 'expressions'
  | 'keigo'
  | 'conditionals'
  | 'giving-receiving'
  | 'quotation'
  | 'comparison'
  | 'other'
  ;

export interface GrammarSection {
  level: number;                // 2, 3, 4 (heading level)
  heading: string;
  content: string;
  children?: GrammarSection[];
  examples?: GrammarExample[];
}

export interface GrammarExample {
  japanese: string;
  reading?: string;
  english: string;
  notes?: string;
}

// ============================================
// SENTENCE TYPES
// ============================================

export interface Sentence {
  id: string;
  japanese: string;
  reading: string;
  romaji: string;
  english: string;
  context: SentenceContext;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  jlpt_level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  grammar_points: string[];     // IDs of grammar topics used
  verbs_used: string[];         // IDs of verbs used
  tags?: string[];
  notes?: string;
}

export type SentenceContext =
  | 'daily-life'
  | 'food-dining'
  | 'travel'
  | 'business'
  | 'family'
  | 'health-exercise'
  | 'shopping'
  | 'school'
  | 'hobbies'
  | 'weather'
  | 'emotions'
  | 'directions'
  | 'time'
  | 'introductions'
  | 'requests'
  | 'opinions'
  ;

// ============================================
// VALIDATION TYPES
// ============================================

export interface ValidationResult {
  isValid: boolean;
  input: string;
  expected?: string;
  corrected?: string;
  errors: ValidationError[];
}

export interface ValidationError {
  type: 'conjugation' | 'particle' | 'word-order' | 'unknown-word';
  message: string;
  position?: { start: number; end: number };
  suggestion?: string;
}

// ============================================
// ENGINE CONFIG
// ============================================

export interface GrammarEngineConfig {
  strictMode: boolean;          // If true, reject any invalid grammar
  autoCorrect: boolean;         // If true, auto-correct mistakes
  logErrors: boolean;           // If true, log validation errors
}
