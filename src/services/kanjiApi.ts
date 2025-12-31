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
  c: string;      // character
  s: number;      // stroke count
  g: number | null; // grade
  j: number | null; // JLPT level (1-4, where 1 is hardest)
  f: number | null; // frequency
  r: number | null; // radical number
  o: string[] | null; // on'yomi
  k: string[] | null; // kun'yomi
  m: string[];    // meanings
  n: string[] | null; // nanori (name readings)
}

interface VocabEntry {
  id: string;
  k: string | null; // kanji form
  r: string;        // reading (kana)
  p: string[] | null; // parts of speech
  m: string[];      // meanings
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
}

// ============================================
// Data Loading & Caching
// ============================================

let kanjiData: KanjiData | null = null;
let vocabData: VocabData | null = null;
let kanjiDataLoading: Promise<KanjiData> | null = null;
let vocabDataLoading: Promise<VocabData> | null = null;

async function loadKanjiData(): Promise<KanjiData> {
  if (kanjiData) return kanjiData;
  if (kanjiDataLoading) return kanjiDataLoading;

  kanjiDataLoading = fetch('/data/kanji.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load kanji data');
      return res.json();
    })
    .then(data => {
      kanjiData = data;
      kanjiDataLoading = null;
      return data;
    })
    .catch(err => {
      kanjiDataLoading = null;
      throw err;
    });

  return kanjiDataLoading;
}

async function loadVocabData(): Promise<VocabData> {
  if (vocabData) return vocabData;
  if (vocabDataLoading) return vocabDataLoading;

  vocabDataLoading = fetch('/data/vocab.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load vocabulary data');
      return res.json();
    })
    .then(data => {
      vocabData = data;
      vocabDataLoading = null;
      return data;
    })
    .catch(err => {
      vocabDataLoading = null;
      throw err;
    });

  return vocabDataLoading;
}

// ============================================
// Transform functions
// ============================================

function kanjiEntryToKanji(entry: KanjiEntry): Kanji {
  // Convert JLPT level (1-4 in data) to N5-N1 format
  type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
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
    strokeCount: 0, // Not available for vocab
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
    // Load both kanji and vocab data
    const [kData, vData] = await Promise.all([
      loadKanjiData().catch(() => null),
      loadVocabData().catch(() => null),
    ]);

    const results: Kanji[] = [];

    // Search kanji
    if (kData) {
      const kanjiResults = kData.data.filter(entry => {
        // Exact character match
        if (entry.c === query) return true;

        // Reading match (on'yomi or kun'yomi)
        if (entry.o?.some(r => r.includes(query))) return true;
        if (entry.k?.some(r => r.includes(query))) return true;

        // Meaning match
        if (entry.m.some(m => m.toLowerCase().includes(normalizedQuery))) return true;

        return false;
      }).slice(0, 50);

      results.push(...kanjiResults.map(kanjiEntryToKanji));
    }

    // Search vocabulary if we have few kanji results
    if (vData && results.length < 20) {
      const vocabResults = vData.data.filter(entry => {
        // Kanji/reading match
        if (entry.k === query || entry.r === query) return true;
        if (entry.k?.includes(query) || entry.r.includes(query)) return true;

        // Meaning match
        if (entry.m.some(m => m.toLowerCase().includes(normalizedQuery))) return true;

        return false;
      }).slice(0, 30);

      results.push(...vocabResults.map(vocabEntryToKanji));
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
    const kData = await loadKanjiData();
    const entry = kData.data.find(k => k.c === character);

    if (!entry) {
      // Try vocabulary
      const vData = await loadVocabData();
      const vocabEntry = vData.data.find(v => v.k === character || v.r === character);

      if (vocabEntry) {
        return {
          ...vocabEntryToKanji(vocabEntry),
          radicals: [],
        };
      }

      return null;
    }

    const kanji = kanjiEntryToKanji(entry);

    // Build radicals array if we have radical number
    const radicals: RadicalInfo[] = [];
    if (entry.r) {
      // Fetch radical info from API
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
      } catch {
        // Ignore radical fetch errors
      }
    }

    return {
      ...kanji,
      radicals,
    };
  } catch (error) {
    console.error('Get kanji detail error:', error);
    return null;
  }
}

/**
 * Get kanji filtered by JLPT level
 */
export async function getKanjiByJLPT(
  level: number,
  _token?: string
): Promise<Kanji[]> {
  try {
    const kData = await loadKanjiData();
    const filtered = kData.data
      .filter(k => k.j === level)
      .map(kanjiEntryToKanji);

    return filtered;
  } catch (error) {
    console.error('Get JLPT kanji error:', error);
    return [];
  }
}

/**
 * Get kanji filtered by grade level
 */
export async function getKanjiByGrade(
  grade: number,
  _token?: string
): Promise<Kanji[]> {
  try {
    const kData = await loadKanjiData();
    const filtered = kData.data
      .filter(k => k.g === grade)
      .map(kanjiEntryToKanji);

    return filtered;
  } catch (error) {
    console.error('Get grade kanji error:', error);
    return [];
  }
}

/**
 * Get vocabulary by kanji character
 */
export async function getVocabByKanji(
  kanjiChar: string,
  _token?: string
): Promise<Kanji[]> {
  try {
    const vData = await loadVocabData();
    const filtered = vData.data
      .filter(v => v.k?.includes(kanjiChar))
      .slice(0, 50)
      .map(vocabEntryToKanji);

    return filtered;
  } catch (error) {
    console.error('Get vocab by kanji error:', error);
    return [];
  }
}

// ============================================
// User Kanji Management
// ============================================

/**
 * Get user's saved kanji collection
 */
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

/**
 * Save a kanji to user's collection
 */
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

/**
 * Update a saved kanji's note or folder
 */
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

/**
 * Remove a kanji from user's collection
 */
export async function deleteSavedKanji(
  savedKanjiId: string,
  token: string
): Promise<void> {
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

/**
 * Get user's kanji learning progress
 */
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

/**
 * Update kanji learning progress
 */
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
// Caching utilities (for user-specific data)
// ============================================

const CACHE_KEY = 'gojun-kanji-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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
  } catch {
    // Ignore cache errors
  }
}

function getCachedKanji(character: string): Kanji | null {
  const cache = getCache();
  const entry = cache[character];
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  return null;
}

/**
 * Get kanji with local caching
 */
export async function getKanjiWithCache(
  character: string,
  token?: string
): Promise<KanjiDetail | null> {
  // Check local cache first
  const cached = getCachedKanji(character);
  if (cached) {
    return cached as KanjiDetail;
  }

  // Fetch from data
  const kanji = await getKanjiDetail(character, token);
  if (kanji) {
    setCache(character, kanji);
  }
  return kanji;
}

/**
 * Clear the kanji cache
 */
export function clearKanjiCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Preload dictionary data for faster searches
 */
export async function preloadDictionary(): Promise<void> {
  await Promise.all([
    loadKanjiData(),
    loadVocabData(),
  ]);
}
