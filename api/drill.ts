import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================================
// TYPES
// ============================================================================

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

interface DrillPrompt {
  id: string;
  from_form: string;
  to_form: string;
  prompt_en: string;
  prompt_jp: string;
  explanation: string;
  word_type: string;
  phase: number;
}

interface MCOption {
  id: string;
  text: string;
  reading: string;
  isCorrect: boolean;
  english?: string;
}

interface ValidCombination {
  verb: Verb;
  prompt: DrillPrompt;
}

// ============================================================================
// FORM MAPPING - Grammar engine uses different form names
// ============================================================================

// Map from drill_prompts to_form to grammar engine conjugation keys
const FORM_TO_GRAMMAR_ENGINE: Record<string, string> = {
  // Polite forms
  'masu_positive': 'masu',
  'masu_negative': 'masen',
  'masu_past_positive': 'mashita',
  'masu_past_negative': 'masen_deshita',
  // Plain forms
  'plain_positive': 'dictionary',
  'plain_negative': 'negative',
  'plain_past_positive': 'past',
  'plain_past_negative': 'past_negative',
  // Te-form
  'te_form': 'te',
  // Desire
  'tai_form': 'tai',
  // Volitional
  'volitional': 'volitional',
  // Potential
  'potential_positive': 'potential',
  'potential': 'potential',
  // Conditional
  'conditional_ba': 'conditional_ba',
  'conditional_tara': 'conditional_tara',
  // Passive/Causative
  'passive_positive': 'passive',
  'causative_positive': 'causative',
  // Imperative
  'imperative': 'imperative',
  // Legacy mappings
  'present_positive': 'masu',
  'present_negative': 'masen',
  'past_positive': 'mashita',
  'past_negative': 'masen_deshita',
};

// Map verb_group from grammar engine to drill system
const VERB_GROUP_MAP: Record<string, string> = {
  'godan': 'group1',
  'ichidan': 'group2',
  'irregular-suru': 'group3',
  'irregular-kuru': 'group3',
};

// ============================================================================
// UTILITIES
// ============================================================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getConjugationEnglish(toForm: string): string {
  const formMap: Record<string, string> = {
    'masu': 'do/does (polite)',
    'masen': "don't/doesn't (polite)",
    'mashita': 'did (polite)',
    'masen_deshita': "didn't (polite)",
    'dictionary': 'dictionary form',
    'negative': "don't/doesn't (plain)",
    'past': 'did (plain)',
    'past_negative': "didn't (plain)",
    'te': '-te form',
    'tai': 'want to',
    'volitional': "let's / I'll",
    'potential': 'can do',
    'conditional_ba': 'if (general)',
    'conditional_tara': 'if/when',
    'passive': 'is done (passive)',
    'causative': 'make/let do',
    'imperative': 'do! (command)',
  };
  return formMap[toForm] || toForm;
}

function generateMCOptions(
  correctAnswer: ConjugationForm,
  allConjugations: Record<string, ConjugationForm>,
  toFormKey: string
): MCOption[] {
  const options: MCOption[] = [{
    id: 'correct',
    text: correctAnswer.kanji,
    reading: correctAnswer.reading,
    isCorrect: true,
    english: getConjugationEnglish(toFormKey),
  }];

  // Get other forms as distractors
  const otherForms = Object.entries(allConjugations)
    .filter(([key]) => key !== toFormKey)
    .map(([key, val]) => ({
      id: key,
      text: val.kanji,
      reading: val.reading,
      isCorrect: false,
      english: getConjugationEnglish(key),
    }));

  const shuffledOthers = shuffleArray(otherForms).slice(0, 3);
  options.push(...shuffledOthers);

  return shuffleArray(options);
}

/**
 * Build all valid verb-prompt combinations
 */
function buildValidCombinations(
  verbs: Verb[],
  prompts: DrillPrompt[]
): ValidCombination[] {
  const combinations: ValidCombination[] = [];

  for (const verb of verbs) {
    for (const prompt of prompts) {
      // Map the prompt's to_form to grammar engine's conjugation key
      const grammarEngineKey = FORM_TO_GRAMMAR_ENGINE[prompt.to_form] || prompt.to_form;

      // Check if this conjugation exists for this verb
      if (verb.conjugations && verb.conjugations[grammarEngineKey]) {
        combinations.push({ verb, prompt });
      }
    }
  }

  return combinations;
}

/**
 * Generate questions from valid combinations
 */
function generateQuestionsFromCombinations(
  combinations: ValidCombination[],
  count: number,
  practiceMode: string
): any[] {
  if (combinations.length === 0) {
    return [];
  }

  let shuffled = shuffleArray(combinations);
  const questions: any[] = [];
  let idx = 0;

  while (questions.length < count) {
    if (idx >= shuffled.length) {
      shuffled = shuffleArray(combinations);
      idx = 0;
    }

    const { verb, prompt } = shuffled[idx];
    const grammarEngineKey = FORM_TO_GRAMMAR_ENGINE[prompt.to_form] || prompt.to_form;
    const correctConjugation = verb.conjugations[grammarEngineKey];

    // Convert grammar engine format to drill format
    const correctAnswer = {
      japanese: correctConjugation.kanji,
      reading: correctConjugation.reading,
      romaji: correctConjugation.romaji,
    };

    // Build sentence object (compatible with existing frontend)
    const sentence = {
      id: verb.id,
      japanese_base: verb.dictionary_form,
      english: verb.meaning,
      word_type: 'verb' as const,
      verb_group: VERB_GROUP_MAP[verb.verb_group] || 'group1',
      jlpt_level: verb.jlpt_level,
      dictionary_form: verb.dictionary_form,
      reading: verb.reading,
      romaji: verb.romaji,
      // Convert conjugations to drill format
      conjugations: Object.fromEntries(
        Object.entries(verb.conjugations).map(([key, val]) => [
          key,
          { japanese: val.kanji, reading: val.reading, romaji: val.romaji }
        ])
      ),
    };

    const mcOptions = generateMCOptions(correctConjugation, verb.conjugations, grammarEngineKey);

    questions.push({
      sentence,
      prompt,
      correctAnswer,
      mcOptions,
      practiceMode,
      // Include verb info for grammar sidebar
      verbInfo: {
        dictionary_form: verb.dictionary_form,
        reading: verb.reading,
        meaning: verb.meaning,
        verb_group: verb.verb_group,
        is_transitive: verb.is_transitive,
      },
    });

    idx++;
  }

  return questions;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      phases = '1',
      jlptLevel = 'N5',
      wordTypes = 'verb',
      count = '10',
      practiceMode = 'word',
    } = req.query as Record<string, string>;

    const phaseList = phases.split(',').map(Number);
    const wordTypeList = wordTypes.split(',');
    const questionCount = Math.min(parseInt(count, 10), 30);

    // Only support verbs for now (grammar engine focus)
    if (!wordTypeList.includes('verb')) {
      return res.status(200).json({
        questions: [],
        message: 'Grammar engine currently only supports verbs'
      });
    }

    // Fetch verbs from grammar engine's verbs table
    const { data: verbs, error: verbError } = await supabase
      .from('verbs')
      .select('*')
      .eq('jlpt_level', jlptLevel);

    if (verbError) {
      console.error('Verb fetch error:', verbError);
      return res.status(500).json({ error: 'Failed to fetch verbs from grammar engine' });
    }

    if (!verbs || verbs.length === 0) {
      return res.status(200).json({
        questions: [],
        message: `No verbs found for ${jlptLevel}. Grammar engine has 137 verbs across N5-N1.`
      });
    }

    // Fetch prompts for selected phases
    const { data: prompts, error: promptError } = await supabase
      .from('drill_prompts')
      .select('*')
      .in('phase', phaseList)
      .or('word_type.eq.both,word_type.eq.verb');

    if (promptError) {
      console.error('Prompt fetch error:', promptError);
      return res.status(500).json({ error: 'Failed to fetch prompts' });
    }

    if (!prompts || prompts.length === 0) {
      return res.status(200).json({
        questions: [],
        message: 'No prompts found for the selected phases'
      });
    }

    // Build valid combinations using grammar engine data
    const validCombinations = buildValidCombinations(
      verbs as Verb[],
      prompts as DrillPrompt[]
    );

    if (validCombinations.length === 0) {
      return res.status(200).json({
        questions: [],
        message: 'No valid question combinations found. The grammar engine conjugations may not match the selected phases.',
        debug: {
          verbCount: verbs.length,
          promptCount: prompts.length,
          sampleVerb: verbs[0]?.dictionary_form,
          sampleConjugations: verbs[0] ? Object.keys(verbs[0].conjugations || {}) : [],
          samplePromptForms: prompts.slice(0, 3).map(p => p.to_form),
        }
      });
    }

    // Generate questions
    const questions = generateQuestionsFromCombinations(
      validCombinations,
      questionCount,
      practiceMode
    );

    return res.status(200).json({
      questions,
      meta: {
        source: 'grammar_engine',
        totalVerbs: verbs.length,
        totalCombinations: validCombinations.length,
        requestedCount: questionCount,
        actualCount: questions.length,
        jlptLevel,
        phases: phaseList,
      }
    });
  } catch (error) {
    console.error('Drill API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
