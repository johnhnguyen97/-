/**
 * Gojun Grammar Engine - Validator
 *
 * Validates AI-generated content against the grammar engine.
 * If AI makes a mistake, this catches and corrects it.
 */

import { conjugate, generateAllConjugations } from './conjugator';
import type {
  ConjugationType,
  ValidationResult,
  ValidationError,
  Verb,
  ConjugationResult
} from './types';

// ============================================
// VERB DATABASE (In-memory cache)
// ============================================

// This will be populated from Supabase
let verbDatabase: Map<string, Verb> = new Map();

/**
 * Load verbs into memory from database
 */
export function loadVerbs(verbs: Verb[]): void {
  verbDatabase.clear();
  for (const verb of verbs) {
    // Index by dictionary form (kanji)
    verbDatabase.set(verb.dictionary_form, verb);
    // Also index by reading (hiragana)
    verbDatabase.set(verb.reading, verb);
  }
}

/**
 * Look up a verb by dictionary form or reading
 */
export function lookupVerb(form: string): Verb | undefined {
  return verbDatabase.get(form);
}

// ============================================
// CONJUGATION VALIDATION
// ============================================

/**
 * Validate a single verb conjugation
 */
export function validateVerbConjugation(
  verb: string | Verb,
  conjugationType: ConjugationType,
  attempt: string
): ValidationResult {
  // Get verb info
  const verbInfo = typeof verb === 'string' ? lookupVerb(verb) : verb;

  if (!verbInfo) {
    return {
      isValid: false,
      input: attempt,
      errors: [{
        type: 'unknown-word',
        message: `Unknown verb: ${verb}`,
      }],
    };
  }

  // Get expected conjugation from our algorithm
  const expected = conjugate(
    verbInfo.dictionary_form,
    verbInfo.reading,
    verbInfo.group,
    conjugationType
  );

  // Check if attempt matches
  const isValid =
    attempt === expected.kanji ||
    attempt === expected.reading;

  if (isValid) {
    return { isValid: true, input: attempt, errors: [] };
  }

  return {
    isValid: false,
    input: attempt,
    expected: expected.kanji,
    corrected: expected.kanji,
    errors: [{
      type: 'conjugation',
      message: `Incorrect ${conjugationType} form for ${verbInfo.dictionary_form}`,
      suggestion: expected.kanji,
    }],
  };
}

/**
 * Auto-correct a conjugation if wrong
 */
export function correctConjugation(
  verb: string | Verb,
  conjugationType: ConjugationType,
  attempt: string
): ConjugationResult {
  const verbInfo = typeof verb === 'string' ? lookupVerb(verb) : verb;

  if (!verbInfo) {
    // Can't correct unknown verb, return attempt as-is
    return { kanji: attempt, reading: attempt, romaji: '' };
  }

  return conjugate(
    verbInfo.dictionary_form,
    verbInfo.reading,
    verbInfo.group,
    conjugationType
  );
}

// ============================================
// SENTENCE VALIDATION
// ============================================

interface SentenceValidationOptions {
  strictMode?: boolean;     // Reject any errors
  autoCorrect?: boolean;    // Return corrected version
  checkParticles?: boolean; // Also validate particle usage
}

/**
 * Validate an entire sentence
 * Checks all verbs are conjugated correctly
 */
export function validateSentence(
  sentence: string,
  expectedVerbs: Array<{
    verb: Verb;
    conjugationType: ConjugationType;
    expectedForm: string;
  }>,
  options: SentenceValidationOptions = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  let correctedSentence = sentence;

  for (const { verb, conjugationType, expectedForm } of expectedVerbs) {
    // Check if the expected form is in the sentence
    if (!sentence.includes(expectedForm)) {
      // Try to find what form was used instead
      const validation = validateVerbConjugation(verb, conjugationType, expectedForm);

      if (!validation.isValid && validation.corrected) {
        errors.push({
          type: 'conjugation',
          message: `Expected ${validation.expected} but found ${expectedForm}`,
          suggestion: validation.corrected,
        });

        // Auto-correct if enabled
        if (options.autoCorrect && validation.corrected) {
          correctedSentence = correctedSentence.replace(expectedForm, validation.corrected);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    input: sentence,
    corrected: options.autoCorrect ? correctedSentence : undefined,
    errors,
  };
}

// ============================================
// AI OUTPUT VALIDATION
// ============================================

interface AIOutputValidation {
  original: string;
  validated: string;
  corrections: Array<{
    original: string;
    corrected: string;
    reason: string;
  }>;
  isValid: boolean;
}

/**
 * Validate and correct AI-generated Japanese text
 * This is the main function that ensures AI follows our rules
 */
export function validateAIOutput(
  aiOutput: string,
  context: {
    verbs?: Array<{ dictionaryForm: string; expectedType: ConjugationType }>;
    // Add more context as needed (particles, adjectives, etc.)
  }
): AIOutputValidation {
  const corrections: AIOutputValidation['corrections'] = [];
  let validated = aiOutput;

  // Check each expected verb conjugation
  if (context.verbs) {
    for (const { dictionaryForm, expectedType } of context.verbs) {
      const verb = lookupVerb(dictionaryForm);
      if (!verb) continue;

      const expected = conjugate(
        verb.dictionary_form,
        verb.reading,
        verb.group,
        expectedType
      );

      // Check if the correct form is used
      // Also check common mistakes
      const allForms = generateAllConjugations(
        verb.dictionary_form,
        verb.reading,
        verb.group
      );

      // Find any conjugation of this verb in the output
      for (const [formType, form] of Object.entries(allForms)) {
        if (validated.includes(form.kanji) && formType !== expectedType) {
          // Wrong form used - correct it
          corrections.push({
            original: form.kanji,
            corrected: expected.kanji,
            reason: `Expected ${expectedType} form, found ${formType}`,
          });
          validated = validated.replace(form.kanji, expected.kanji);
        }
      }
    }
  }

  return {
    original: aiOutput,
    validated,
    corrections,
    isValid: corrections.length === 0,
  };
}

// ============================================
// QUICK VALIDATION HELPERS
// ============================================

/**
 * Quick check: Is this a valid te-form?
 */
export function isValidTeForm(verb: string, teForm: string): boolean {
  const verbInfo = lookupVerb(verb);
  if (!verbInfo) return false;

  const expected = conjugate(
    verbInfo.dictionary_form,
    verbInfo.reading,
    verbInfo.group,
    'te'
  );

  return teForm === expected.kanji || teForm === expected.reading;
}

/**
 * Quick check: Is this a valid masu-form?
 */
export function isValidMasuForm(verb: string, masuForm: string): boolean {
  const verbInfo = lookupVerb(verb);
  if (!verbInfo) return false;

  const expected = conjugate(
    verbInfo.dictionary_form,
    verbInfo.reading,
    verbInfo.group,
    'masu'
  );

  return masuForm === expected.kanji || masuForm === expected.reading;
}

/**
 * Get the correct form of a verb
 */
export function getCorrectForm(
  verb: string,
  conjugationType: ConjugationType
): ConjugationResult | null {
  const verbInfo = lookupVerb(verb);
  if (!verbInfo) return null;

  return conjugate(
    verbInfo.dictionary_form,
    verbInfo.reading,
    verbInfo.group,
    conjugationType
  );
}

// All functions are already exported inline with 'export function'
