/**
 * Gojun Grammar Engine
 *
 * The core grammar system that all games and AI must follow.
 * This is the single source of truth for Japanese grammar.
 */

// Types
export type {
  VerbGroup,
  GodanEnding,
  ConjugationType,
  ConjugationResult,
  Verb,
  AdjectiveType,
  AdjectiveConjugationType,
  Adjective,
  GrammarTopic,
  GrammarCategory,
  GrammarSection,
  GrammarExample,
  Sentence,
  SentenceContext,
  ValidationResult,
  ValidationError,
  GrammarEngineConfig,
} from './types';

// Conjugation Algorithm
export {
  conjugate,
  generateAllConjugations,
  validateConjugation,
} from './conjugator';

// Validator
export {
  validateVerbConjugation,
  correctConjugation,
  validateSentence,
  validateAIOutput,
  isValidTeForm,
  isValidMasuForm,
  getCorrectForm,
  loadVerbs,
  lookupVerb,
} from './validator';

// ============================================
// CONVENIENCE EXPORTS
// ============================================

import { conjugate } from './conjugator';
import { loadVerbs, lookupVerb, validateAIOutput } from './validator';
import type { Verb, ConjugationType } from './types';

/**
 * Initialize the grammar engine with verbs from database
 */
export async function initGrammarEngine(verbs: Verb[]): Promise<void> {
  loadVerbs(verbs);
  console.log(`Grammar Engine initialized with ${verbs.length} verbs`);
}

/**
 * Quick conjugation - lookup verb and conjugate
 */
export function quickConjugate(
  dictionaryForm: string,
  type: ConjugationType
): string | null {
  const verb = lookupVerb(dictionaryForm);
  if (!verb) return null;

  const result = conjugate(
    verb.dictionary_form,
    verb.reading,
    verb.group,
    type
  );

  return result.kanji;
}

/**
 * Check if AI output is valid and correct it if needed
 */
export function checkAndCorrectAI(
  aiOutput: string,
  expectedVerbs: Array<{ verb: string; form: ConjugationType }>
): string {
  const result = validateAIOutput(aiOutput, {
    verbs: expectedVerbs.map(v => ({
      dictionaryForm: v.verb,
      expectedType: v.form,
    })),
  });

  if (!result.isValid) {
    console.warn('AI output corrected:', result.corrections);
  }

  return result.validated;
}
