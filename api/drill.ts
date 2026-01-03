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
  frequency: number; // 1-10, where 10 = most common daily use
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

// Phase to conjugation forms mapping - for random selection
const PHASE_FORMS: Record<number, string[]> = {
  1: ['masu', 'masen', 'mashita', 'masen_deshita'],
  2: ['dictionary', 'negative', 'past', 'past_negative'],
  3: ['te', 'potential'],
  4: ['tai', 'volitional'],
  5: ['potential', 'conditional_ba'],
  6: ['conditional_ba', 'conditional_tara'],
  7: ['passive', 'causative'],
  8: ['imperative'],
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

/**
 * Weighted random selection - prioritizes common daily-use words
 * @param items Array of items with frequency property
 * @param jlptLevel JLPT level to adjust weighting strength
 * @returns Weighted-shuffled array favoring higher frequency items
 */
function weightedShuffle<T extends { frequency?: number }>(
  items: T[],
  jlptLevel: string = 'N5'
): T[] {
  if (items.length === 0) return [];

  // Calculate frequency boost multiplier based on JLPT level
  // N5: Strong bias towards common words (3x multiplier)
  // N4: Moderate bias (2x multiplier)
  // N3+: Light bias (1.5x multiplier) - advanced learners need variety
  const frequencyMultiplier: Record<string, number> = {
    'N5': 3.0,
    'N4': 2.0,
    'N3': 1.5,
    'N2': 1.2,
    'N1': 1.1,
  };
  const multiplier = frequencyMultiplier[jlptLevel] || 2.0;

  // Create weighted array with probability scores
  const weighted = items.map(item => ({
    item,
    // Weight = frequency^multiplier (exponential weighting)
    // Default frequency = 5 if not set
    weight: Math.pow(item.frequency || 5, multiplier),
    randomBoost: Math.random() // Add randomness to avoid deterministic ordering
  }));

  // Sort by combined weight + random boost (prevents total predictability)
  weighted.sort((a, b) => {
    const scoreA = a.weight * (0.7 + a.randomBoost * 0.3); // 70% weight, 30% random
    const scoreB = b.weight * (0.7 + b.randomBoost * 0.3);
    return scoreB - scoreA; // Higher scores first
  });

  return weighted.map(w => w.item);
}

/**
 * Select random items with weighted probability
 * Uses cumulative distribution function for true weighted random selection
 */
function weightedRandomSelect<T extends { frequency?: number }>(
  items: T[],
  count: number,
  jlptLevel: string = 'N5'
): T[] {
  if (items.length === 0) return [];
  if (items.length <= count) return weightedShuffle(items, jlptLevel);

  const multiplier = jlptLevel === 'N5' ? 3.0 : jlptLevel === 'N4' ? 2.0 : 1.5;
  const selected: T[] = [];
  const available = [...items];

  while (selected.length < count && available.length > 0) {
    // Calculate total weight of remaining items
    const totalWeight = available.reduce((sum, item) => {
      return sum + Math.pow(item.frequency || 5, multiplier);
    }, 0);

    // Random point in the cumulative distribution
    let random = Math.random() * totalWeight;

    // Select item based on cumulative weight
    let selectedIndex = 0;
    for (let i = 0; i < available.length; i++) {
      const weight = Math.pow(available[i].frequency || 5, multiplier);
      random -= weight;
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    // Add selected item and remove from available pool
    selected.push(available[selectedIndex]);
    available.splice(selectedIndex, 1);
  }

  return selected;
}

function getConjugationEnglish(toForm: string): string {
  const formMap: Record<string, string> = {
    // Polite forms
    'masu': 'polite present',
    'masen': 'polite negative',
    'mashita': 'polite past',
    'masen_deshita': 'polite past negative',
    // Plain forms
    'dictionary': 'dictionary form',
    'negative': 'plain negative',
    'past': 'plain past',
    'past_negative': 'plain past negative',
    'nai': 'plain negative',
    // Te-form
    'te': 'te-form',
    // Desire
    'tai': 'want to do',
    'tai_negative': "don't want to",
    // Volitional
    'volitional': 'volitional (let\'s)',
    // Potential
    'potential': 'potential (can do)',
    // Conditional
    'conditional_ba': 'conditional (if)',
    'conditional_tara': 'conditional (when/if)',
    // Passive/Causative
    'passive': 'passive',
    'causative': 'causative',
    'causative_passive': 'causative passive',
    // Imperative
    'imperative': 'imperative (command)',
  };
  return formMap[toForm] || toForm.replace(/_/g, ' ');
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
 * Build valid verb-form combinations with intelligent randomization
 * - Weighted random verb selection (prioritizes common words)
 * - Random conjugation form selection within each phase
 */
function buildValidCombinations(
  verbs: Verb[],
  phases: number[],
  jlptLevel: string
): ValidCombination[] {
  const combinations: ValidCombination[] = [];

  // Use weighted random selection for verbs (prioritizes common daily words)
  const selectedVerbs = weightedShuffle(verbs, jlptLevel);

  for (const verb of selectedVerbs) {
    for (const phase of phases) {
      // Get available conjugation forms for this phase
      const phaseForms = PHASE_FORMS[phase] || [];

      // Randomly select 1-2 forms from this phase (adds variety)
      const numForms = Math.random() < 0.7 ? 1 : 2; // 70% chance of 1 form, 30% chance of 2
      const shuffledForms = shuffleArray(phaseForms);
      const selectedForms = shuffledForms.slice(0, numForms);

      for (const formKey of selectedForms) {
        // Check if this verb has this conjugation
        if (verb.conjugations && verb.conjugations[formKey]) {
          // Create a synthetic prompt for this form
          const prompt: DrillPrompt = {
            id: `auto-${phase}-${formKey}`,
            from_form: 'plain_positive',
            to_form: formKey,
            prompt_en: `Change to ${getConjugationEnglish(formKey)}`,
            prompt_jp: `${getConjugationEnglish(formKey)}に変えてください`,
            explanation: '',
            word_type: 'verb',
            phase: phase as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
          };

          combinations.push({ verb, prompt });
        }
      }
    }
  }

  return combinations;
}

/**
 * Generate questions from valid combinations
 */
async function generateQuestionsFromCombinations(
  combinations: ValidCombination[],
  count: number,
  practiceMode: string,
  supabase: any
): Promise<any[]> {
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
    const grammarEngineKey = prompt.to_form; // Use the form key directly
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

    // Fetch example sentence for sentence mode
    let exampleSentence = undefined;
    if (practiceMode === 'sentence') {
      const { data: sentences } = await supabase
        .from('example_sentences')
        .select('*')
        .eq('word_key', verb.dictionary_form)
        .limit(1);

      if (sentences && sentences.length > 0) {
        const sent = sentences[0];
        exampleSentence = {
          id: sent.id,
          japanese: sent.japanese,
          english: sent.english,
          word_key: sent.word_key,
          word_reading: sent.word_reading,
          tatoeba_id: sent.tatoeba_id || 0,
          jlpt_level: sent.jlpt_level || verb.jlpt_level,
        };
      }
    }

    questions.push({
      sentence,
      prompt,
      correctAnswer,
      mcOptions,
      practiceMode,
      exampleSentence,
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

    // Build valid combinations using grammar engine data with weighted randomization
    const validCombinations = buildValidCombinations(
      verbs as Verb[],
      phaseList,
      jlptLevel
    );

    if (validCombinations.length === 0) {
      return res.status(200).json({
        questions: [],
        message: 'No valid question combinations found. The grammar engine conjugations may not match the selected phases.',
        debug: {
          verbCount: verbs.length,
          phases: phaseList,
          sampleVerb: verbs[0]?.dictionary_form,
          sampleConjugations: verbs[0] ? Object.keys(verbs[0].conjugations || {}) : [],
        }
      });
    }

    // Generate questions (async to fetch example sentences)
    const questions = await generateQuestionsFromCombinations(
      validCombinations,
      questionCount,
      practiceMode,
      supabase
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
