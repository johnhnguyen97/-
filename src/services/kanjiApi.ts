// Kanji API Service
// Handles kanji lookups, caching, and user kanji management

import type {
  Kanji,
  KanjiDetail,
  KanjiSearchParams,
  KanjiSearchResult,
  UserKanjiProgress,
  UserSavedKanji,
  KanjiAliveResponse,
  RadicalInfo,
} from '../types/kanji';

const API_BASE = '/api';

// ============================================
// Transform API response to our types
// ============================================
function transformKanjiAliveToKanji(data: KanjiAliveResponse): Kanji {
  return {
    id: '', // Will be set from cache or generated
    character: data.kanji?.character || '',
    strokeCount: data.kanji?.strokes?.count || 0,
    jlptLevel: undefined, // Kanji Alive doesn't provide JLPT
    meaningEn: data.kanji?.meaning?.english || '',
    onyomi: data.kanji?.onyomi?.katakana,
    kunyomi: data.kanji?.kunyomi?.hiragana,
    onyomiRomaji: data.kanji?.onyomi?.romaji,
    kunyomiRomaji: data.kanji?.kunyomi?.romaji,
    grade: data.references?.grade,
    radicalNumber: data.radical?.strokes,
    radicalMeaning: data.radical?.meaning?.english,
    videoUrl: data.kanji?.video?.mp4,
    audioOnyomiUrl: data.kanji?.audio?.mp3,
    strokeOrderImages: data.kanji?.strokes?.images,
    examples: data.examples?.map(ex => ({
      word: ex.japanese,
      reading: '', // Not provided by API
      meaning: ex.meaning?.english || '',
      audioUrl: ex.audio?.mp3,
    })),
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
  token?: string
): Promise<KanjiSearchResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}/kanji-alive?search=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Check if it's an API key issue
      if (response.status === 500 && errorData.message?.includes('RAPIDAPI_KEY')) {
        throw new Error('Kanji API not configured. Please use the Radicals tab to browse radicals.');
      }
      throw new Error(errorData.error || `Search failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle empty results
    if (!data.results || data.results.length === 0) {
      return { kanji: [], total: 0, hasMore: false };
    }

    return {
      kanji: (data.results || []).map((item: KanjiAliveResponse) => ({
        id: item.kanji?.character || '',
        character: item.kanji?.character || '',
        strokeCount: item.kanji?.strokes?.count || 0,
        meaningEn: item.kanji?.meaning?.english || '',
        onyomi: item.kanji?.onyomi?.katakana,
        kunyomi: item.kanji?.kunyomi?.hiragana,
      })),
      total: data.total || 0,
      hasMore: false,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to search kanji. Try the Radicals tab instead.');
  }
}

/**
 * Advanced search with multiple filters
 */
export async function advancedSearchKanji(
  params: KanjiSearchParams,
  token?: string
): Promise<KanjiSearchResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const queryParams = new URLSearchParams();
  if (params.query) queryParams.append('meaning', params.query);
  if (params.strokeCount) queryParams.append('stroke', params.strokeCount.toString());
  if (params.radicalNumber) queryParams.append('radical', params.radicalNumber.toString());
  if (params.grade) queryParams.append('grade', params.grade.toString());

  const response = await fetch(`${API_BASE}/kanji-alive?${queryParams.toString()}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Advanced search failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    kanji: (data.results || []).map((item: KanjiAliveResponse) => ({
      id: item.kanji?.character || '',
      character: item.kanji?.character || '',
      strokeCount: item.kanji?.strokes?.count || 0,
      meaningEn: item.kanji?.meaning?.english || '',
      onyomi: item.kanji?.onyomi?.katakana,
      kunyomi: item.kanji?.kunyomi?.hiragana,
    })),
    total: data.total || 0,
    hasMore: false,
  };
}

/**
 * Get detailed information for a single kanji
 */
export async function getKanjiDetail(
  character: string,
  token?: string
): Promise<KanjiDetail | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/kanji-alive?character=${encodeURIComponent(character)}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to get kanji: ${response.statusText}`);
  }

  const data: KanjiAliveResponse = await response.json();
  const kanji = transformKanjiAliveToKanji(data);

  // Build radicals array
  const radicals: RadicalInfo[] = [];
  if (data.radical) {
    radicals.push({
      radical: {
        id: '',
        radicalNumber: data.radical.strokes || 0,
        character: data.radical.character || '',
        nameEn: data.radical.name?.romaji || '',
        nameJp: data.radical.name?.hiragana,
        strokeCount: data.radical.strokes || 0,
        meaning: data.radical.meaning?.english,
        position: data.radical.position?.romaji as 'hen' | 'tsukuri' | 'kanmuri' | 'ashi' | 'tare' | 'nyou' | 'kamae' | 'other' | undefined,
      },
      isPrimary: true,
      position: data.radical.position?.romaji,
    });
  }

  return {
    ...kanji,
    radicals,
  };
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
// Caching utilities
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

  // Fetch from API
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
