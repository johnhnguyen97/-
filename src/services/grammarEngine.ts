/**
 * Grammar Engine Client Service
 *
 * This service provides client-side access to the grammar validation API.
 * All games should use this to ensure conjugations are correct.
 *
 * The grammar engine is the single source of truth for:
 * - Verb conjugations (all 17+ forms)
 * - Validation of user input
 * - AI output verification
 */

const API_BASE = '/api/validate-grammar';

export interface ConjugationForm {
  kanji: string;
  reading: string;
  romaji: string;
}

export interface Verb {
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

export interface ValidationResult {
  isValid: boolean;
  expected: ConjugationForm | null;
  provided: string;
  correction?: string;
  message: string;
}

export interface DrillQuestion {
  verb: {
    dictionary_form: string;
    reading: string;
    meaning: string;
    verb_group: string;
  };
  targetForm: string;
  correctAnswer: ConjugationForm & { isCorrect: boolean };
  options: Array<ConjugationForm & { isCorrect: boolean; form: string }>;
}

export interface BatchValidationResult {
  allValid: boolean;
  validCount: number;
  totalCount: number;
  results: Array<{
    dictionary_form: string;
    form: string;
    input: string;
    isValid: boolean;
    expected: ConjugationForm | null;
    correction: string | null;
  }>;
}

// Conjugation form labels (for UI display)
export const CONJUGATION_LABELS: Record<string, { en: string; jp: string }> = {
  dictionary: { en: 'Dictionary Form', jp: '辞書形' },
  negative: { en: 'Negative', jp: 'ない形' },
  past: { en: 'Past', jp: 'た形' },
  past_negative: { en: 'Past Negative', jp: 'なかった形' },
  masu: { en: 'Polite (ます)', jp: 'ます形' },
  masen: { en: 'Polite Negative', jp: 'ません形' },
  mashita: { en: 'Polite Past', jp: 'ました形' },
  masen_deshita: { en: 'Polite Past Negative', jp: 'ませんでした形' },
  te: { en: 'Te-form', jp: 'て形' },
  potential: { en: 'Potential', jp: '可能形' },
  volitional: { en: 'Volitional', jp: '意志形' },
  imperative: { en: 'Imperative', jp: '命令形' },
  passive: { en: 'Passive', jp: '受身形' },
  causative: { en: 'Causative', jp: '使役形' },
  conditional_ba: { en: 'Conditional (ば)', jp: '仮定形' },
  conditional_tara: { en: 'Conditional (たら)', jp: 'たら形' },
  tai: { en: 'Want to (~たい)', jp: 'たい形' },
};

// Verb group labels
export const VERB_GROUP_LABELS: Record<string, { en: string; jp: string }> = {
  godan: { en: 'Godan (Group 1)', jp: '五段動詞' },
  ichidan: { en: 'Ichidan (Group 2)', jp: '一段動詞' },
  'irregular-suru': { en: 'Irregular (する)', jp: '不規則動詞' },
  'irregular-kuru': { en: 'Irregular (来る)', jp: '不規則動詞' },
};

/**
 * Get a single verb with all its conjugations
 */
export async function getVerb(dictionaryForm: string): Promise<Verb | null> {
  try {
    const response = await fetch(
      `${API_BASE}?action=get-verb&dictionary_form=${encodeURIComponent(dictionaryForm)}`
    );

    if (!response.ok) {
      console.error('Failed to get verb:', dictionaryForm);
      return null;
    }

    const data = await response.json();
    return data.verb;
  } catch (error) {
    console.error('Error fetching verb:', error);
    return null;
  }
}

/**
 * Get a specific conjugation form for a verb
 */
export async function getConjugation(
  dictionaryForm: string,
  form: string
): Promise<ConjugationForm | null> {
  try {
    const response = await fetch(
      `${API_BASE}?action=get-conjugation&dictionary_form=${encodeURIComponent(dictionaryForm)}&form=${form}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.conjugation;
  } catch (error) {
    console.error('Error fetching conjugation:', error);
    return null;
  }
}

/**
 * Validate user input against the correct conjugation
 */
export async function validateConjugation(
  dictionaryForm: string,
  form: string,
  input: string
): Promise<ValidationResult> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'validate',
        dictionary_form: dictionaryForm,
        form,
        input,
      }),
    });

    if (!response.ok) {
      throw new Error('Validation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating conjugation:', error);
    return {
      isValid: false,
      expected: null,
      provided: input,
      message: 'Validation error occurred',
    };
  }
}

/**
 * List verbs with optional filters
 */
export async function listVerbs(options?: {
  jlptLevel?: string;
  verbGroup?: string;
  limit?: number;
}): Promise<Verb[]> {
  try {
    const params = new URLSearchParams({ action: 'list-verbs' });

    if (options?.jlptLevel) params.set('jlpt_level', options.jlptLevel);
    if (options?.verbGroup) params.set('verb_group', options.verbGroup);
    if (options?.limit) params.set('limit', options.limit.toString());

    const response = await fetch(`${API_BASE}?${params}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.verbs || [];
  } catch (error) {
    console.error('Error listing verbs:', error);
    return [];
  }
}

/**
 * Get random drill questions from the grammar engine
 */
export async function getRandomDrill(options?: {
  jlptLevel?: string;
  count?: number;
  forms?: string[];
}): Promise<DrillQuestion[]> {
  try {
    const params = new URLSearchParams({ action: 'get-random-drill' });

    if (options?.jlptLevel) params.set('jlpt_level', options.jlptLevel);
    if (options?.count) params.set('count', options.count.toString());
    if (options?.forms) params.set('forms', options.forms.join(','));

    const response = await fetch(`${API_BASE}?${params}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.questions || [];
  } catch (error) {
    console.error('Error getting drill questions:', error);
    return [];
  }
}

/**
 * Batch validate multiple conjugations (useful for AI output verification)
 */
export async function batchValidate(
  conjugations: Array<{
    dictionary_form: string;
    form: string;
    input: string;
  }>
): Promise<BatchValidationResult> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'batch-validate',
        conjugations,
      }),
    });

    if (!response.ok) {
      throw new Error('Batch validation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in batch validation:', error);
    return {
      allValid: false,
      validCount: 0,
      totalCount: conjugations.length,
      results: [],
    };
  }
}

/**
 * Check and correct AI-generated conjugation
 * This is the main function for AI output validation
 */
export async function checkAndCorrectAI(
  dictionaryForm: string,
  form: string,
  aiOutput: string
): Promise<{
  isCorrect: boolean;
  original: string;
  corrected: string;
  expected: ConjugationForm | null;
}> {
  const result = await validateConjugation(dictionaryForm, form, aiOutput);

  return {
    isCorrect: result.isValid,
    original: aiOutput,
    corrected: result.isValid ? aiOutput : (result.correction || aiOutput),
    expected: result.expected,
  };
}

/**
 * Quick conjugate - get a single form without full verb lookup
 * Useful for inline conjugation display
 */
export async function quickConjugate(
  dictionaryForm: string,
  form: string
): Promise<string | null> {
  const conjugation = await getConjugation(dictionaryForm, form);
  return conjugation?.kanji || null;
}
