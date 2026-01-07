/**
 * Gojun Grammar Engine - Core Conjugation Algorithm
 *
 * This is the SINGLE SOURCE OF TRUTH for all Japanese verb and adjective conjugations.
 * AI and all games MUST validate against this algorithm.
 */

import type {
  VerbGroup,
  GodanEnding,
  ConjugationType,
  ConjugationResult,
  AdjectiveConjugationType,
} from './types';

// ============================================
// KANA UTILITIES
// ============================================

// Hiragana rows for Godan conjugation
const HIRAGANA_ROWS = {
  u:   { a: 'わ', i: 'い', u: 'う', e: 'え', o: 'お' },
  ku:  { a: 'か', i: 'き', u: 'く', e: 'け', o: 'こ' },
  gu:  { a: 'が', i: 'ぎ', u: 'ぐ', e: 'げ', o: 'ご' },
  su:  { a: 'さ', i: 'し', u: 'す', e: 'せ', o: 'そ' },
  tsu: { a: 'た', i: 'ち', u: 'つ', e: 'て', o: 'と' },
  nu:  { a: 'な', i: 'に', u: 'ぬ', e: 'ね', o: 'の' },
  bu:  { a: 'ば', i: 'び', u: 'ぶ', e: 'べ', o: 'ぼ' },
  mu:  { a: 'ま', i: 'み', u: 'む', e: 'め', o: 'も' },
  ru:  { a: 'ら', i: 'り', u: 'る', e: 'れ', o: 'ろ' },
} as const;

// Te-form sound changes for Godan verbs
const TE_FORM_CHANGES: Record<GodanEnding, { te: string; ta: string }> = {
  u:   { te: 'って', ta: 'った' },
  tsu: { te: 'って', ta: 'った' },
  ru:  { te: 'って', ta: 'った' },
  mu:  { te: 'んで', ta: 'んだ' },
  bu:  { te: 'んで', ta: 'んだ' },
  nu:  { te: 'んで', ta: 'んだ' },
  ku:  { te: 'いて', ta: 'いた' },
  gu:  { te: 'いで', ta: 'いだ' },
  su:  { te: 'して', ta: 'した' },
};

// Special exception: 行く → 行って (not 行いて)
const GODAN_EXCEPTIONS: Record<string, Partial<Record<ConjugationType, string>>> = {
  '行く': { te: '行って', ta: '行った', past: '行った' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the stem of a verb (remove the ending)
 */
function getVerbStem(dictionaryForm: string, group: VerbGroup): string {
  if (group === 'ichidan') {
    // Ichidan: remove る
    return dictionaryForm.slice(0, -1);
  } else if (group === 'godan') {
    // Godan: remove the final kana
    return dictionaryForm.slice(0, -1);
  } else if (group === 'irregular-suru') {
    // する verbs: get the noun part
    return dictionaryForm.slice(0, -2);
  } else if (group === 'irregular-kuru') {
    // 来る: stem is 来
    return dictionaryForm.slice(0, -1);
  }
  return dictionaryForm;
}

/**
 * Get the Godan ending type from the final kana
 */
function getGodanEnding(dictionaryForm: string): GodanEnding {
  const lastChar = dictionaryForm.slice(-1);
  const endingMap: Record<string, GodanEnding> = {
    'う': 'u', 'く': 'ku', 'ぐ': 'gu', 'す': 'su',
    'つ': 'tsu', 'ぬ': 'nu', 'ぶ': 'bu', 'む': 'mu', 'る': 'ru',
  };
  return endingMap[lastChar] || 'ru';
}

/**
 * Convert Godan stem to a specific vowel row
 */
function godanToRow(stem: string, ending: GodanEnding, row: 'a' | 'i' | 'u' | 'e' | 'o'): string {
  return stem + HIRAGANA_ROWS[ending][row];
}

// ============================================
// MAIN CONJUGATION FUNCTIONS
// ============================================

/**
 * Conjugate an Ichidan verb (Group 2 / る-verbs)
 * Rule: Remove る, add suffix
 */
function conjugateIchidan(stem: string, type: ConjugationType): string {
  switch (type) {
    // Dictionary/Plain
    case 'dictionary': return stem + 'る';
    case 'negative': return stem + 'ない';
    case 'past': return stem + 'た';
    case 'past_negative': return stem + 'なかった';

    // Polite
    case 'masu': return stem + 'ます';
    case 'masen': return stem + 'ません';
    case 'mashita': return stem + 'ました';
    case 'masen_deshita': return stem + 'ませんでした';

    // Te/Ta
    case 'te': return stem + 'て';
    case 'ta': return stem + 'た';

    // Potential (られる - full form)
    case 'potential': return stem + 'られる';
    case 'potential_negative': return stem + 'られない';

    // Volitional
    case 'volitional': return stem + 'よう';
    case 'volitional_polite': return stem + 'ましょう';

    // Imperative
    case 'imperative': return stem + 'ろ';
    case 'imperative_negative': return stem + 'るな';

    // Passive (same as potential for Ichidan)
    case 'passive': return stem + 'られる';
    case 'passive_negative': return stem + 'られない';

    // Causative
    case 'causative': return stem + 'させる';
    case 'causative_negative': return stem + 'させない';
    case 'causative_passive': return stem + 'させられる';

    // Conditional
    case 'conditional_ba': return stem + 'れば';
    case 'conditional_tara': return stem + 'たら';

    // Desire
    case 'tai': return stem + 'たい';
    case 'tai_negative': return stem + 'たくない';
    case 'tai_past': return stem + 'たかった';

    // Progressive
    case 'te_iru': return stem + 'ている';
    case 'te_iru_negative': return stem + 'ていない';

    default: return stem + 'る';
  }
}

/**
 * Conjugate a Godan verb (Group 1 / う-verbs)
 * Rule: Change final kana based on vowel row
 */
function conjugateGodan(
  stem: string,
  ending: GodanEnding,
  type: ConjugationType,
  dictionaryForm: string
): string {
  // Check for exceptions first
  if (GODAN_EXCEPTIONS[dictionaryForm]?.[type]) {
    return GODAN_EXCEPTIONS[dictionaryForm][type]!;
  }

  switch (type) {
    // Dictionary/Plain
    case 'dictionary': return godanToRow(stem, ending, 'u');
    case 'negative': return godanToRow(stem, ending, 'a') + 'ない';
    case 'past': return stem + TE_FORM_CHANGES[ending].ta;
    case 'past_negative': return godanToRow(stem, ending, 'a') + 'なかった';

    // Polite
    case 'masu': return godanToRow(stem, ending, 'i') + 'ます';
    case 'masen': return godanToRow(stem, ending, 'i') + 'ません';
    case 'mashita': return godanToRow(stem, ending, 'i') + 'ました';
    case 'masen_deshita': return godanToRow(stem, ending, 'i') + 'ませんでした';

    // Te/Ta
    case 'te': return stem + TE_FORM_CHANGES[ending].te;
    case 'ta': return stem + TE_FORM_CHANGES[ending].ta;

    // Potential (える form)
    case 'potential': return godanToRow(stem, ending, 'e') + 'る';
    case 'potential_negative': return godanToRow(stem, ending, 'e') + 'ない';

    // Volitional
    case 'volitional': return godanToRow(stem, ending, 'o') + 'う';
    case 'volitional_polite': return godanToRow(stem, ending, 'i') + 'ましょう';

    // Imperative
    case 'imperative': return godanToRow(stem, ending, 'e');
    case 'imperative_negative': return godanToRow(stem, ending, 'u') + 'な';

    // Passive
    case 'passive': return godanToRow(stem, ending, 'a') + 'れる';
    case 'passive_negative': return godanToRow(stem, ending, 'a') + 'れない';

    // Causative
    case 'causative': return godanToRow(stem, ending, 'a') + 'せる';
    case 'causative_negative': return godanToRow(stem, ending, 'a') + 'せない';
    case 'causative_passive': return godanToRow(stem, ending, 'a') + 'せられる';

    // Conditional
    case 'conditional_ba': return godanToRow(stem, ending, 'e') + 'ば';
    case 'conditional_tara': return stem + TE_FORM_CHANGES[ending].ta + 'ら';

    // Desire
    case 'tai': return godanToRow(stem, ending, 'i') + 'たい';
    case 'tai_negative': return godanToRow(stem, ending, 'i') + 'たくない';
    case 'tai_past': return godanToRow(stem, ending, 'i') + 'たかった';

    // Progressive
    case 'te_iru': return stem + TE_FORM_CHANGES[ending].te + 'いる';
    case 'te_iru_negative': return stem + TE_FORM_CHANGES[ending].te + 'いない';

    default: return godanToRow(stem, ending, 'u');
  }
}

/**
 * Conjugate する (irregular)
 */
function conjugateSuru(nounPart: string, type: ConjugationType): string {
  const base = nounPart; // 勉強, 料理, etc. (empty for plain する)

  switch (type) {
    // Dictionary/Plain
    case 'dictionary': return base + 'する';
    case 'negative': return base + 'しない';
    case 'past': return base + 'した';
    case 'past_negative': return base + 'しなかった';

    // Polite
    case 'masu': return base + 'します';
    case 'masen': return base + 'しません';
    case 'mashita': return base + 'しました';
    case 'masen_deshita': return base + 'しませんでした';

    // Te/Ta
    case 'te': return base + 'して';
    case 'ta': return base + 'した';

    // Potential
    case 'potential': return base + 'できる';
    case 'potential_negative': return base + 'できない';

    // Volitional
    case 'volitional': return base + 'しよう';
    case 'volitional_polite': return base + 'しましょう';

    // Imperative
    case 'imperative': return base + 'しろ';
    case 'imperative_negative': return base + 'するな';

    // Passive
    case 'passive': return base + 'される';
    case 'passive_negative': return base + 'されない';

    // Causative
    case 'causative': return base + 'させる';
    case 'causative_negative': return base + 'させない';
    case 'causative_passive': return base + 'させられる';

    // Conditional
    case 'conditional_ba': return base + 'すれば';
    case 'conditional_tara': return base + 'したら';

    // Desire
    case 'tai': return base + 'したい';
    case 'tai_negative': return base + 'したくない';
    case 'tai_past': return base + 'したかった';

    // Progressive
    case 'te_iru': return base + 'している';
    case 'te_iru_negative': return base + 'していない';

    default: return base + 'する';
  }
}

/**
 * Conjugate 来る (irregular)
 */
function conjugateKuru(type: ConjugationType): string {
  switch (type) {
    // Dictionary/Plain
    case 'dictionary': return '来る';
    case 'negative': return '来ない';
    case 'past': return '来た';
    case 'past_negative': return '来なかった';

    // Polite
    case 'masu': return '来ます';
    case 'masen': return '来ません';
    case 'mashita': return '来ました';
    case 'masen_deshita': return '来ませんでした';

    // Te/Ta
    case 'te': return '来て';
    case 'ta': return '来た';

    // Potential
    case 'potential': return '来られる';
    case 'potential_negative': return '来られない';

    // Volitional
    case 'volitional': return '来よう';
    case 'volitional_polite': return '来ましょう';

    // Imperative
    case 'imperative': return '来い';
    case 'imperative_negative': return '来るな';

    // Passive
    case 'passive': return '来られる';
    case 'passive_negative': return '来られない';

    // Causative
    case 'causative': return '来させる';
    case 'causative_negative': return '来させない';
    case 'causative_passive': return '来させられる';

    // Conditional
    case 'conditional_ba': return '来れば';
    case 'conditional_tara': return '来たら';

    // Desire
    case 'tai': return '来たい';
    case 'tai_negative': return '来たくない';
    case 'tai_past': return '来たかった';

    // Progressive
    case 'te_iru': return '来ている';
    case 'te_iru_negative': return '来ていない';

    default: return '来る';
  }
}

// ============================================
// ADJECTIVE CONJUGATION
// ============================================

/**
 * Conjugate an i-adjective (い-adjective)
 * Rule: Remove い, add suffix
 * Special case: いい conjugates as よい
 */
function conjugateIAdjective(dictionaryForm: string, type: AdjectiveConjugationType): string {
  // Special handling for いい (good) - irregular
  if (dictionaryForm === 'いい') {
    switch (type) {
      case 'present_positive': return 'いい';
      case 'present_negative': return 'よくない';
      case 'past_positive': return 'よかった';
      case 'past_negative': return 'よくなかった';
      case 'te_form': return 'よくて';
      case 'adverb': return 'よく';
      default: return 'いい';
    }
  }

  // Regular i-adjectives
  const stem = dictionaryForm.slice(0, -1); // Remove final い

  switch (type) {
    case 'present_positive': return dictionaryForm;
    case 'present_negative': return stem + 'くない';
    case 'past_positive': return stem + 'かった';
    case 'past_negative': return stem + 'くなかった';
    case 'te_form': return stem + 'くて';
    case 'adverb': return stem + 'く';
    default: return dictionaryForm;
  }
}

/**
 * Main adjective conjugation function
 */
export function conjugateAdjective(
  dictionaryForm: string,
  reading: string,
  type: AdjectiveConjugationType
): ConjugationResult {
  const result = conjugateIAdjective(dictionaryForm, type);
  const resultReading = conjugateIAdjective(reading, type);

  return {
    kanji: result,
    reading: resultReading,
    romaji: toRomaji(resultReading),
  };
}

/**
 * Generate ALL conjugations for an i-adjective
 */
export function generateAllAdjectiveConjugations(
  dictionaryForm: string,
  reading: string
): Record<AdjectiveConjugationType, ConjugationResult> {
  const types: AdjectiveConjugationType[] = [
    'present_positive',
    'present_negative',
    'past_positive',
    'past_negative',
    'te_form',
    'adverb',
  ];

  const result: Partial<Record<AdjectiveConjugationType, ConjugationResult>> = {};

  for (const type of types) {
    result[type] = conjugateAdjective(dictionaryForm, reading, type);
  }

  return result as Record<AdjectiveConjugationType, ConjugationResult>;
}

// ============================================
// MAIN EXPORT
// ============================================

/**
 * Main conjugation function
 * Given a verb and conjugation type, returns the correct form
 */
export function conjugate(
  dictionaryForm: string,
  reading: string,
  group: VerbGroup,
  type: ConjugationType
): ConjugationResult {
  let result: string;
  let resultReading: string;

  switch (group) {
    case 'ichidan': {
      const stem = getVerbStem(dictionaryForm, group);
      const readingStem = getVerbStem(reading, group);
      result = conjugateIchidan(stem, type);
      resultReading = conjugateIchidan(readingStem, type);
      break;
    }

    case 'godan': {
      const stem = getVerbStem(dictionaryForm, group);
      const readingStem = getVerbStem(reading, group);
      const ending = getGodanEnding(reading);
      result = conjugateGodan(stem, ending, type, dictionaryForm);
      resultReading = conjugateGodan(readingStem, ending, type, reading);
      break;
    }

    case 'irregular-suru': {
      const nounPart = dictionaryForm.endsWith('する')
        ? dictionaryForm.slice(0, -2)
        : '';
      const nounReading = reading.endsWith('する')
        ? reading.slice(0, -2)
        : '';
      result = conjugateSuru(nounPart, type);
      resultReading = conjugateSuru(nounReading, type);
      break;
    }

    case 'irregular-kuru': {
      result = conjugateKuru(type);
      // 来る readings change: くる, こない, きます, きて
      resultReading = conjugateKuruReading(type);
      break;
    }

    default:
      result = dictionaryForm;
      resultReading = reading;
  }

  return {
    kanji: result,
    reading: resultReading,
    romaji: toRomaji(resultReading),
  };
}

/**
 * Special reading conjugation for 来る
 */
function conjugateKuruReading(type: ConjugationType): string {
  switch (type) {
    case 'dictionary': return 'くる';
    case 'negative': return 'こない';
    case 'past': return 'きた';
    case 'past_negative': return 'こなかった';
    case 'masu': return 'きます';
    case 'masen': return 'きません';
    case 'mashita': return 'きました';
    case 'masen_deshita': return 'きませんでした';
    case 'te': return 'きて';
    case 'ta': return 'きた';
    case 'potential': return 'こられる';
    case 'potential_negative': return 'こられない';
    case 'volitional': return 'こよう';
    case 'volitional_polite': return 'きましょう';
    case 'imperative': return 'こい';
    case 'imperative_negative': return 'くるな';
    case 'passive': return 'こられる';
    case 'passive_negative': return 'こられない';
    case 'causative': return 'こさせる';
    case 'causative_negative': return 'こさせない';
    case 'causative_passive': return 'こさせられる';
    case 'conditional_ba': return 'くれば';
    case 'conditional_tara': return 'きたら';
    case 'tai': return 'きたい';
    case 'tai_negative': return 'きたくない';
    case 'tai_past': return 'きたかった';
    case 'te_iru': return 'きている';
    case 'te_iru_negative': return 'きていない';
    default: return 'くる';
  }
}

/**
 * Generate ALL conjugations for a verb
 */
export function generateAllConjugations(
  dictionaryForm: string,
  reading: string,
  group: VerbGroup
): Record<ConjugationType, ConjugationResult> {
  const types: ConjugationType[] = [
    'dictionary', 'negative', 'past', 'past_negative',
    'masu', 'masen', 'mashita', 'masen_deshita',
    'te', 'ta',
    'potential', 'potential_negative',
    'volitional', 'volitional_polite',
    'imperative', 'imperative_negative',
    'passive', 'passive_negative',
    'causative', 'causative_negative', 'causative_passive',
    'conditional_ba', 'conditional_tara',
    'tai', 'tai_negative', 'tai_past',
    'te_iru', 'te_iru_negative',
  ];

  const result: Partial<Record<ConjugationType, ConjugationResult>> = {};

  for (const type of types) {
    result[type] = conjugate(dictionaryForm, reading, group, type);
  }

  return result as Record<ConjugationType, ConjugationResult>;
}

/**
 * Basic romaji conversion (simplified)
 */
function toRomaji(hiragana: string): string {
  const map: Record<string, string> = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'っ': '', // Will be handled specially
    'ー': '-',
    // Small kana
    'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo',
    'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
  };

  let result = '';
  for (let i = 0; i < hiragana.length; i++) {
    const char = hiragana[i];
    const nextChar = hiragana[i + 1];

    // Handle っ (small tsu) - double the next consonant
    if (char === 'っ' && nextChar && map[nextChar]) {
      const nextRomaji = map[nextChar];
      result += nextRomaji[0]; // Double the consonant
      continue;
    }

    // Handle combination characters (きゃ, しゅ, etc.)
    if (nextChar && ['ゃ', 'ゅ', 'ょ'].includes(nextChar)) {
      const base = map[char];
      if (base && base.endsWith('i')) {
        const combo = base.slice(0, -1) + map[nextChar];
        result += combo;
        i++; // Skip the small kana
        continue;
      }
    }

    result += map[char] || char;
  }

  return result;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate a conjugation attempt
 * Returns true if the conjugation is correct
 */
export function validateConjugation(
  dictionaryForm: string,
  reading: string,
  group: VerbGroup,
  type: ConjugationType,
  attempt: string
): { isValid: boolean; expected: string } {
  const expected = conjugate(dictionaryForm, reading, group, type);
  const isValid = attempt === expected.kanji || attempt === expected.reading;

  return { isValid, expected: expected.kanji };
}
