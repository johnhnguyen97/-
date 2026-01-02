import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Drill Engine API
 *
 * This endpoint generates drill questions using the Grammar Engine's verbs table.
 * It uses pre-computed conjugations from our algorithm-based engine.
 *
 * This is the preferred endpoint for new drill modes as it:
 * - Uses algorithm-validated conjugations
 * - Supports all 17+ conjugation forms
 * - Includes dictionary form, reading, and romaji
 */

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface Verb {
  id: string;
  dictionary_form: string;
  reading: string;
  romaji: string;
  meaning: string;
  verb_group: 'godan' | 'ichidan' | 'irregular-suru' | 'irregular-kuru';
  jlpt_level: string;
  is_transitive: boolean | null;
  conjugations: Record<string, ConjugationForm>;
}

interface ConjugationForm {
  kanji: string;
  reading: string;
  romaji: string;
}

interface DrillQuestion {
  verb: {
    dictionary_form: string;
    reading: string;
    romaji: string;
    meaning: string;
    verb_group: string;
  };
  targetForm: string;
  targetFormLabel: string;
  prompt: string;
  correctAnswer: ConjugationForm;
  options: Array<ConjugationForm & { form: string; isCorrect: boolean }>;
}

// Form labels for prompts
const FORM_LABELS: Record<string, { en: string; jp: string; prompt: string }> = {
  dictionary: { en: 'Dictionary Form', jp: '辞書形', prompt: 'What is the dictionary form?' },
  negative: { en: 'Negative', jp: 'ない形', prompt: 'Convert to negative form' },
  past: { en: 'Past', jp: 'た形', prompt: 'Convert to past tense' },
  past_negative: { en: 'Past Negative', jp: 'なかった形', prompt: 'Convert to past negative' },
  masu: { en: 'Polite (ます)', jp: 'ます形', prompt: 'Convert to polite form' },
  masen: { en: 'Polite Negative', jp: 'ません形', prompt: 'Convert to polite negative' },
  mashita: { en: 'Polite Past', jp: 'ました形', prompt: 'Convert to polite past' },
  masen_deshita: { en: 'Polite Past Negative', jp: 'ませんでした形', prompt: 'Convert to polite past negative' },
  te: { en: 'Te-form', jp: 'て形', prompt: 'Convert to te-form' },
  potential: { en: 'Potential', jp: '可能形', prompt: 'Convert to potential form' },
  volitional: { en: 'Volitional', jp: '意志形', prompt: 'Convert to volitional form' },
  imperative: { en: 'Imperative', jp: '命令形', prompt: 'Convert to imperative form' },
  passive: { en: 'Passive', jp: '受身形', prompt: 'Convert to passive form' },
  causative: { en: 'Causative', jp: '使役形', prompt: 'Convert to causative form' },
  conditional_ba: { en: 'Conditional (ば)', jp: '仮定形', prompt: 'Convert to ば-conditional' },
  conditional_tara: { en: 'Conditional (たら)', jp: 'たら形', prompt: 'Convert to たら-conditional' },
  tai: { en: 'Want to (~たい)', jp: 'たい形', prompt: 'Convert to たい-form' },
};

// Verb group labels
const VERB_GROUP_LABELS: Record<string, string> = {
  godan: 'Godan (五段)',
  ichidan: 'Ichidan (一段)',
  'irregular-suru': 'Irregular (する)',
  'irregular-kuru': 'Irregular (来る)',
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const {
      jlpt_level = 'N5',
      verb_group,
      forms = 'te,masu,negative,past',
      count = '10',
      mode = 'mc', // mc (multiple choice) or input
    } = req.query as Record<string, string>;

    const formList = forms.split(',').filter(f => FORM_LABELS[f]);
    const questionCount = Math.min(parseInt(count, 10), 30);

    // Build query
    let query = supabase
      .from('verbs')
      .select('*')
      .eq('jlpt_level', jlpt_level);

    if (verb_group) {
      query = query.eq('verb_group', verb_group);
    }

    const { data: verbs, error } = await query;

    if (error) {
      console.error('Verb fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch verbs' });
    }

    if (!verbs || verbs.length === 0) {
      return res.status(200).json({
        questions: [],
        message: 'No verbs found for the selected criteria'
      });
    }

    // Build all valid verb+form combinations
    const combinations: Array<{ verb: Verb; form: string }> = [];

    for (const verb of verbs as Verb[]) {
      for (const form of formList) {
        if (verb.conjugations?.[form]) {
          combinations.push({ verb, form });
        }
      }
    }

    if (combinations.length === 0) {
      return res.status(200).json({
        questions: [],
        message: 'No valid combinations found'
      });
    }

    // Shuffle and generate questions
    const shuffled = shuffleArray(combinations);
    const questions: DrillQuestion[] = [];
    let idx = 0;

    while (questions.length < questionCount) {
      if (idx >= shuffled.length) {
        // Reshuffle if we need more questions
        shuffleArray(shuffled);
        idx = 0;
      }

      const { verb, form } = shuffled[idx];
      const correctAnswer = verb.conjugations[form];
      const formLabel = FORM_LABELS[form];

      // Generate distractors from other forms
      const otherForms = Object.entries(verb.conjugations)
        .filter(([key]) => key !== form)
        .map(([key, val]) => ({
          ...val,
          form: key,
          isCorrect: false,
        }))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = shuffleArray([
        { ...correctAnswer, form, isCorrect: true },
        ...otherForms,
      ]);

      questions.push({
        verb: {
          dictionary_form: verb.dictionary_form,
          reading: verb.reading,
          romaji: verb.romaji,
          meaning: verb.meaning,
          verb_group: VERB_GROUP_LABELS[verb.verb_group] || verb.verb_group,
        },
        targetForm: form,
        targetFormLabel: `${formLabel.en} (${formLabel.jp})`,
        prompt: formLabel.prompt,
        correctAnswer,
        options,
      });

      idx++;
    }

    return res.status(200).json({
      questions,
      meta: {
        jlpt_level,
        forms: formList,
        verb_group: verb_group || 'all',
        mode,
        totalVerbs: verbs.length,
        totalCombinations: combinations.length,
        questionCount: questions.length,
      },
    });
  } catch (error) {
    console.error('Drill Engine API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
