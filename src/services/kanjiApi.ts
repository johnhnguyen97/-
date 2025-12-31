// Kanji API Service
// Handles kanji lookups via radicals (JMdict integration coming soon)

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
// Kanji Search & Lookup
// ============================================

/**
 * Search for kanji by query (character, reading, or meaning)
 * Currently searches through radicals - full JMdict search coming soon
 */
export async function searchKanji(
  query: string,
  _token?: string
): Promise<KanjiSearchResult> {
  // For now, return empty results with a helpful message
  // JMdict integration will enable full kanji search

  // Try to find if the query matches a radical character
  try {
    const response = await fetch(`${API_BASE}/kanji`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      const radicals = data.radicals || [];

      // Search radicals by character, name, or meaning
      const lowerQuery = query.toLowerCase();
      const matchingRadicals = radicals.filter((r: { character: string; nameEn: string; meaning?: string }) =>
        r.character === query ||
        r.nameEn.toLowerCase().includes(lowerQuery) ||
        r.meaning?.toLowerCase().includes(lowerQuery)
      );

      if (matchingRadicals.length > 0) {
        // Convert matching radicals to kanji-like format for display
        return {
          kanji: matchingRadicals.map((r: { character: string; nameEn: string; strokeCount: number; meaning?: string }) => ({
            id: r.character,
            character: r.character,
            strokeCount: r.strokeCount,
            meaningEn: r.meaning || r.nameEn,
            onyomi: undefined,
            kunyomi: undefined,
          })),
          total: matchingRadicals.length,
          hasMore: false,
        };
      }
    }
  } catch {
    // Ignore errors, return empty
  }

  return { kanji: [], total: 0, hasMore: false };
}

/**
 * Get detailed information for a single kanji
 * Currently returns radical info if character is a radical
 */
export async function getKanjiDetail(
  character: string,
  _token?: string
): Promise<KanjiDetail | null> {
  try {
    // Check if the character is a radical
    const response = await fetch(`${API_BASE}/kanji`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      const radicals = data.radicals || [];
      const radical = radicals.find((r: { character: string }) => r.character === character);

      if (radical) {
        const radicalInfo: RadicalInfo = {
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
        };

        return {
          id: radical.id,
          character: radical.character,
          strokeCount: radical.strokeCount,
          meaningEn: radical.meaning || radical.nameEn,
          onyomi: undefined,
          kunyomi: undefined,
          radicals: [radicalInfo],
        };
      }
    }
  } catch {
    // Ignore errors
  }

  return null;
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
