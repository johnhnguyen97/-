/**
 * Common Japanese Verbs Database
 *
 * This is the core verb list that the grammar engine uses.
 * All conjugations are pre-computed using our algorithm.
 */

import type { VerbGroup } from '../../lib/grammar-engine/types';

export interface VerbEntry {
  dictionary_form: string;
  reading: string;
  romaji: string;
  meaning: string;
  group: VerbGroup;
  jlpt_level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  is_transitive?: boolean;
  tags?: string[];
}

// ============================================
// JLPT N5 VERBS (Most common, beginner)
// ============================================

export const N5_VERBS: VerbEntry[] = [
  // Ichidan (Group 2) - る verbs
  { dictionary_form: '食べる', reading: 'たべる', romaji: 'taberu', meaning: 'to eat', group: 'ichidan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '見る', reading: 'みる', romaji: 'miru', meaning: 'to see, to watch', group: 'ichidan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '寝る', reading: 'ねる', romaji: 'neru', meaning: 'to sleep', group: 'ichidan', jlpt_level: 'N5' },
  { dictionary_form: '起きる', reading: 'おきる', romaji: 'okiru', meaning: 'to wake up, to get up', group: 'ichidan', jlpt_level: 'N5' },
  { dictionary_form: '開ける', reading: 'あける', romaji: 'akeru', meaning: 'to open', group: 'ichidan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '閉める', reading: 'しめる', romaji: 'shimeru', meaning: 'to close', group: 'ichidan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '教える', reading: 'おしえる', romaji: 'oshieru', meaning: 'to teach, to tell', group: 'ichidan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '出る', reading: 'でる', romaji: 'deru', meaning: 'to go out, to leave', group: 'ichidan', jlpt_level: 'N5' },
  { dictionary_form: '入れる', reading: 'いれる', romaji: 'ireru', meaning: 'to put in, to insert', group: 'ichidan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '着る', reading: 'きる', romaji: 'kiru', meaning: 'to wear (upper body)', group: 'ichidan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '浴びる', reading: 'あびる', romaji: 'abiru', meaning: 'to shower, to bathe in', group: 'ichidan', jlpt_level: 'N5' },
  { dictionary_form: 'いる', reading: 'いる', romaji: 'iru', meaning: 'to exist (animate)', group: 'ichidan', jlpt_level: 'N5' },

  // Godan (Group 1) - う verbs
  { dictionary_form: '買う', reading: 'かう', romaji: 'kau', meaning: 'to buy', group: 'godan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '会う', reading: 'あう', romaji: 'au', meaning: 'to meet', group: 'godan', jlpt_level: 'N5' },
  { dictionary_form: '言う', reading: 'いう', romaji: 'iu', meaning: 'to say', group: 'godan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '歌う', reading: 'うたう', romaji: 'utau', meaning: 'to sing', group: 'godan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '書く', reading: 'かく', romaji: 'kaku', meaning: 'to write', group: 'godan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '聞く', reading: 'きく', romaji: 'kiku', meaning: 'to listen, to ask', group: 'godan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '行く', reading: 'いく', romaji: 'iku', meaning: 'to go', group: 'godan', jlpt_level: 'N5' },
  { dictionary_form: '歩く', reading: 'あるく', romaji: 'aruku', meaning: 'to walk', group: 'godan', jlpt_level: 'N5' },
  { dictionary_form: '話す', reading: 'はなす', romaji: 'hanasu', meaning: 'to speak, to talk', group: 'godan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '待つ', reading: 'まつ', romaji: 'matsu', meaning: 'to wait', group: 'godan', jlpt_level: 'N5' },
  { dictionary_form: '持つ', reading: 'もつ', romaji: 'motsu', meaning: 'to hold, to have', group: 'godan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '読む', reading: 'よむ', romaji: 'yomu', meaning: 'to read', group: 'godan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '飲む', reading: 'のむ', romaji: 'nomu', meaning: 'to drink', group: 'godan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '遊ぶ', reading: 'あそぶ', romaji: 'asobu', meaning: 'to play', group: 'godan', jlpt_level: 'N5' },
  { dictionary_form: '帰る', reading: 'かえる', romaji: 'kaeru', meaning: 'to return, to go home', group: 'godan', jlpt_level: 'N5' },
  { dictionary_form: '入る', reading: 'はいる', romaji: 'hairu', meaning: 'to enter', group: 'godan', jlpt_level: 'N5' },
  { dictionary_form: '分かる', reading: 'わかる', romaji: 'wakaru', meaning: 'to understand', group: 'godan', jlpt_level: 'N5' },
  { dictionary_form: '作る', reading: 'つくる', romaji: 'tsukuru', meaning: 'to make, to create', group: 'godan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '撮る', reading: 'とる', romaji: 'toru', meaning: 'to take (photo)', group: 'godan', jlpt_level: 'N5', is_transitive: true },
  { dictionary_form: '乗る', reading: 'のる', romaji: 'noru', meaning: 'to ride, to get on', group: 'godan', jlpt_level: 'N5' },
  { dictionary_form: 'ある', reading: 'ある', romaji: 'aru', meaning: 'to exist (inanimate)', group: 'godan', jlpt_level: 'N5' },
  { dictionary_form: '泳ぐ', reading: 'およぐ', romaji: 'oyogu', meaning: 'to swim', group: 'godan', jlpt_level: 'N5' },
  { dictionary_form: '死ぬ', reading: 'しぬ', romaji: 'shinu', meaning: 'to die', group: 'godan', jlpt_level: 'N5' },

  // Irregular
  { dictionary_form: 'する', reading: 'する', romaji: 'suru', meaning: 'to do', group: 'irregular-suru', jlpt_level: 'N5' },
  { dictionary_form: '来る', reading: 'くる', romaji: 'kuru', meaning: 'to come', group: 'irregular-kuru', jlpt_level: 'N5' },

  // する compound verbs
  { dictionary_form: '勉強する', reading: 'べんきょうする', romaji: 'benkyou suru', meaning: 'to study', group: 'irregular-suru', jlpt_level: 'N5' },
  { dictionary_form: '料理する', reading: 'りょうりする', romaji: 'ryouri suru', meaning: 'to cook', group: 'irregular-suru', jlpt_level: 'N5' },
  { dictionary_form: '電話する', reading: 'でんわする', romaji: 'denwa suru', meaning: 'to phone', group: 'irregular-suru', jlpt_level: 'N5' },
  { dictionary_form: '散歩する', reading: 'さんぽする', romaji: 'sanpo suru', meaning: 'to take a walk', group: 'irregular-suru', jlpt_level: 'N5' },
];

// ============================================
// JLPT N4 VERBS
// ============================================

export const N4_VERBS: VerbEntry[] = [
  // Ichidan
  { dictionary_form: '忘れる', reading: 'わすれる', romaji: 'wasureru', meaning: 'to forget', group: 'ichidan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '覚える', reading: 'おぼえる', romaji: 'oboeru', meaning: 'to remember, to memorize', group: 'ichidan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '考える', reading: 'かんがえる', romaji: 'kangaeru', meaning: 'to think, to consider', group: 'ichidan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '答える', reading: 'こたえる', romaji: 'kotaeru', meaning: 'to answer', group: 'ichidan', jlpt_level: 'N4' },
  { dictionary_form: '調べる', reading: 'しらべる', romaji: 'shiraberu', meaning: 'to investigate, to check', group: 'ichidan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '変える', reading: 'かえる', romaji: 'kaeru', meaning: 'to change (something)', group: 'ichidan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '始める', reading: 'はじめる', romaji: 'hajimeru', meaning: 'to begin (something)', group: 'ichidan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '終わる', reading: 'おわる', romaji: 'owaru', meaning: 'to end, to finish', group: 'godan', jlpt_level: 'N4' },
  { dictionary_form: '届ける', reading: 'とどける', romaji: 'todokeru', meaning: 'to deliver', group: 'ichidan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '伝える', reading: 'つたえる', romaji: 'tsutaeru', meaning: 'to convey, to tell', group: 'ichidan', jlpt_level: 'N4', is_transitive: true },

  // Godan
  { dictionary_form: '送る', reading: 'おくる', romaji: 'okuru', meaning: 'to send', group: 'godan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '届く', reading: 'とどく', romaji: 'todoku', meaning: 'to reach, to arrive', group: 'godan', jlpt_level: 'N4' },
  { dictionary_form: '置く', reading: 'おく', romaji: 'oku', meaning: 'to put, to place', group: 'godan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '思う', reading: 'おもう', romaji: 'omou', meaning: 'to think', group: 'godan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '知る', reading: 'しる', romaji: 'shiru', meaning: 'to know', group: 'godan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '住む', reading: 'すむ', romaji: 'sumu', meaning: 'to live, to reside', group: 'godan', jlpt_level: 'N4' },
  { dictionary_form: '休む', reading: 'やすむ', romaji: 'yasumu', meaning: 'to rest, to take a break', group: 'godan', jlpt_level: 'N4' },
  { dictionary_form: '働く', reading: 'はたらく', romaji: 'hataraku', meaning: 'to work', group: 'godan', jlpt_level: 'N4' },
  { dictionary_form: '走る', reading: 'はしる', romaji: 'hashiru', meaning: 'to run', group: 'godan', jlpt_level: 'N4' },
  { dictionary_form: '立つ', reading: 'たつ', romaji: 'tatsu', meaning: 'to stand', group: 'godan', jlpt_level: 'N4' },
  { dictionary_form: '座る', reading: 'すわる', romaji: 'suwaru', meaning: 'to sit', group: 'godan', jlpt_level: 'N4' },
  { dictionary_form: '使う', reading: 'つかう', romaji: 'tsukau', meaning: 'to use', group: 'godan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '払う', reading: 'はらう', romaji: 'harau', meaning: 'to pay', group: 'godan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '売る', reading: 'うる', romaji: 'uru', meaning: 'to sell', group: 'godan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '貸す', reading: 'かす', romaji: 'kasu', meaning: 'to lend', group: 'godan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '借りる', reading: 'かりる', romaji: 'kariru', meaning: 'to borrow', group: 'ichidan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '返す', reading: 'かえす', romaji: 'kaesu', meaning: 'to return (something)', group: 'godan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '選ぶ', reading: 'えらぶ', romaji: 'erabu', meaning: 'to choose', group: 'godan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '呼ぶ', reading: 'よぶ', romaji: 'yobu', meaning: 'to call', group: 'godan', jlpt_level: 'N4', is_transitive: true },
  { dictionary_form: '飛ぶ', reading: 'とぶ', romaji: 'tobu', meaning: 'to fly', group: 'godan', jlpt_level: 'N4' },

  // する compound verbs
  { dictionary_form: '運動する', reading: 'うんどうする', romaji: 'undou suru', meaning: 'to exercise', group: 'irregular-suru', jlpt_level: 'N4' },
  { dictionary_form: '練習する', reading: 'れんしゅうする', romaji: 'renshuu suru', meaning: 'to practice', group: 'irregular-suru', jlpt_level: 'N4' },
  { dictionary_form: '準備する', reading: 'じゅんびする', romaji: 'junbi suru', meaning: 'to prepare', group: 'irregular-suru', jlpt_level: 'N4' },
  { dictionary_form: '説明する', reading: 'せつめいする', romaji: 'setsumei suru', meaning: 'to explain', group: 'irregular-suru', jlpt_level: 'N4' },
  { dictionary_form: '紹介する', reading: 'しょうかいする', romaji: 'shoukai suru', meaning: 'to introduce', group: 'irregular-suru', jlpt_level: 'N4' },
  { dictionary_form: '約束する', reading: 'やくそくする', romaji: 'yakusoku suru', meaning: 'to promise', group: 'irregular-suru', jlpt_level: 'N4' },
  { dictionary_form: '出発する', reading: 'しゅっぱつする', romaji: 'shuppatsu suru', meaning: 'to depart', group: 'irregular-suru', jlpt_level: 'N4' },
  { dictionary_form: '到着する', reading: 'とうちゃくする', romaji: 'touchaku suru', meaning: 'to arrive', group: 'irregular-suru', jlpt_level: 'N4' },
];

// ============================================
// ALL VERBS COMBINED
// ============================================

export const ALL_VERBS: VerbEntry[] = [
  ...N5_VERBS,
  ...N4_VERBS,
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get verbs by JLPT level
 */
export function getVerbsByLevel(level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'): VerbEntry[] {
  return ALL_VERBS.filter(v => v.jlpt_level === level);
}

/**
 * Get verbs by group
 */
export function getVerbsByGroup(group: VerbGroup): VerbEntry[] {
  return ALL_VERBS.filter(v => v.group === group);
}

/**
 * Find a verb by dictionary form
 */
export function findVerb(dictionaryForm: string): VerbEntry | undefined {
  return ALL_VERBS.find(v => v.dictionary_form === dictionaryForm);
}

/**
 * Find a verb by reading
 */
export function findVerbByReading(reading: string): VerbEntry | undefined {
  return ALL_VERBS.find(v => v.reading === reading);
}
