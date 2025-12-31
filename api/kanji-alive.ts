import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for caching
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Kanji Alive RapidAPI configuration
const RAPIDAPI_HOST = 'kanjialive-api.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface KanjiAliveResponse {
  kanji?: {
    character: string;
    meaning: { english: string };
    strokes: { count: number; images?: string[] };
    onyomi: { romaji: string; katakana: string };
    kunyomi: { romaji: string; hiragana: string };
    video?: { mp4: string; poster?: string };
    audio?: { mp3: string };
  };
  radical?: {
    character: string;
    strokes: number;
    image?: string;
    position?: { hiragana: string; romaji: string; icon?: string };
    name?: { hiragana: string; romaji: string };
    meaning?: { english: string };
    animation?: string[];
  };
  references?: {
    grade: number;
    kodansha?: string;
    classic_nelson?: string;
  };
  examples?: Array<{
    japanese: string;
    meaning: { english: string };
    audio?: { mp3: string };
  }>;
}

// Fetch from Kanji Alive API
async function fetchFromKanjiAlive(endpoint: string): Promise<KanjiAliveResponse | KanjiAliveResponse[] | null> {
  if (!RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`https://${RAPIDAPI_HOST}${endpoint}`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      console.error(`Kanji Alive API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from Kanji Alive:', error);
    return null;
  }
}

// Cache kanji data in Supabase
async function cacheKanjiData(data: KanjiAliveResponse): Promise<void> {
  if (!data.kanji) return;

  const kanjiData = {
    character: data.kanji.character,
    stroke_count: data.kanji.strokes?.count || 0,
    meaning_en: data.kanji.meaning?.english || '',
    onyomi: data.kanji.onyomi?.katakana || '',
    kunyomi: data.kanji.kunyomi?.hiragana || '',
    onyomi_romaji: data.kanji.onyomi?.romaji || '',
    kunyomi_romaji: data.kanji.kunyomi?.romaji || '',
    grade: data.references?.grade,
    video_url: data.kanji.video?.mp4,
    audio_onyomi_url: data.kanji.audio?.mp3,
    stroke_order_images: data.kanji.strokes?.images || [],
    radical_number: data.radical?.strokes,
    radical_meaning: data.radical?.meaning?.english,
    examples: data.examples?.map(ex => ({
      word: ex.japanese,
      meaning: ex.meaning?.english,
      audioUrl: ex.audio?.mp3,
    })),
  };

  // Upsert to Supabase
  const { error } = await supabase
    .from('kanji')
    .upsert(kanjiData, { onConflict: 'character' });

  if (error) {
    console.error('Error caching kanji:', error);
  }
}

// Check cache first, then fetch from API
async function getKanjiByCharacter(character: string): Promise<KanjiAliveResponse | null> {
  // Check cache first
  const { data: cached } = await supabase
    .from('kanji')
    .select('*')
    .eq('character', character)
    .single();

  if (cached) {
    // Transform cached data to match API response format
    return {
      kanji: {
        character: cached.character,
        meaning: { english: cached.meaning_en },
        strokes: { count: cached.stroke_count, images: cached.stroke_order_images },
        onyomi: { romaji: cached.onyomi_romaji, katakana: cached.onyomi },
        kunyomi: { romaji: cached.kunyomi_romaji, hiragana: cached.kunyomi },
        video: cached.video_url ? { mp4: cached.video_url } : undefined,
        audio: cached.audio_onyomi_url ? { mp3: cached.audio_onyomi_url } : undefined,
      },
      radical: cached.radical_number ? {
        character: '',
        strokes: cached.radical_number,
        meaning: { english: cached.radical_meaning || '' },
      } : undefined,
      references: {
        grade: cached.grade || 0,
      },
      examples: cached.examples,
    };
  }

  // Fetch from API
  const apiData = await fetchFromKanjiAlive(`/api/public/kanji/${encodeURIComponent(character)}`);

  if (apiData && !Array.isArray(apiData)) {
    // Cache the result
    await cacheKanjiData(apiData);
  }

  return apiData as KanjiAliveResponse | null;
}

// Search kanji
async function searchKanji(query: string): Promise<KanjiAliveResponse[]> {
  // Try to search in cache first
  const { data: cached } = await supabase
    .from('kanji')
    .select('*')
    .or(`character.eq.${query},meaning_en.ilike.%${query}%,onyomi.ilike.%${query}%,kunyomi.ilike.%${query}%`)
    .limit(20);

  if (cached && cached.length > 0) {
    return cached.map(item => ({
      kanji: {
        character: item.character,
        meaning: { english: item.meaning_en },
        strokes: { count: item.stroke_count },
        onyomi: { romaji: item.onyomi_romaji, katakana: item.onyomi },
        kunyomi: { romaji: item.kunyomi_romaji, hiragana: item.kunyomi },
      },
      references: { grade: item.grade || 0 },
    }));
  }

  // Fetch from API
  const apiData = await fetchFromKanjiAlive(`/api/public/search/${encodeURIComponent(query)}`);

  return Array.isArray(apiData) ? apiData : apiData ? [apiData] : [];
}

// Advanced search
async function advancedSearch(params: {
  onyomi?: string;
  kunyomi?: string;
  meaning?: string;
  stroke?: number;
  radical?: string;
  grade?: number;
}): Promise<KanjiAliveResponse[]> {
  // Build query string for Kanji Alive API
  const queryParams = new URLSearchParams();
  if (params.onyomi) queryParams.append('on', params.onyomi);
  if (params.kunyomi) queryParams.append('kun', params.kunyomi);
  if (params.meaning) queryParams.append('kem', params.meaning);
  if (params.stroke) queryParams.append('ks', params.stroke.toString());
  if (params.radical) queryParams.append('rad', params.radical);
  if (params.grade) queryParams.append('grade', params.grade.toString());

  const endpoint = `/api/public/search/advanced/?${queryParams.toString()}`;
  const apiData = await fetchFromKanjiAlive(endpoint);

  return Array.isArray(apiData) ? apiData : apiData ? [apiData] : [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { character, search, onyomi, kunyomi, meaning, stroke, radical, grade } = req.query;

    // Get single kanji by character
    if (character && typeof character === 'string') {
      const data = await getKanjiByCharacter(character);
      if (!data) {
        return res.status(404).json({ error: 'Kanji not found' });
      }
      return res.status(200).json(data);
    }

    // Simple search
    if (search && typeof search === 'string') {
      const results = await searchKanji(search);
      return res.status(200).json({ results, total: results.length });
    }

    // Advanced search
    if (onyomi || kunyomi || meaning || stroke || radical || grade) {
      const results = await advancedSearch({
        onyomi: typeof onyomi === 'string' ? onyomi : undefined,
        kunyomi: typeof kunyomi === 'string' ? kunyomi : undefined,
        meaning: typeof meaning === 'string' ? meaning : undefined,
        stroke: stroke ? parseInt(stroke as string, 10) : undefined,
        radical: typeof radical === 'string' ? radical : undefined,
        grade: grade ? parseInt(grade as string, 10) : undefined,
      });
      return res.status(200).json({ results, total: results.length });
    }

    return res.status(400).json({
      error: 'Missing required parameter',
      usage: {
        'character': 'Get single kanji by character (e.g., ?character=日)',
        'search': 'Search by query (e.g., ?search=sun)',
        'advanced': 'Advanced search with onyomi, kunyomi, meaning, stroke, radical, grade',
      }
    });

  } catch (error) {
    console.error('Kanji Alive API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
