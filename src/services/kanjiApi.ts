// Kanji API Service
// Handles kanji lookups via bundled JMdict/Kanjidic data

import type {
  Kanji,
  KanjiDetail,
  KanjiSearchResult,
  UserKanjiProgress,
  UserSavedKanji,
  RadicalInfo,
} from '../types/kanji';

const API_BASE = '/api';

// ============================================
// Types for bundled dictionary data
// ============================================

interface KanjiEntry {
  c: string;        // character
  s: number;        // stroke count
  g: number | null; // grade
  j: number | null; // JLPT level (1-5)
  f: number | null; // frequency
  r: number | null; // radical number
  o: string[] | null; // on'yomi
  k: string[] | null; // kun'yomi
  m: string[];      // meanings
  n: string[] | null; // nanori (name readings)
}

interface VocabEntry {
  id: string;
  k: string | null;   // kanji form
  r: string;          // reading (kana)
  c: number;          // common flag (1 = common)
  p: string[] | null; // parts of speech
  f: string[] | null; // fields
  d: string[] | null; // dialects
  t: string[] | null; // misc tags
  m: string[];        // meanings
}

interface KanjiData {
  version: string;
  count: number;
  data: KanjiEntry[];
}

interface VocabData {
  version: string;
  count: number;
  data: VocabEntry[];
  tags?: Record<string, string>;
}

interface ReadingIndex {
  version: string;
  count: number;
  data: Record<string, string[]>;
}

interface MeaningIndex {
  version: string;
  count: number;
  data: Record<string, string[]>;
}

interface RadicalKanjiData {
  version: string;
  radicalCount: number;
  kanjiCount: number;
  radicalToKanji: Record<string, string[]>;
  kanjiToRadicals: Record<string, string[]>;
}

interface StatsData {
  version: string;
  generatedAt: string;
  kanji: {
    total: number;
    byJLPT: Record<string, number>;
    byGrade: Record<string, number>;
  };
  vocabulary: {
    total: number;
    common: number;
  };
}

// ============================================
// Data Loading & Caching
// ============================================

// Cache for loaded data
const dataCache: Record<string, unknown> = {};
const loadingPromises: Record<string, Promise<unknown>> = {};

async function loadData<T>(filename: string): Promise<T> {
  if (dataCache[filename]) return dataCache[filename] as T;
  if (filename in loadingPromises) return loadingPromises[filename] as Promise<T>;

  loadingPromises[filename] = fetch(`/data/${filename}`)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load ${filename}`);
      return res.json();
    })
    .then(data => {
      dataCache[filename] = data;
      delete loadingPromises[filename];
      return data;
    })
    .catch(err => {
      delete loadingPromises[filename];
      throw err;
    });

  return loadingPromises[filename] as Promise<T>;
}

// Convenience loaders
const loadKanji = () => loadData<KanjiData>('kanji.json');
const loadVocabCommon = () => loadData<VocabData>('vocab-common.json');
const loadReadingIndex = () => loadData<ReadingIndex>('kanji-readings.json');
const loadMeaningIndex = () => loadData<MeaningIndex>('kanji-meanings.json');
const loadRadicalKanji = () => loadData<RadicalKanjiData>('radical-kanji.json');
const loadStats = () => loadData<StatsData>('stats.json');

// JLPT level loaders
const loadKanjiN5 = () => loadData<KanjiData>('kanji-n5.json');
const loadKanjiN4 = () => loadData<KanjiData>('kanji-n4.json');
const loadKanjiN3 = () => loadData<KanjiData>('kanji-n3.json');
const loadKanjiN2 = () => loadData<KanjiData>('kanji-n2.json');
const loadKanjiN1 = () => loadData<KanjiData>('kanji-n1.json');

// Grade level loaders
const loadKanjiElementary = () => loadData<KanjiData>('kanji-elementary.json');
const loadKanjiSecondary = () => loadData<KanjiData>('kanji-secondary.json');

// ============================================
// Transform functions
// ============================================

type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

function kanjiEntryToKanji(entry: KanjiEntry): Kanji {
  const jlptMap: Record<number, JLPTLevel> = { 1: 'N1', 2: 'N2', 3: 'N3', 4: 'N4', 5: 'N5' };

  return {
    id: entry.c,
    character: entry.c,
    strokeCount: entry.s,
    jlptLevel: entry.j ? jlptMap[entry.j] : undefined,
    meaningEn: entry.m.join(', '),
    onyomi: entry.o?.join('、'),
    kunyomi: entry.k?.join('、'),
    grade: entry.g || undefined,
    radicalNumber: entry.r || undefined,
  };
}

function vocabEntryToKanji(entry: VocabEntry): Kanji {
  return {
    id: entry.id,
    character: entry.k || entry.r,
    strokeCount: 0,
    meaningEn: entry.m.join('; '),
    onyomi: undefined,
    kunyomi: entry.r,
  };
}

// ============================================
// Kanji Search & Lookup
// ============================================

/**
 * Search for kanji by query (character, reading, or meaning)
 */
export async function searchKanji(
  query: string,
  _token?: string
): Promise<KanjiSearchResult> {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return { kanji: [], total: 0, hasMore: false };
  }

  try {
    const results: Kanji[] = [];

    // If query is a single character, check if it's a kanji
    if (query.length === 1) {
      const kData = await loadKanji();
      const exactMatch = kData.data.find(k => k.c === query);
      if (exactMatch) {
        results.push(kanjiEntryToKanji(exactMatch));
      }
    }

    // Search by reading using index
    if (results.length < 20) {
      try {
        const readingIdx = await loadReadingIndex();
        const matchedChars = readingIdx.data[query] || readingIdx.data[normalizedQuery] || [];

        if (matchedChars.length > 0) {
          const kData = await loadKanji();
          for (const char of matchedChars.slice(0, 30)) {
            if (!results.find(r => r.character === char)) {
              const entry = kData.data.find(k => k.c === char);
              if (entry) results.push(kanjiEntryToKanji(entry));
            }
          }
        }
      } catch {
        // Index not available, fall back to full search
      }
    }

    // Search by meaning using index
    if (results.length < 20) {
      try {
        const meaningIdx = await loadMeaningIndex();
        const words = normalizedQuery.split(/\s+/);
        const matchedChars = new Set<string>();

        for (const word of words) {
          if (word.length >= 3 && meaningIdx.data[word]) {
            meaningIdx.data[word].forEach(c => matchedChars.add(c));
          }
        }

        if (matchedChars.size > 0) {
          const kData = await loadKanji();
          for (const char of [...matchedChars].slice(0, 30)) {
            if (!results.find(r => r.character === char)) {
              const entry = kData.data.find(k => k.c === char);
              if (entry) results.push(kanjiEntryToKanji(entry));
            }
          }
        }
      } catch {
        // Index not available
      }
    }

    // Full kanji search if we still need more results
    if (results.length < 10) {
      const kData = await loadKanji();
      const kanjiResults = kData.data.filter(entry => {
        if (results.find(r => r.character === entry.c)) return false;
        if (entry.o?.some(r => r.includes(query))) return true;
        if (entry.k?.some(r => r.includes(query))) return true;
        if (entry.m.some(m => m.toLowerCase().includes(normalizedQuery))) return true;
        return false;
      }).slice(0, 30);

      results.push(...kanjiResults.map(kanjiEntryToKanji));
    }

    // Search vocabulary (common only for performance)
    if (results.length < 30) {
      try {
        const vData = await loadVocabCommon();
        const vocabResults = vData.data.filter(entry => {
          if (entry.k === query || entry.r === query) return true;
          if (entry.k?.includes(query) || entry.r.includes(query)) return true;
          if (entry.m.some(m => m.toLowerCase().includes(normalizedQuery))) return true;
          return false;
        }).slice(0, 20);

        results.push(...vocabResults.map(vocabEntryToKanji));
      } catch {
        // Vocab not available
      }
    }

    return {
      kanji: results.slice(0, 50),
      total: results.length,
      hasMore: results.length > 50,
    };
  } catch (error) {
    console.error('Search error:', error);
    return { kanji: [], total: 0, hasMore: false };
  }
}

/**
 * Get detailed information for a single kanji
 */
export async function getKanjiDetail(
  character: string,
  _token?: string
): Promise<KanjiDetail | null> {
  try {
    const kData = await loadKanji();
    const entry = kData.data.find(k => k.c === character);

    if (!entry) {
      // Try vocabulary
      try {
        const vData = await loadVocabCommon();
        const vocabEntry = vData.data.find(v => v.k === character || v.r === character);
        if (vocabEntry) {
          return { ...vocabEntryToKanji(vocabEntry), radicals: [] };
        }
      } catch { /* ignore */ }
      return null;
    }

    const kanji = kanjiEntryToKanji(entry);
    const radicals: RadicalInfo[] = [];

    // Get radical components
    try {
      const radicalData = await loadRadicalKanji();
      const components = radicalData.kanjiToRadicals[character];

      if (components) {
        // Also try to get radical info from API
        if (entry.r) {
          try {
            const response = await fetch(`${API_BASE}/kanji?number=${entry.r}`);
            if (response.ok) {
              const radical = await response.json();
              radicals.push({
                radical: {
                  id: radical.id,
                  radicalNumber: radical.radicalNumber,
                  character: radical.character,
                  nameEn: radical.nameEn,
                  nameJp: radical.nameJp,
                  strokeCount: radical.strokeCount,
                  meaning: radical.meaning,
                  position: radical.position,
                },
                isPrimary: true,
                position: radical.position,
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }

    // Get vocabulary examples containing this kanji
    const examples: { word: string; reading: string; meaning: string }[] = [];
    try {
      const vData = await loadVocabCommon();
      const vocabExamples = vData.data
        .filter(v => v.k?.includes(character) && v.c === 1) // Only common words
        .slice(0, 10);

      for (const v of vocabExamples) {
        examples.push({
          word: v.k || v.r,
          reading: v.r,
          meaning: v.m.slice(0, 2).join('; '), // First 2 meanings
        });
      }
    } catch { /* ignore */ }

    return { ...kanji, radicals, examples };
  } catch (error) {
    console.error('Get kanji detail error:', error);
    return null;
  }
}

/**
 * Get kanji filtered by JLPT level
 */
export async function getKanjiByJLPT(level: 1 | 2 | 3 | 4 | 5): Promise<Kanji[]> {
  try {
    const loaders: Record<number, () => Promise<KanjiData>> = {
      5: loadKanjiN5,
      4: loadKanjiN4,
      3: loadKanjiN3,
      2: loadKanjiN2,
      1: loadKanjiN1,
    };

    const data = await loaders[level]();
    return data.data.map(kanjiEntryToKanji);
  } catch (error) {
    console.error('Get JLPT kanji error:', error);
    return [];
  }
}

/**
 * Get kanji filtered by grade level
 */
export async function getKanjiByGrade(grade: 'elementary' | 'secondary' | number): Promise<Kanji[]> {
  try {
    if (grade === 'elementary') {
      const data = await loadKanjiElementary();
      return data.data.map(kanjiEntryToKanji);
    }
    if (grade === 'secondary') {
      const data = await loadKanjiSecondary();
      return data.data.map(kanjiEntryToKanji);
    }

    // Individual grade
    const data = await loadData<KanjiData>(`kanji-grade${grade}.json`);
    return data.data.map(kanjiEntryToKanji);
  } catch (error) {
    console.error('Get grade kanji error:', error);
    return [];
  }
}

/**
 * Get kanji that contain a specific radical
 */
export async function getKanjiByRadical(radical: string): Promise<Kanji[]> {
  try {
    const radicalData = await loadRadicalKanji();
    const kanjiChars = radicalData.radicalToKanji[radical] || [];

    if (kanjiChars.length === 0) return [];

    const kData = await loadKanji();
    const results: Kanji[] = [];

    for (const char of kanjiChars.slice(0, 100)) {
      const entry = kData.data.find(k => k.c === char);
      if (entry) results.push(kanjiEntryToKanji(entry));
    }

    return results;
  } catch (error) {
    console.error('Get kanji by radical error:', error);
    return [];
  }
}

/**
 * Get vocabulary containing a specific kanji
 */
export async function getVocabByKanji(kanjiChar: string): Promise<Kanji[]> {
  try {
    const vData = await loadVocabCommon();
    return vData.data
      .filter(v => v.k?.includes(kanjiChar))
      .slice(0, 50)
      .map(vocabEntryToKanji);
  } catch (error) {
    console.error('Get vocab by kanji error:', error);
    return [];
  }
}

/**
 * Get dictionary statistics
 */
export async function getDictionaryStats(): Promise<StatsData | null> {
  try {
    return await loadStats();
  } catch {
    return null;
  }
}

// ============================================
// User Kanji Management
// ============================================

export async function getUserSavedKanji(token: string): Promise<UserSavedKanji[]> {
  const response = await fetch(`${API_BASE}/user-kanji`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get saved kanji: ${response.statusText}`);
  }

  const data = await response.json();
  return data.savedKanji || [];
}

export async function saveKanji(
  kanjiCharacter: string,
  note: string = '',
  folder: string = 'default',
  token: string
): Promise<UserSavedKanji> {
  const response = await fetch(`${API_BASE}/user-kanji`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ character: kanjiCharacter, note, folder }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save kanji: ${response.statusText}`);
  }

  const data = await response.json();
  return data.savedKanji;
}

export async function updateSavedKanji(
  savedKanjiId: string,
  updates: { note?: string; folder?: string },
  token: string
): Promise<UserSavedKanji> {
  const response = await fetch(`${API_BASE}/user-kanji`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: savedKanjiId, ...updates }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update saved kanji: ${response.statusText}`);
  }

  const data = await response.json();
  return data.savedKanji;
}

export async function deleteSavedKanji(savedKanjiId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/user-kanji`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: savedKanjiId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete saved kanji: ${response.statusText}`);
  }
}

export async function getUserKanjiProgress(token: string): Promise<UserKanjiProgress[]> {
  const response = await fetch(`${API_BASE}/user-kanji?progress=true`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get kanji progress: ${response.statusText}`);
  }

  const data = await response.json();
  return data.progress || [];
}

export async function updateKanjiProgress(
  kanjiId: string,
  correct: boolean,
  token: string
): Promise<UserKanjiProgress> {
  const response = await fetch(`${API_BASE}/user-kanji/progress`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ kanjiId, correct }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update progress: ${response.statusText}`);
  }

  const data = await response.json();
  return data.progress;
}

// ============================================
// Caching utilities
// ============================================

const CACHE_KEY = 'gojun-kanji-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface CacheEntry {
  data: Kanji;
  timestamp: number;
}

type KanjiCache = Record<string, CacheEntry>;

function getCache(): KanjiCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

function setCache(character: string, data: Kanji): void {
  try {
    const cache = getCache();
    cache[character] = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

function getCachedKanji(character: string): Kanji | null {
  const cache = getCache();
  const entry = cache[character];
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  return null;
}

export async function getKanjiWithCache(character: string, token?: string): Promise<KanjiDetail | null> {
  const cached = getCachedKanji(character);
  if (cached) return cached as KanjiDetail;

  const kanji = await getKanjiDetail(character, token);
  if (kanji) setCache(character, kanji);
  return kanji;
}

export function clearKanjiCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Preload essential dictionary data for faster searches
 */
export async function preloadDictionary(): Promise<void> {
  await Promise.all([
    loadKanji(),
    loadReadingIndex(),
    loadMeaningIndex(),
  ]);
}

/**
 * Preload JLPT level data
 */
export async function preloadJLPTLevel(level: 1 | 2 | 3 | 4 | 5): Promise<void> {
  const loaders: Record<number, () => Promise<KanjiData>> = {
    5: loadKanjiN5,
    4: loadKanjiN4,
    3: loadKanjiN3,
    2: loadKanjiN2,
    1: loadKanjiN1,
  };
  await loaders[level]();
}
