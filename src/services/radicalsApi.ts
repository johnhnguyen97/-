// Radicals API Service
// Handles radical lookups and browsing

import type {
  Radical,
  RadicalWithKanji,
  RadicalPosition,
} from '../types/kanji';

const API_BASE = '/api';

// ============================================
// Cache for radicals (they rarely change)
// ============================================
let radicalsCache: Radical[] | null = null;
let radicalsCacheTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// ============================================
// Get All Radicals
// ============================================

/**
 * Get all 214 Kangxi radicals
 */
export async function getAllRadicals(): Promise<Radical[]> {
  // Check cache
  if (radicalsCache && Date.now() - radicalsCacheTime < CACHE_DURATION) {
    return radicalsCache;
  }

  const response = await fetch(`${API_BASE}/kanji`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch radicals: ${response.statusText}`);
  }

  const data = await response.json();
  radicalsCache = data.radicals || [];
  radicalsCacheTime = Date.now();

  return radicalsCache || [];
}

/**
 * Get radicals filtered by stroke count
 */
export async function getRadicalsByStroke(strokeCount: number): Promise<Radical[]> {
  const response = await fetch(`${API_BASE}/kanji?strokeCount=${strokeCount}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch radicals: ${response.statusText}`);
  }

  const data = await response.json();
  return data.radicals || [];
}

/**
 * Get radicals filtered by position
 */
export async function getRadicalsByPosition(position: RadicalPosition): Promise<Radical[]> {
  const response = await fetch(`${API_BASE}/kanji?position=${position}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch radicals: ${response.statusText}`);
  }

  const data = await response.json();
  return data.radicals || [];
}

/**
 * Get radicals grouped by stroke count
 */
export async function getRadicalsGrouped(): Promise<Record<number, Radical[]>> {
  const response = await fetch(`${API_BASE}/kanji?grouped=true`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch grouped radicals: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get radicals grouped by position
 */
export async function getRadicalsByPositionGrouped(): Promise<Record<string, Radical[]>> {
  const response = await fetch(`${API_BASE}/kanji?byPosition=true`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch radicals by position: ${response.statusText}`);
  }

  return await response.json();
}

// ============================================
// Get Single Radical
// ============================================

/**
 * Get a specific radical by number (1-214)
 */
export async function getRadicalByNumber(radicalNumber: number): Promise<Radical | null> {
  // Try cache first
  if (radicalsCache) {
    const cached = radicalsCache.find(r => r.radicalNumber === radicalNumber);
    if (cached) return cached;
  }

  const response = await fetch(`${API_BASE}/kanji?number=${radicalNumber}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch radical: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get a radical with all kanji that contain it
 */
export async function getRadicalWithKanji(radicalNumber: number): Promise<RadicalWithKanji | null> {
  const response = await fetch(`${API_BASE}/kanji?number=${radicalNumber}&kanji=true`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch radical with kanji: ${response.statusText}`);
  }

  return await response.json();
}

// ============================================
// Search & Lookup Helpers
// ============================================

/**
 * Find a radical by character
 */
export async function findRadicalByCharacter(character: string): Promise<Radical | null> {
  const radicals = await getAllRadicals();
  return radicals.find(r => r.character === character) || null;
}

/**
 * Search radicals by name or meaning
 */
export async function searchRadicals(query: string): Promise<Radical[]> {
  const radicals = await getAllRadicals();
  const lowerQuery = query.toLowerCase();

  return radicals.filter(r =>
    r.nameEn.toLowerCase().includes(lowerQuery) ||
    r.meaning?.toLowerCase().includes(lowerQuery) ||
    r.character === query
  );
}

/**
 * Get radicals that indicate certain sounds
 */
export async function getPhoneticRadicals(): Promise<Radical[]> {
  const radicals = await getAllRadicals();
  return radicals.filter(r => r.soundHint);
}

// ============================================
// Stroke Count Helpers
// ============================================

/**
 * Get the range of stroke counts for radicals
 */
export async function getStrokeCountRange(): Promise<{ min: number; max: number }> {
  const radicals = await getAllRadicals();
  const strokeCounts = radicals.map(r => r.strokeCount);
  return {
    min: Math.min(...strokeCounts),
    max: Math.max(...strokeCounts),
  };
}

/**
 * Get count of radicals per stroke count
 */
export async function getRadicalCountsByStroke(): Promise<Record<number, number>> {
  const radicals = await getAllRadicals();
  const counts: Record<number, number> = {};

  for (const radical of radicals) {
    counts[radical.strokeCount] = (counts[radical.strokeCount] || 0) + 1;
  }

  return counts;
}

// ============================================
// Position Helpers
// ============================================

/**
 * Get all unique positions
 */
export async function getUniquePositions(): Promise<RadicalPosition[]> {
  const radicals = await getAllRadicals();
  const positions = new Set<RadicalPosition>();

  for (const radical of radicals) {
    if (radical.position) {
      positions.add(radical.position);
    }
  }

  return Array.from(positions);
}

/**
 * Get position label in Japanese and English
 */
export function getPositionInfo(position: RadicalPosition): { japanese: string; english: string; description: string } {
  const positionInfo: Record<RadicalPosition, { japanese: string; english: string; description: string }> = {
    hen: { japanese: '偏', english: 'hen', description: 'Left side of kanji' },
    tsukuri: { japanese: '旁', english: 'tsukuri', description: 'Right side of kanji' },
    kanmuri: { japanese: '冠', english: 'kanmuri', description: 'Top of kanji' },
    ashi: { japanese: '脚', english: 'ashi', description: 'Bottom of kanji' },
    tare: { japanese: '垂', english: 'tare', description: 'Top and left side' },
    nyou: { japanese: '繞', english: 'nyou', description: 'Left and bottom' },
    kamae: { japanese: '構', english: 'kamae', description: 'Enclosure around kanji' },
    other: { japanese: '他', english: 'other', description: 'Other positions' },
  };

  return positionInfo[position];
}

// ============================================
// Clear Cache
// ============================================

/**
 * Clear the radicals cache
 */
export function clearRadicalsCache(): void {
  radicalsCache = null;
  radicalsCacheTime = 0;
}
