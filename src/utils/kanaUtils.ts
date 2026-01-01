// Kana Conversion Utilities
// Handles conversion between hiragana and katakana for Japanese text search

/**
 * Convert hiragana characters to katakana
 * Hiragana range: U+3041 to U+3096
 * Katakana range: U+30A1 to U+30F6
 * Offset: 0x60 (96)
 */
export function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60)
  );
}

/**
 * Convert katakana characters to hiragana
 */
export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  );
}

/**
 * Check if a string contains any Japanese characters (hiragana, katakana, or kanji)
 */
export function containsJapanese(str: string): boolean {
  return /[\u3040-\u30FF\u4E00-\u9FAF]/.test(str);
}

/**
 * Check if a string contains hiragana
 */
export function containsHiragana(str: string): boolean {
  return /[\u3041-\u3096]/.test(str);
}

/**
 * Check if a string contains katakana
 */
export function containsKatakana(str: string): boolean {
  return /[\u30A1-\u30F6]/.test(str);
}

/**
 * Check if a string contains kanji
 */
export function containsKanji(str: string): boolean {
  return /[\u4E00-\u9FAF]/.test(str);
}

/**
 * Normalize a Japanese reading for comparison
 * Converts to hiragana and removes common reading markers like dots and dashes
 */
export function normalizeReading(str: string): string {
  return katakanaToHiragana(str)
    .replace(/[.\-・]/g, '')  // Remove reading separators
    .replace(/\s+/g, '');     // Remove whitespace
}
