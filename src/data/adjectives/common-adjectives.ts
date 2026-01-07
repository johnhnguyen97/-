/**
 * Common Japanese Adjectives Database
 *
 * This is the core adjective list that the grammar engine uses.
 * All conjugations are pre-computed using our algorithm.
 */

import type { AdjectiveType, JLPTLevel } from '../../types/drill';

export interface AdjectiveEntry {
  dictionary_form: string;
  reading: string;
  romaji: string;
  meaning: string;
  adjective_type: AdjectiveType;
  jlpt_level: JLPTLevel;
  tags?: string[];
  antonym?: string; // Opposite adjective (e.g., 高い <-> 安い)
}

// ============================================
// JLPT N5 ADJECTIVES (Most common, beginner)
// ============================================

export const N5_ADJECTIVES: AdjectiveEntry[] = [
  // Basic descriptive adjectives
  { dictionary_form: 'いい', reading: 'いい', romaji: 'ii', meaning: 'good', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '悪い' },
  { dictionary_form: '悪い', reading: 'わるい', romaji: 'warui', meaning: 'bad', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: 'いい' },
  { dictionary_form: '大きい', reading: 'おおきい', romaji: 'ookii', meaning: 'big, large', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '小さい' },
  { dictionary_form: '小さい', reading: 'ちいさい', romaji: 'chiisai', meaning: 'small, little', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '大きい' },
  { dictionary_form: '高い', reading: 'たかい', romaji: 'takai', meaning: 'expensive, high, tall', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '安い' },
  { dictionary_form: '安い', reading: 'やすい', romaji: 'yasui', meaning: 'cheap, inexpensive', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '高い' },
  { dictionary_form: '低い', reading: 'ひくい', romaji: 'hikui', meaning: 'low, short (height)', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '高い' },

  // Temperature & weather
  { dictionary_form: '暑い', reading: 'あつい', romaji: 'atsui', meaning: 'hot (weather)', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '寒い' },
  { dictionary_form: '寒い', reading: 'さむい', romaji: 'samui', meaning: 'cold (weather)', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '暑い' },
  { dictionary_form: '暖かい', reading: 'あたたかい', romaji: 'atatakai', meaning: 'warm', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '涼しい' },
  { dictionary_form: '涼しい', reading: 'すずしい', romaji: 'suzushii', meaning: 'cool', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '暖かい' },

  // New & old
  { dictionary_form: '新しい', reading: 'あたらしい', romaji: 'atarashii', meaning: 'new', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '古い' },
  { dictionary_form: '古い', reading: 'ふるい', romaji: 'furui', meaning: 'old', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '新しい' },

  // Taste & food
  { dictionary_form: 'おいしい', reading: 'おいしい', romaji: 'oishii', meaning: 'delicious, tasty', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: 'まずい' },
  { dictionary_form: 'まずい', reading: 'まずい', romaji: 'mazui', meaning: 'unappetizing, bad-tasting', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: 'おいしい' },
  { dictionary_form: '甘い', reading: 'あまい', romaji: 'amai', meaning: 'sweet', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '苦い' },

  // Emotions
  { dictionary_form: '嬉しい', reading: 'うれしい', romaji: 'ureshii', meaning: 'happy, glad', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '悲しい' },
  { dictionary_form: '悲しい', reading: 'かなしい', romaji: 'kanashii', meaning: 'sad', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '嬉しい' },
  { dictionary_form: '楽しい', reading: 'たのしい', romaji: 'tanoshii', meaning: 'fun, enjoyable', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: 'つまらない' },
  { dictionary_form: 'つまらない', reading: 'つまらない', romaji: 'tsumaranai', meaning: 'boring, dull', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '楽しい' },
  { dictionary_form: '面白い', reading: 'おもしろい', romaji: 'omoshiroi', meaning: 'interesting, funny', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: 'つまらない' },
  { dictionary_form: '怖い', reading: 'こわい', romaji: 'kowai', meaning: 'scary, frightening', adjective_type: 'i_adjective', jlpt_level: 'N5' },
  { dictionary_form: '恥ずかしい', reading: 'はずかしい', romaji: 'hazukashii', meaning: 'embarrassing, shy', adjective_type: 'i_adjective', jlpt_level: 'N5' },
  { dictionary_form: '眠い', reading: 'ねむい', romaji: 'nemui', meaning: 'sleepy', adjective_type: 'i_adjective', jlpt_level: 'N5' },

  // Physical sensations
  { dictionary_form: '痛い', reading: 'いたい', romaji: 'itai', meaning: 'painful, sore', adjective_type: 'i_adjective', jlpt_level: 'N5' },

  // Appearance & characteristics
  { dictionary_form: 'かわいい', reading: 'かわいい', romaji: 'kawaii', meaning: 'cute', adjective_type: 'i_adjective', jlpt_level: 'N5' },
  { dictionary_form: '明るい', reading: 'あかるい', romaji: 'akarui', meaning: 'bright', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '暗い' },
  { dictionary_form: '暗い', reading: 'くらい', romaji: 'kurai', meaning: 'dark', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '明るい' },
  { dictionary_form: '汚い', reading: 'きたない', romaji: 'kitanai', meaning: 'dirty', adjective_type: 'i_adjective', jlpt_level: 'N5' },

  // Size & dimensions
  { dictionary_form: '広い', reading: 'ひろい', romaji: 'hiroi', meaning: 'spacious, wide', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '狭い' },
  { dictionary_form: '狭い', reading: 'せまい', romaji: 'semai', meaning: 'narrow, cramped', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '広い' },
  { dictionary_form: '長い', reading: 'ながい', romaji: 'nagai', meaning: 'long', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '短い' },
  { dictionary_form: '短い', reading: 'みじかい', romaji: 'mijikai', meaning: 'short', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '長い' },

  // Difficulty & personality
  { dictionary_form: '易しい', reading: 'やさしい', romaji: 'yasashii', meaning: 'easy, gentle', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '難しい' },
  { dictionary_form: '難しい', reading: 'むずかしい', romaji: 'muzukashii', meaning: 'difficult', adjective_type: 'i_adjective', jlpt_level: 'N5', antonym: '易しい' },

  // Busy
  { dictionary_form: '忙しい', reading: 'いそがしい', romaji: 'isogashii', meaning: 'busy', adjective_type: 'i_adjective', jlpt_level: 'N5' },
];

// ============================================
// JLPT N4 ADJECTIVES
// ============================================

export const N4_ADJECTIVES: AdjectiveEntry[] = [
  // Speed
  { dictionary_form: '速い', reading: 'はやい', romaji: 'hayai', meaning: 'fast, quick', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '遅い' },
  { dictionary_form: '早い', reading: 'はやい', romaji: 'hayai', meaning: 'early', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '遅い' },
  { dictionary_form: '遅い', reading: 'おそい', romaji: 'osoi', meaning: 'slow, late', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '速い' },

  // Weight & strength
  { dictionary_form: '重い', reading: 'おもい', romaji: 'omoi', meaning: 'heavy', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '軽い' },
  { dictionary_form: '軽い', reading: 'かるい', romaji: 'karui', meaning: 'light (weight)', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '重い' },
  { dictionary_form: '強い', reading: 'つよい', romaji: 'tsuyoi', meaning: 'strong', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '弱い' },
  { dictionary_form: '弱い', reading: 'よわい', romaji: 'yowai', meaning: 'weak', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '強い' },

  // Noise
  { dictionary_form: 'うるさい', reading: 'うるさい', romaji: 'urusai', meaning: 'noisy, annoying', adjective_type: 'i_adjective', jlpt_level: 'N4' },

  // Taste
  { dictionary_form: '苦い', reading: 'にがい', romaji: 'nigai', meaning: 'bitter', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '甘い' },
  { dictionary_form: '酸っぱい', reading: 'すっぱい', romaji: 'suppai', meaning: 'sour', adjective_type: 'i_adjective', jlpt_level: 'N4' },
  { dictionary_form: '臭い', reading: 'くさい', romaji: 'kusai', meaning: 'smelly, stinky', adjective_type: 'i_adjective', jlpt_level: 'N4' },

  // Strictness & correctness
  { dictionary_form: '厳しい', reading: 'きびしい', romaji: 'kibishii', meaning: 'strict, severe', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '易しい' },
  { dictionary_form: '正しい', reading: 'ただしい', romaji: 'tadashii', meaning: 'correct, right', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '間違っている' },

  // Desire & quantity
  { dictionary_form: '欲しい', reading: 'ほしい', romaji: 'hoshii', meaning: 'want, desire', adjective_type: 'i_adjective', jlpt_level: 'N4' },
  { dictionary_form: '多い', reading: 'おおい', romaji: 'ooi', meaning: 'many, much', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '少ない' },
  { dictionary_form: '少ない', reading: 'すくない', romaji: 'sukunai', meaning: 'few, little', adjective_type: 'i_adjective', jlpt_level: 'N4', antonym: '多い' },
];

// ============================================
// ALL ADJECTIVES COMBINED
// ============================================

export const ALL_ADJECTIVES: AdjectiveEntry[] = [
  ...N5_ADJECTIVES,
  ...N4_ADJECTIVES,
];

// Helper functions
export function getAdjectivesByLevel(level: JLPTLevel): AdjectiveEntry[] {
  return ALL_ADJECTIVES.filter(adj => adj.jlpt_level === level);
}

export function getAdjectiveByDictionaryForm(form: string): AdjectiveEntry | undefined {
  return ALL_ADJECTIVES.find(adj => adj.dictionary_form === form);
}

export function getAdjectivesByType(type: AdjectiveType): AdjectiveEntry[] {
  return ALL_ADJECTIVES.filter(adj => adj.adjective_type === type);
}
