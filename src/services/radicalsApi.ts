// Radicals API Service
// Handles radical lookups and browsing

import type {
  Radical,
  RadicalWithKanji,
  RadicalPosition,
  KanjiSummary,
} from '../types/kanji';

const API_BASE = '/api';

// ============================================
// Cache for radicals (they rarely change)
// ============================================
let radicalsCache: Radical[] | null = null;
let radicalsCacheTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// ============================================
// Bundled Data Types
// ============================================

interface RadicalKanjiData {
  version: string;
  radicalCount: number;
  kanjiCount: number;
  radicalToKanji: Record<string, string[]>;
  kanjiToRadicals: Record<string, string[]>;
}

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
}

interface KanjiData {
  version: string;
  count: number;
  data: KanjiEntry[];
}

// Bundled data cache
const bundledDataCache: Record<string, unknown> = {};

async function loadBundledData<T>(filename: string): Promise<T> {
  if (bundledDataCache[filename]) return bundledDataCache[filename] as T;

  const res = await fetch(`/data/${filename}`);
  if (!res.ok) throw new Error(`Failed to load ${filename}`);
  const data = await res.json();
  bundledDataCache[filename] = data;
  return data;
}

const loadRadicalKanjiData = () => loadBundledData<RadicalKanjiData>('radical-kanji.json');
const loadKanjiData = () => loadBundledData<KanjiData>('kanji.json');

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
 * Now uses bundled radical-kanji.json data for faster, offline access
 */
export async function getRadicalWithKanji(radicalNumber: number): Promise<RadicalWithKanji | null> {
  try {
    // Get the radical first
    const radical = await getRadicalByNumber(radicalNumber);
    if (!radical) return null;

    // Load bundled radical-kanji mappings and kanji data
    const [radicalKanjiData, kanjiData] = await Promise.all([
      loadRadicalKanjiData(),
      loadKanjiData(),
    ]);

    // Find all kanji containing this radical character
    const kanjiChars = radicalKanjiData.radicalToKanji[radical.character] || [];

    // Map to KanjiSummary objects
    const kanjiList: KanjiSummary[] = [];
    const jlptMap: Record<number, 'N1' | 'N2' | 'N3' | 'N4' | 'N5'> = {
      1: 'N1', 2: 'N2', 3: 'N3', 4: 'N4', 5: 'N5'
    };

    for (const char of kanjiChars.slice(0, 100)) { // Limit to 100 for performance
      const entry = kanjiData.data.find(k => k.c === char);
      if (entry) {
        kanjiList.push({
          id: entry.c,
          character: entry.c,
          strokeCount: entry.s,
          jlptLevel: entry.j ? jlptMap[entry.j] : undefined,
          meaningEn: entry.m.join(', '),
          onyomi: entry.o?.join('、'),
          kunyomi: entry.k?.join('、'),
        });
      }
    }

    // Sort by stroke count, then JLPT level
    kanjiList.sort((a, b) => {
      if (a.strokeCount !== b.strokeCount) return a.strokeCount - b.strokeCount;
      const jlptOrder = { 'N5': 1, 'N4': 2, 'N3': 3, 'N2': 4, 'N1': 5 };
      const aOrder = a.jlptLevel ? jlptOrder[a.jlptLevel] : 6;
      const bOrder = b.jlptLevel ? jlptOrder[b.jlptLevel] : 6;
      return aOrder - bOrder;
    });

    return {
      ...radical,
      kanjiList,
      kanjiCount: kanjiChars.length,
    };
  } catch (error) {
    console.error('Failed to get radical with kanji from bundled data:', error);

    // Fallback to API if bundled data fails
    const response = await fetch(`${API_BASE}/kanji?number=${radicalNumber}&kanji=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch radical with kanji: ${response.statusText}`);
    }

    return await response.json();
  }
}

/**
 * Get all kanji containing a specific radical character
 * Uses bundled data for fast, offline access
 */
export async function getKanjiByRadicalChar(radicalChar: string): Promise<KanjiSummary[]> {
  try {
    const [radicalKanjiData, kanjiData] = await Promise.all([
      loadRadicalKanjiData(),
      loadKanjiData(),
    ]);

    const kanjiChars = radicalKanjiData.radicalToKanji[radicalChar] || [];
    const jlptMap: Record<number, 'N1' | 'N2' | 'N3' | 'N4' | 'N5'> = {
      1: 'N1', 2: 'N2', 3: 'N3', 4: 'N4', 5: 'N5'
    };

    const results: KanjiSummary[] = [];
    for (const char of kanjiChars.slice(0, 100)) {
      const entry = kanjiData.data.find(k => k.c === char);
      if (entry) {
        results.push({
          id: entry.c,
          character: entry.c,
          strokeCount: entry.s,
          jlptLevel: entry.j ? jlptMap[entry.j] : undefined,
          meaningEn: entry.m.join(', '),
          onyomi: entry.o?.join('、'),
          kunyomi: entry.k?.join('、'),
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to get kanji by radical:', error);
    return [];
  }
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
