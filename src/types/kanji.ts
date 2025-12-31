// Kanji/Radical Learning System Types

// ============================================
// JLPT Levels
// ============================================
export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// ============================================
// Radical Types
// ============================================
export type RadicalPosition =
  | 'hen'       // left side (偏)
  | 'tsukuri'   // right side (旁)
  | 'kanmuri'   // top (冠)
  | 'ashi'      // bottom (脚)
  | 'tare'      // top-left enclosure (垂)
  | 'nyou'      // bottom-left enclosure (繞)
  | 'kamae'     // enclosure (構)
  | 'other';

export interface Radical {
  id: string;
  radicalNumber: number;
  character: string;
  nameEn: string;
  nameJp?: string;
  strokeCount: number;
  meaning?: string;
  position?: RadicalPosition;
  soundHint?: string;      // phonetic pattern this radical indicates
  svgUrl?: string;
  animationUrl?: string;
}

export interface RadicalWithKanji extends Radical {
  kanjiCount: number;
  kanjiList: KanjiSummary[];
}

// ============================================
// Kanji Types
// ============================================
export interface KanjiExample {
  word: string;
  reading: string;
  meaning: string;
  audioUrl?: string;
}

export interface RadicalInfo {
  radical: Radical;
  isPrimary: boolean;
  position?: string;
}

export interface KanjiSummary {
  id: string;
  character: string;
  strokeCount: number;
  jlptLevel?: JLPTLevel;
  meaningEn: string;
  onyomi?: string;
  kunyomi?: string;
}

export interface Kanji extends KanjiSummary {
  unicode?: string;
  grade?: number;
  onyomiRomaji?: string;
  kunyomiRomaji?: string;
  radicalNumber?: number;
  radicalMeaning?: string;
  radicals?: RadicalInfo[];
  videoUrl?: string;
  audioOnyomiUrl?: string;
  audioKunyomiUrl?: string;
  strokeOrderImages?: string[];
  examples?: KanjiExample[];
}

export interface KanjiDetail extends Kanji {
  radicals: RadicalInfo[];
  relatedKanji?: KanjiSummary[];  // kanji with same radical
}

// ============================================
// User Progress Types
// ============================================
export type KanjiStatus = 'new' | 'learning' | 'known' | 'mastered';

export interface UserKanjiProgress {
  id: string;
  userId: string;
  kanjiId: string;
  kanji?: Kanji;
  status: KanjiStatus;
  correctCount: number;
  incorrectCount: number;
  lastPracticed?: string;
  nextReview?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSavedKanji {
  id: string;
  userId: string;
  kanjiId: string;
  kanji?: Kanji;
  note?: string;
  folder: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Radical Drill Types
// ============================================
export type RadicalDrillType =
  | 'identify_radical'    // Given kanji, identify the main radical
  | 'find_kanji'          // Given radical, find kanji containing it
  | 'sound_pattern'       // Match radicals to sound hints
  | 'radical_meaning'     // Match radical to its meaning
  | 'kanji_components';   // Break down kanji into components

export interface MCOption {
  id: string;
  text: string;
  isCorrect: boolean;
  subText?: string;  // e.g., meaning or reading
}

export interface RadicalDrillQuestion {
  id: string;
  type: RadicalDrillType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  jlptLevel?: JLPTLevel;
  radical?: Radical;
  kanji?: Kanji;
  questionText: string;
  correctAnswer: string;
  correctAnswerDisplay?: string;  // formatted display version
  options: MCOption[];
  explanation?: string;
}

export interface RadicalDrillSettings {
  mode: 'multiple_choice' | 'typing';
  questionTypes: RadicalDrillType[];
  jlptLevel: JLPTLevel;
  difficulty: 1 | 2 | 3 | 4 | 5;
  questionsPerSession: number;
}

export const DEFAULT_RADICAL_DRILL_SETTINGS: RadicalDrillSettings = {
  mode: 'multiple_choice',
  questionTypes: ['identify_radical', 'find_kanji', 'radical_meaning'],
  jlptLevel: 'N5',
  difficulty: 1,
  questionsPerSession: 10,
};

export interface RadicalDrillStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  typeStats: Record<RadicalDrillType, { correct: number; total: number }>;
}

export interface RadicalDrillAccuracy {
  id: string;
  userId: string;
  drillType: RadicalDrillType;
  correctCount: number;
  totalCount: number;
  lastPracticed?: string;
}

// ============================================
// Kanji Alive API Types
// ============================================
export interface KanjiAliveKanji {
  character: string;
  meaning: {
    english: string;
  };
  strokes: {
    count: number;
    images: string[];
  };
  onyomi: {
    romaji: string;
    katakana: string;
  };
  kunyomi: {
    romaji: string;
    hiragana: string;
  };
  video: {
    mp4: string;
    poster: string;
  };
  audio: {
    mp3: string;
  };
}

export interface KanjiAliveRadical {
  character: string;
  strokes: number;
  image: string;
  position: {
    hiragana: string;
    romaji: string;
    icon: string;
  };
  name: {
    hiragana: string;
    romaji: string;
  };
  meaning: {
    english: string;
  };
  animation: string[];
}

export interface KanjiAliveExample {
  japanese: string;
  meaning: {
    english: string;
  };
  audio: {
    mp3: string;
  };
}

export interface KanjiAliveResponse {
  kanji: KanjiAliveKanji;
  radical: KanjiAliveRadical;
  references: {
    grade: number;
    kodansha: string;
    classic_nelson: string;
  };
  examples: KanjiAliveExample[];
}

export interface KanjiAliveSearchResult {
  kanji: {
    character: string;
    stroke: number;
  };
  radical: {
    character: string;
    stroke: number;
  };
}

// ============================================
// Search & Filter Types
// ============================================
export interface KanjiSearchParams {
  query?: string;           // search term (kanji, reading, meaning)
  jlptLevel?: JLPTLevel;
  strokeCount?: number;
  radicalNumber?: number;
  grade?: number;
  limit?: number;
  offset?: number;
}

export interface KanjiSearchResult {
  kanji: KanjiSummary[];
  total: number;
  hasMore: boolean;
}

export interface RadicalSearchParams {
  strokeCount?: number;
  position?: RadicalPosition;
  limit?: number;
}

// ============================================
// UI State Types
// ============================================
export type KanjiPageTab = 'dictionary' | 'radicals' | 'drill';

export interface KanjiDetailModalState {
  isOpen: boolean;
  kanji: KanjiDetail | null;
}

export interface RadicalDetailModalState {
  isOpen: boolean;
  radical: RadicalWithKanji | null;
}

// ============================================
// Helper Functions
// ============================================
export function formatReading(reading: string | undefined): string {
  return reading?.split(',').join('、') || '';
}

export function getJlptColor(level: JLPTLevel | undefined): string {
  switch (level) {
    case 'N5': return 'bg-green-100 text-green-700 border-green-200';
    case 'N4': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'N3': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'N2': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'N1': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getStatusColor(status: KanjiStatus): string {
  switch (status) {
    case 'new': return 'bg-gray-100 text-gray-600';
    case 'learning': return 'bg-blue-100 text-blue-600';
    case 'known': return 'bg-green-100 text-green-600';
    case 'mastered': return 'bg-purple-100 text-purple-600';
  }
}

export function getPositionLabel(position: RadicalPosition | undefined): string {
  switch (position) {
    case 'hen': return '偏 (left)';
    case 'tsukuri': return '旁 (right)';
    case 'kanmuri': return '冠 (top)';
    case 'ashi': return '脚 (bottom)';
    case 'tare': return '垂 (top-left)';
    case 'nyou': return '繞 (bottom-left)';
    case 'kamae': return '構 (enclosure)';
    default: return '';
  }
}

export function getDrillTypeLabel(type: RadicalDrillType): string {
  switch (type) {
    case 'identify_radical': return 'Identify Radical';
    case 'find_kanji': return 'Find Kanji';
    case 'sound_pattern': return 'Sound Pattern';
    case 'radical_meaning': return 'Radical Meaning';
    case 'kanji_components': return 'Kanji Components';
  }
}

export function getDifficultyLabel(difficulty: number): string {
  switch (difficulty) {
    case 1: return 'Beginner';
    case 2: return 'Elementary';
    case 3: return 'Intermediate';
    case 4: return 'Advanced';
    case 5: return 'Expert';
    default: return 'Unknown';
  }
}
