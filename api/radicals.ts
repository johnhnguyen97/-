import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface Radical {
  id: string;
  radical_number: number;
  radical_character: string;
  radical_name_en: string;
  radical_name_jp: string | null;
  stroke_count: number;
  meaning: string | null;
  position: string | null;
  sound_hint: string | null;
  svg_url: string | null;
  animation_url: string | null;
}

interface KanjiSummary {
  id: string;
  character: string;
  stroke_count: number;
  jlpt_level: string | null;
  meaning_en: string;
  onyomi: string | null;
  kunyomi: string | null;
}

// Transform database radical to API format
function transformRadical(radical: Radical) {
  return {
    id: radical.id,
    radicalNumber: radical.radical_number,
    character: radical.radical_character,
    nameEn: radical.radical_name_en,
    nameJp: radical.radical_name_jp,
    strokeCount: radical.stroke_count,
    meaning: radical.meaning,
    position: radical.position,
    soundHint: radical.sound_hint,
    svgUrl: radical.svg_url,
    animationUrl: radical.animation_url,
  };
}

// Transform database kanji to API format
function transformKanji(kanji: KanjiSummary) {
  return {
    id: kanji.id,
    character: kanji.character,
    strokeCount: kanji.stroke_count,
    jlptLevel: kanji.jlpt_level,
    meaningEn: kanji.meaning_en,
    onyomi: kanji.onyomi,
    kunyomi: kanji.kunyomi,
  };
}

// Get all radicals
async function getAllRadicals(strokeCount?: number, position?: string) {
  let query = supabase
    .from('radicals')
    .select('*')
    .order('radical_number', { ascending: true });

  if (strokeCount) {
    query = query.eq('stroke_count', strokeCount);
  }
  if (position) {
    query = query.eq('position', position);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch radicals: ${error.message}`);
  }

  return data.map(transformRadical);
}

// Get radical by number
async function getRadicalByNumber(radicalNumber: number) {
  const { data, error } = await supabase
    .from('radicals')
    .select('*')
    .eq('radical_number', radicalNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch radical: ${error.message}`);
  }

  return transformRadical(data);
}

// Get kanji by radical
async function getKanjiByRadical(radicalNumber: number, limit: number = 50) {
  // First get the radical info
  const radical = await getRadicalByNumber(radicalNumber);
  if (!radical) {
    return null;
  }

  // Then get kanji that use this radical
  const { data: kanjiList, error } = await supabase
    .from('kanji')
    .select('id, character, stroke_count, jlpt_level, meaning_en, onyomi, kunyomi')
    .eq('radical_number', radicalNumber)
    .order('stroke_count', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch kanji for radical: ${error.message}`);
  }

  return {
    radical,
    kanjiCount: kanjiList?.length || 0,
    kanjiList: (kanjiList || []).map(transformKanji),
  };
}

// Get radicals grouped by stroke count
async function getRadicalsGrouped() {
  const { data, error } = await supabase
    .from('radicals')
    .select('*')
    .order('stroke_count', { ascending: true })
    .order('radical_number', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch radicals: ${error.message}`);
  }

  // Group by stroke count
  const grouped: Record<number, ReturnType<typeof transformRadical>[]> = {};
  for (const radical of data) {
    const strokeCount = radical.stroke_count;
    if (!grouped[strokeCount]) {
      grouped[strokeCount] = [];
    }
    grouped[strokeCount].push(transformRadical(radical));
  }

  return grouped;
}

// Get radicals by position
async function getRadicalsByPosition() {
  const { data, error } = await supabase
    .from('radicals')
    .select('*')
    .not('position', 'is', null)
    .order('position', { ascending: true })
    .order('stroke_count', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch radicals: ${error.message}`);
  }

  // Group by position
  const grouped: Record<string, ReturnType<typeof transformRadical>[]> = {};
  for (const radical of data) {
    const position = radical.position || 'other';
    if (!grouped[position]) {
      grouped[position] = [];
    }
    grouped[position].push(transformRadical(radical));
  }

  return grouped;
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
    const { number, strokeCount, position, kanji, grouped, byPosition } = req.query;

    // Get single radical by number
    if (number && typeof number === 'string') {
      const radicalNumber = parseInt(number, 10);
      if (isNaN(radicalNumber) || radicalNumber < 1 || radicalNumber > 214) {
        return res.status(400).json({ error: 'Invalid radical number (must be 1-214)' });
      }

      // If kanji=true, also fetch kanji using this radical
      if (kanji === 'true') {
        const data = await getKanjiByRadical(radicalNumber);
        if (!data) {
          return res.status(404).json({ error: 'Radical not found' });
        }
        return res.status(200).json(data);
      }

      const radical = await getRadicalByNumber(radicalNumber);
      if (!radical) {
        return res.status(404).json({ error: 'Radical not found' });
      }
      return res.status(200).json(radical);
    }

    // Get radicals grouped by stroke count
    if (grouped === 'true') {
      const data = await getRadicalsGrouped();
      return res.status(200).json(data);
    }

    // Get radicals grouped by position
    if (byPosition === 'true') {
      const data = await getRadicalsByPosition();
      return res.status(200).json(data);
    }

    // Get all radicals with optional filters
    const radicals = await getAllRadicals(
      strokeCount ? parseInt(strokeCount as string, 10) : undefined,
      position as string | undefined
    );

    return res.status(200).json({
      radicals,
      total: radicals.length,
    });

  } catch (error) {
    console.error('Radicals API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
