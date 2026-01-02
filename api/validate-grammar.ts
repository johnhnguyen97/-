import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Grammar Validation API
 *
 * This endpoint validates conjugations against the grammar engine database.
 * All games should use this to ensure correctness.
 *
 * Endpoints:
 * - GET /api/validate-grammar?action=get-verb&dictionary_form=食べる
 * - GET /api/validate-grammar?action=get-conjugation&dictionary_form=食べる&form=te
 * - POST /api/validate-grammar { action: 'validate', dictionary_form: '食べる', form: 'te', input: '食べて' }
 * - GET /api/validate-grammar?action=list-verbs&jlpt_level=N5
 */

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

interface ValidationResult {
  isValid: boolean;
  expected: ConjugationForm | null;
  provided: string;
  correction?: string;
  message: string;
}

// Normalize Japanese text for comparison
function normalizeJapanese(text: string): string {
  return text
    .trim()
    .normalize('NFKC')
    // Convert full-width to half-width where applicable
    .replace(/\s+/g, '');
}

// Check if two Japanese strings match (handles various input methods)
function japaneseFuzzyMatch(input: string, expected: string): boolean {
  const normalizedInput = normalizeJapanese(input);
  const normalizedExpected = normalizeJapanese(expected);
  return normalizedInput === normalizedExpected;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Handle both GET and POST
    const params = req.method === 'POST' ? req.body : req.query;
    const action = params.action as string;

    switch (action) {
      case 'get-verb': {
        // Get a single verb with all conjugations
        const { dictionary_form } = params;

        if (!dictionary_form) {
          return res.status(400).json({ error: 'dictionary_form is required' });
        }

        const { data: verb, error } = await supabase
          .from('verbs')
          .select('*')
          .eq('dictionary_form', dictionary_form)
          .single();

        if (error || !verb) {
          return res.status(404).json({
            error: 'Verb not found',
            dictionary_form
          });
        }

        return res.status(200).json({ verb });
      }

      case 'get-conjugation': {
        // Get a specific conjugation form
        const { dictionary_form, form } = params;

        if (!dictionary_form || !form) {
          return res.status(400).json({ error: 'dictionary_form and form are required' });
        }

        const { data: verb, error } = await supabase
          .from('verbs')
          .select('dictionary_form, reading, verb_group, conjugations')
          .eq('dictionary_form', dictionary_form)
          .single();

        if (error || !verb) {
          return res.status(404).json({
            error: 'Verb not found',
            dictionary_form
          });
        }

        const conjugation = verb.conjugations?.[form];

        if (!conjugation) {
          return res.status(404).json({
            error: 'Conjugation form not found',
            dictionary_form,
            form,
            available_forms: Object.keys(verb.conjugations || {})
          });
        }

        return res.status(200).json({
          dictionary_form: verb.dictionary_form,
          reading: verb.reading,
          verb_group: verb.verb_group,
          form,
          conjugation
        });
      }

      case 'validate': {
        // Validate user input against correct conjugation
        const { dictionary_form, form, input } = params;

        if (!dictionary_form || !form || input === undefined) {
          return res.status(400).json({
            error: 'dictionary_form, form, and input are required'
          });
        }

        const { data: verb, error } = await supabase
          .from('verbs')
          .select('dictionary_form, conjugations')
          .eq('dictionary_form', dictionary_form)
          .single();

        if (error || !verb) {
          return res.status(404).json({
            error: 'Verb not found',
            dictionary_form
          });
        }

        const expected = verb.conjugations?.[form] as ConjugationForm | undefined;

        if (!expected) {
          return res.status(404).json({
            error: 'Conjugation form not found',
            dictionary_form,
            form
          });
        }

        // Check against kanji, reading, or romaji
        const isKanjiMatch = japaneseFuzzyMatch(input, expected.kanji);
        const isReadingMatch = japaneseFuzzyMatch(input, expected.reading);
        const isRomajiMatch = input.toLowerCase().trim() === expected.romaji.toLowerCase();

        const isValid = isKanjiMatch || isReadingMatch || isRomajiMatch;

        const result: ValidationResult = {
          isValid,
          expected,
          provided: input,
          message: isValid
            ? 'Correct!'
            : `Incorrect. Expected: ${expected.kanji} (${expected.reading})`,
        };

        if (!isValid) {
          result.correction = expected.kanji;
        }

        return res.status(200).json(result);
      }

      case 'list-verbs': {
        // List verbs with optional filters
        const { jlpt_level, verb_group, limit = '50' } = params;

        let query = supabase
          .from('verbs')
          .select('dictionary_form, reading, romaji, meaning, verb_group, jlpt_level, is_transitive')
          .order('dictionary_form')
          .limit(parseInt(limit as string, 10));

        if (jlpt_level) {
          query = query.eq('jlpt_level', jlpt_level);
        }
        if (verb_group) {
          query = query.eq('verb_group', verb_group);
        }

        const { data: verbs, error } = await query;

        if (error) {
          return res.status(500).json({ error: 'Failed to fetch verbs' });
        }

        return res.status(200).json({
          verbs,
          count: verbs?.length || 0
        });
      }

      case 'get-random-drill': {
        // Get random verbs for drill practice
        const {
          jlpt_level = 'N5',
          count = '10',
          forms = 'te,masu,past,negative'
        } = params;

        const formList = (forms as string).split(',');
        const questionCount = Math.min(parseInt(count as string, 10), 30);

        // Get verbs
        const { data: verbs, error } = await supabase
          .from('verbs')
          .select('*')
          .eq('jlpt_level', jlpt_level);

        if (error || !verbs || verbs.length === 0) {
          return res.status(404).json({ error: 'No verbs found for criteria' });
        }

        // Build questions
        const questions = [];
        const shuffledVerbs = [...verbs].sort(() => Math.random() - 0.5);

        let idx = 0;
        while (questions.length < questionCount) {
          const verb = shuffledVerbs[idx % shuffledVerbs.length];
          const randomForm = formList[Math.floor(Math.random() * formList.length)];

          const conjugation = verb.conjugations?.[randomForm];
          if (conjugation) {
            // Generate distractors from other forms
            const otherForms = Object.entries(verb.conjugations as Record<string, ConjugationForm>)
              .filter(([key]) => key !== randomForm)
              .map(([key, val]) => ({
                form: key,
                ...val,
                isCorrect: false
              }))
              .sort(() => Math.random() - 0.5)
              .slice(0, 3);

            questions.push({
              verb: {
                dictionary_form: verb.dictionary_form,
                reading: verb.reading,
                meaning: verb.meaning,
                verb_group: verb.verb_group,
              },
              targetForm: randomForm,
              correctAnswer: {
                ...conjugation,
                isCorrect: true
              },
              options: [
                { ...conjugation, isCorrect: true, form: randomForm },
                ...otherForms
              ].sort(() => Math.random() - 0.5)
            });
          }

          idx++;
          // Safety: prevent infinite loop
          if (idx > shuffledVerbs.length * formList.length * 2) break;
        }

        return res.status(200).json({
          questions,
          meta: {
            jlpt_level,
            forms: formList,
            count: questions.length
          }
        });
      }

      case 'batch-validate': {
        // Validate multiple conjugations at once (for AI output checking)
        const { conjugations } = params;

        if (!Array.isArray(conjugations)) {
          return res.status(400).json({
            error: 'conjugations must be an array of { dictionary_form, form, input }'
          });
        }

        // Get all unique dictionary forms
        const dictionaryForms = [...new Set(conjugations.map((c: any) => c.dictionary_form))];

        const { data: verbs, error } = await supabase
          .from('verbs')
          .select('dictionary_form, conjugations')
          .in('dictionary_form', dictionaryForms);

        if (error) {
          return res.status(500).json({ error: 'Failed to fetch verbs' });
        }

        const verbMap = new Map(verbs?.map(v => [v.dictionary_form, v.conjugations]) || []);

        const results = conjugations.map((c: any) => {
          const verbConjugations = verbMap.get(c.dictionary_form);

          if (!verbConjugations) {
            return {
              ...c,
              isValid: false,
              error: 'Verb not found in database',
              expected: null
            };
          }

          const expected = verbConjugations[c.form] as ConjugationForm | undefined;

          if (!expected) {
            return {
              ...c,
              isValid: false,
              error: 'Form not found',
              expected: null,
              available_forms: Object.keys(verbConjugations)
            };
          }

          const isValid =
            japaneseFuzzyMatch(c.input, expected.kanji) ||
            japaneseFuzzyMatch(c.input, expected.reading);

          return {
            ...c,
            isValid,
            expected,
            correction: isValid ? null : expected.kanji
          };
        });

        const allValid = results.every((r: any) => r.isValid);
        const validCount = results.filter((r: any) => r.isValid).length;

        return res.status(200).json({
          allValid,
          validCount,
          totalCount: results.length,
          results
        });
      }

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: [
            'get-verb',
            'get-conjugation',
            'validate',
            'list-verbs',
            'get-random-drill',
            'batch-validate'
          ]
        });
    }
  } catch (error) {
    console.error('Validate Grammar API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
