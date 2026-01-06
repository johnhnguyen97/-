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

interface UserVerbProgress {
  id: string;
  user_id: string;
  verb_id: string;
  conjugation_form: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  total_reviews: number;
  correct_reviews: number;
  streak: number;
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
  2: ['negative', 'past', 'past_negative'], // Removed 'dictionary' form
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

/**
 * Get detailed explanation for how to form each conjugation
 */
function getConjugationExplanation(toForm: string, verbGroup: string): string {
  const explanations: Record<string, Record<string, string>> = {
    // Polite forms (ます形)
    'masu': {
      'godan': 'For Godan verbs: Change the final う-row kana to the い-row, then add ます.\nExample: 買う → 買い → 買います',
      'ichidan': 'For Ichidan verbs: Remove る, then add ます.\nExample: 食べる → 食べ → 食べます',
      'irregular-suru': 'する → します',
      'irregular-kuru': '来る (くる) → 来ます (きます)',
    },
    'masen': {
      'godan': 'For Godan verbs: Change the final う-row kana to the い-row, then add ません.\nExample: 買う → 買い → 買いません',
      'ichidan': 'For Ichidan verbs: Remove る, then add ません.\nExample: 食べる → 食べ → 食べません',
      'irregular-suru': 'する → しません',
      'irregular-kuru': '来る (くる) → 来ません (きません)',
    },
    'mashita': {
      'godan': 'For Godan verbs: Change the final う-row kana to the い-row, then add ました.\nExample: 買う → 買い → 買いました',
      'ichidan': 'For Ichidan verbs: Remove る, then add ました.\nExample: 食べる → 食べ → 食べました',
      'irregular-suru': 'する → しました',
      'irregular-kuru': '来る (くる) → 来ました (きました)',
    },
    'masen_deshita': {
      'godan': 'For Godan verbs: Change the final う-row kana to the い-row, then add ませんでした.\nExample: 買う → 買い → 買いませんでした',
      'ichidan': 'For Ichidan verbs: Remove る, then add ませんでした.\nExample: 食べる → 食べ → 食べませんでした',
      'irregular-suru': 'する → しませんでした',
      'irregular-kuru': '来る (くる) → 来ませんでした (きませんでした)',
    },
    // Plain forms
    'dictionary': {
      'godan': 'The dictionary form is the base form of the verb ending in う-row kana (う、く、す、つ、ぬ、ぶ、む、る).',
      'ichidan': 'The dictionary form ends in る, preceded by an い or え sound.',
      'irregular-suru': 'Dictionary form: する',
      'irregular-kuru': 'Dictionary form: 来る (くる)',
    },
    'negative': {
      'godan': 'For Godan verbs: Change the final う-row kana to the あ-row, then add ない.\nExample: 買う → 買わ → 買わない\nNote: For verbs ending in う, change to わ (not あ).',
      'ichidan': 'For Ichidan verbs: Remove る, then add ない.\nExample: 食べる → 食べ → 食べない',
      'irregular-suru': 'する → しない',
      'irregular-kuru': '来る (くる) → 来ない (こない)',
    },
    'past': {
      'godan': 'For Godan verbs, use the た-form rules based on the ending:\n• う/つ/る → った (買う→買った)\n• む/ぶ/ぬ → んだ (読む→読んだ)\n• く → いた (書く→書いた)\n• ぐ → いだ (泳ぐ→泳いだ)\n• す → した (話す→話した)',
      'ichidan': 'For Ichidan verbs: Remove る, then add た.\nExample: 食べる → 食べ → 食べた',
      'irregular-suru': 'する → した',
      'irregular-kuru': '来る (くる) → 来た (きた)',
    },
    'past_negative': {
      'godan': 'Form the negative (ない), then change ない to なかった.\nExample: 買わない → 買わなかった',
      'ichidan': 'Form the negative (ない), then change ない to なかった.\nExample: 食べない → 食べなかった',
      'irregular-suru': 'しない → しなかった',
      'irregular-kuru': '来ない (こない) → 来なかった (こなかった)',
    },
    // Te-form
    'te': {
      'godan': 'For Godan verbs, use the て-form rules based on the ending:\n• う/つ/る → って (買う→買って)\n• む/ぶ/ぬ → んで (読む→読んで)\n• く → いて (書く→書いて)\n• ぐ → いで (泳ぐ→泳いで)\n• す → して (話す→話して)',
      'ichidan': 'For Ichidan verbs: Remove る, then add て.\nExample: 食べる → 食べ → 食べて',
      'irregular-suru': 'する → して',
      'irregular-kuru': '来る (くる) → 来て (きて)',
    },
    // Desire
    'tai': {
      'godan': 'For Godan verbs: Change the final う-row kana to the い-row, then add たい.\nExample: 買う → 買い → 買いたい',
      'ichidan': 'For Ichidan verbs: Remove る, then add たい.\nExample: 食べる → 食べ → 食べたい',
      'irregular-suru': 'する → したい',
      'irregular-kuru': '来る (くる) → 来たい (きたい)',
    },
    // Volitional
    'volitional': {
      'godan': 'For Godan verbs: Change the final う-row kana to the お-row, then add う.\nExample: 買う → 買お → 買おう',
      'ichidan': 'For Ichidan verbs: Remove る, then add よう.\nExample: 食べる → 食べ → 食べよう',
      'irregular-suru': 'する → しよう',
      'irregular-kuru': '来る (くる) → 来よう (こよう)',
    },
    // Potential
    'potential': {
      'godan': 'For Godan verbs: Change the final う-row kana to the え-row, then add る.\nExample: 買う → 買え → 買える',
      'ichidan': 'For Ichidan verbs: Remove る, then add られる (or colloquially れる).\nExample: 食べる → 食べ → 食べられる',
      'irregular-suru': 'する → できる',
      'irregular-kuru': '来る (くる) → 来られる (こられる)',
    },
    // Conditional
    'conditional_ba': {
      'godan': 'For Godan verbs: Change the final う-row kana to the え-row, then add ば.\nExample: 買う → 買え → 買えば',
      'ichidan': 'For Ichidan verbs: Remove る, then add れば.\nExample: 食べる → 食べ → 食べれば',
      'irregular-suru': 'する → すれば',
      'irregular-kuru': '来る (くる) → 来れば (くれば)',
    },
    'conditional_tara': {
      'godan': 'Form the past tense (た-form), then add ら.\nExample: 買った → 買ったら',
      'ichidan': 'Form the past tense (た-form), then add ら.\nExample: 食べた → 食べたら',
      'irregular-suru': 'した → したら',
      'irregular-kuru': '来た (きた) → 来たら (きたら)',
    },
    // Passive
    'passive': {
      'godan': 'For Godan verbs: Change the final う-row kana to the あ-row, then add れる.\nExample: 買う → 買わ → 買われる',
      'ichidan': 'For Ichidan verbs: Remove る, then add られる.\nExample: 食べる → 食べ → 食べられる',
      'irregular-suru': 'する → される',
      'irregular-kuru': '来る (くる) → 来られる (こられる)',
    },
    // Causative
    'causative': {
      'godan': 'For Godan verbs: Change the final う-row kana to the あ-row, then add せる.\nExample: 買う → 買わ → 買わせる',
      'ichidan': 'For Ichidan verbs: Remove る, then add させる.\nExample: 食べる → 食べ → 食べさせる',
      'irregular-suru': 'する → させる',
      'irregular-kuru': '来る (くる) → 来させる (こさせる)',
    },
    // Imperative
    'imperative': {
      'godan': 'For Godan verbs: Change the final う-row kana to the え-row.\nExample: 買う → 買え',
      'ichidan': 'For Ichidan verbs: Remove る, then add ろ (or よ for more formal).\nExample: 食べる → 食べろ',
      'irregular-suru': 'する → しろ (or せよ)',
      'irregular-kuru': '来る (くる) → 来い (こい)',
    },
  };

  // Default explanation if specific one not found
  const defaultExplanation = `Change the verb to the ${getConjugationEnglish(toForm)} form.`;

  const formExplanations = explanations[toForm];
  if (!formExplanations) return defaultExplanation;

  return formExplanations[verbGroup] || formExplanations['godan'] || defaultExplanation;
}

function generateMCOptions(
  correctAnswer: ConjugationForm,
  allConjugations: Record<string, ConjugationForm>,
  toFormKey: string,
  dictionaryForm: string
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
    .filter(([key, val]) => {
      // Exclude the correct answer form
      if (key === toFormKey) return false;
      // Exclude dictionary form by VALUE (comparing kanji text)
      // This is needed because the DB doesn't have a 'dictionary' key
      if (val.kanji === dictionaryForm) return false;
      return true;
    })
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
 * SRS-aware combination builder
 * Prioritizes verbs/forms that are due for review based on SM-2 algorithm
 */
interface SRSCombination extends ValidCombination {
  isDue: boolean;        // Is this item due for review?
  overdueBy: number;     // How many days overdue (0 if not due yet)
  isNew: boolean;        // Never reviewed before?
  srsPriority: number;   // Combined priority score
}

/**
 * Balance combinations to ensure equal representation of each conjugation form
 * This prevents one form (like polite present) from dominating the question pool
 */
function balanceCombinationsByForm(combinations: ValidCombination[]): ValidCombination[] {
  if (combinations.length === 0) return combinations;

  // Group combinations by form type
  const byForm = new Map<string, ValidCombination[]>();
  for (const combo of combinations) {
    const form = combo.prompt.to_form;
    if (!byForm.has(form)) {
      byForm.set(form, []);
    }
    byForm.get(form)!.push(combo);
  }

  // Find the target count per form (use the median to avoid outliers)
  const counts = Array.from(byForm.values()).map(arr => arr.length).sort((a, b) => a - b);
  const medianCount = counts[Math.floor(counts.length / 2)];

  // Balance each form to roughly equal representation
  const balanced: ValidCombination[] = [];
  for (const [form, combos] of byForm.entries()) {
    const shuffled = shuffleArray(combos);
    // Take up to median count, but don't remove forms entirely if they're underrepresented
    const targetCount = Math.max(medianCount, Math.ceil(combos.length * 0.7));
    balanced.push(...shuffled.slice(0, targetCount));
  }

  // Final shuffle to mix forms together
  return shuffleArray(balanced);
}

/**
 * Calculate SRS priority for a verb-form combination
 * Higher = should be shown sooner
 */
function calculateSRSPriority(
  progress: UserVerbProgress | undefined,
  verbFrequency: number
): { isDue: boolean; overdueBy: number; isNew: boolean; priority: number } {
  const now = new Date();

  // New items (never reviewed) - high priority to introduce
  if (!progress) {
    return {
      isDue: true,
      overdueBy: 0,
      isNew: true,
      priority: 50 + verbFrequency, // Base 50 + word frequency bonus
    };
  }

  const nextReview = new Date(progress.next_review_at);
  const diffMs = now.getTime() - nextReview.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays >= 0) {
    // Item is due or overdue
    // Priority increases with how overdue it is
    // Cap at 100 to prevent runaway values
    const overdueBonus = Math.min(diffDays * 10, 50);
    return {
      isDue: true,
      overdueBy: diffDays,
      isNew: false,
      priority: 100 + overdueBonus, // Overdue items get highest priority
    };
  } else {
    // Item is not due yet
    // Lower priority, but allow occasional early review
    return {
      isDue: false,
      overdueBy: 0,
      isNew: false,
      priority: Math.max(0, 20 + diffDays), // Decreases as review date is further away
    };
  }
}

/**
 * Build valid verb-form combinations with intelligent randomization
 * - Weighted random verb selection (prioritizes common words)
 * - All conjugation forms within each phase (ensures equal representation)
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

      // Include ALL forms from this phase (not just 1-2)
      // This ensures balanced representation when questions are selected
      for (const formKey of phaseForms) {
        // Check if this verb has this conjugation
        if (verb.conjugations && verb.conjugations[formKey]) {
          // Create a synthetic prompt for this form with proper explanation
          const prompt: DrillPrompt = {
            id: `auto-${phase}-${formKey}`,
            from_form: 'plain_positive',
            to_form: formKey,
            prompt_en: `Change to ${getConjugationEnglish(formKey)}`,
            prompt_jp: `${getConjugationEnglish(formKey)}に変えてください`,
            explanation: getConjugationExplanation(formKey, verb.verb_group),
            word_type: 'verb',
            phase: phase as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
          };

          combinations.push({ verb, prompt });
        }
      }
    }
  }

  // Balance combinations to ensure equal representation of each form type
  return balanceCombinationsByForm(combinations);
}

/**
 * Build SRS-aware combinations with user progress data
 * Returns combinations sorted by review priority
 */
function buildSRSCombinations(
  verbs: Verb[],
  phases: number[],
  jlptLevel: string,
  userProgress: UserVerbProgress[]
): SRSCombination[] {
  const combinations: SRSCombination[] = [];

  // Create a lookup map for quick progress access
  const progressMap = new Map<string, UserVerbProgress>();
  for (const p of userProgress) {
    const key = `${p.verb_id}:${p.conjugation_form}`;
    progressMap.set(key, p);
  }

  for (const verb of verbs) {
    for (const phase of phases) {
      const phaseForms = PHASE_FORMS[phase] || [];

      for (const formKey of phaseForms) {
        if (verb.conjugations && verb.conjugations[formKey]) {
          const progressKey = `${verb.id}:${formKey}`;
          const progress = progressMap.get(progressKey);

          const srsData = calculateSRSPriority(progress, verb.frequency || 5);

          const prompt: DrillPrompt = {
            id: `auto-${phase}-${formKey}`,
            from_form: 'plain_positive',
            to_form: formKey,
            prompt_en: `Change to ${getConjugationEnglish(formKey)}`,
            prompt_jp: `${getConjugationEnglish(formKey)}に変えてください`,
            explanation: getConjugationExplanation(formKey, verb.verb_group),
            word_type: 'verb',
            phase: phase as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
          };

          combinations.push({
            verb,
            prompt,
            isDue: srsData.isDue,
            overdueBy: srsData.overdueBy,
            isNew: srsData.isNew,
            srsPriority: srsData.priority,
          });
        }
      }
    }
  }

  // Balance by form first (before SRS sorting)
  // This ensures we have equal representation of each form type
  const balancedByForm = balanceCombinationsByForm(combinations);

  // Sort by SRS priority (highest first) with some randomization
  balancedByForm.sort((a, b) => {
    // Add randomness (±20% of priority) to prevent deterministic ordering
    const randomA = a.srsPriority * (0.8 + Math.random() * 0.4);
    const randomB = b.srsPriority * (0.8 + Math.random() * 0.4);
    return randomB - randomA;
  });

  return balancedByForm;
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

    const mcOptions = generateMCOptions(correctConjugation, verb.conjugations, grammarEngineKey, verb.dictionary_form);

    // Fetch example sentence for sentence mode
    let exampleSentence = undefined;
    if (practiceMode === 'sentence') {
      const { data: sentences } = await supabase
        .from('example_sentences')
        .select('*')
        .eq('word_key', verb.dictionary_form)
        .limit(10);  // Get multiple sentences for variety

      if (sentences && sentences.length > 0) {
        // Pick a random sentence from available ones
        const sent = sentences[Math.floor(Math.random() * sentences.length)];
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
// SM-2 ALGORITHM (for answer recording)
// ============================================================================

interface SM2Result {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date;
}

function calculateSM2(
  quality: number,
  currentEF: number = 2.5,
  currentInterval: number = 0,
  currentReps: number = 0
): SM2Result {
  const q = Math.max(0, Math.min(5, quality));
  let newEF = currentEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  newEF = Math.max(1.3, newEF);

  let newInterval: number;
  let newReps: number;

  if (q < 3) {
    newReps = 0;
    newInterval = 0;
  } else {
    newReps = currentReps + 1;
    if (newReps === 1) newInterval = 1;
    else if (newReps === 2) newInterval = 6;
    else newInterval = Math.round(currentInterval * newEF);
  }

  const nextReviewAt = new Date();
  if (newInterval === 0) {
    nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 10);
  } else {
    nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);
  }

  return {
    easeFactor: Math.round(newEF * 100) / 100,
    intervalDays: newInterval,
    repetitions: newReps,
    nextReviewAt,
  };
}

function booleanToQuality(isCorrect: boolean, responseTimeMs?: number): number {
  if (!isCorrect) return 1;
  if (responseTimeMs !== undefined) {
    if (responseTimeMs < 2000) return 5;
    if (responseTimeMs < 5000) return 4;
    return 3;
  }
  return 4;
}

// ============================================================================
// HANDLER: Record Answer (POST)
// ============================================================================

async function handleRecordAnswer(
  req: VercelRequest,
  res: VercelResponse,
  supabase: any,
  userId: string
) {
  const { verbId, conjugationForm, isCorrect, responseTimeMs } = req.body;

  if (!verbId || !conjugationForm || isCorrect === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: verbId, conjugationForm, isCorrect'
    });
  }

  const { data: existingProgress, error: fetchError } = await supabase
    .from('user_verb_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('verb_id', verbId)
    .eq('conjugation_form', conjugationForm)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    return res.status(500).json({ error: 'Failed to fetch progress' });
  }

  const quality = booleanToQuality(isCorrect, responseTimeMs);
  const sm2Result = calculateSM2(
    quality,
    existingProgress?.ease_factor || 2.5,
    existingProgress?.interval_days || 0,
    existingProgress?.repetitions || 0
  );

  const progressData = {
    user_id: userId,
    verb_id: verbId,
    conjugation_form: conjugationForm,
    ease_factor: sm2Result.easeFactor,
    interval_days: sm2Result.intervalDays,
    repetitions: sm2Result.repetitions,
    last_reviewed_at: new Date().toISOString(),
    next_review_at: sm2Result.nextReviewAt.toISOString(),
    total_reviews: (existingProgress?.total_reviews || 0) + 1,
    correct_reviews: (existingProgress?.correct_reviews || 0) + (isCorrect ? 1 : 0),
    streak: isCorrect ? (existingProgress?.streak || 0) + 1 : 0,
    updated_at: new Date().toISOString(),
  };

  const { data: upsertedProgress, error: upsertError } = await supabase
    .from('user_verb_progress')
    .upsert(progressData, { onConflict: 'user_id,verb_id,conjugation_form' })
    .select()
    .single();

  if (upsertError) {
    return res.status(500).json({ error: 'Failed to update progress' });
  }

  return res.status(200).json({
    success: true,
    progress: upsertedProgress,
    sm2: {
      quality,
      newEaseFactor: sm2Result.easeFactor,
      newInterval: sm2Result.intervalDays,
      nextReviewAt: sm2Result.nextReviewAt.toISOString(),
    },
  });
}

// ============================================================================
// HANDLER: Get SRS Stats (GET ?action=stats)
// ============================================================================

async function handleGetStats(
  req: VercelRequest,
  res: VercelResponse,
  supabase: any,
  userId: string
) {
  const { jlptLevel = 'N5' } = req.query as Record<string, string>;

  const { data: progress, error: progressError } = await supabase
    .from('user_verb_progress')
    .select(`*, verbs!inner(id, dictionary_form, jlpt_level, frequency)`)
    .eq('user_id', userId);

  if (progressError) {
    return res.status(500).json({ error: 'Failed to fetch progress' });
  }

  const now = new Date();
  let filteredProgress = (progress || []).filter(
    (p: any) => p.verbs?.jlpt_level === jlptLevel
  );

  let dueNow = 0, dueToday = 0, learned = 0, mastered = 0, struggling = 0;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const verbStats = new Map<string, { dueCount: number; totalForms: number; masteredForms: number }>();

  for (const record of filteredProgress) {
    const nextReview = new Date(record.next_review_at);
    const verbId = record.verb_id;

    if (!verbStats.has(verbId)) {
      verbStats.set(verbId, { dueCount: 0, totalForms: 0, masteredForms: 0 });
    }
    const vs = verbStats.get(verbId)!;
    vs.totalForms++;

    if (nextReview <= now) { dueNow++; vs.dueCount++; }
    else if (nextReview <= endOfToday) { dueToday++; }
    if (record.correct_reviews > 0) { learned++; }
    if (record.interval_days >= 21) { mastered++; vs.masteredForms++; }
    if (record.ease_factor < 2.0) { struggling++; }
  }

  let verbsLearning = 0, verbsMastered = 0;
  for (const [, stats] of verbStats) {
    if (stats.masteredForms === stats.totalForms && stats.totalForms > 0) verbsMastered++;
    else if (stats.totalForms > 0) verbsLearning++;
  }

  const { count: totalVerbs } = await supabase
    .from('verbs')
    .select('id', { count: 'exact', head: true })
    .eq('jlpt_level', jlptLevel);

  const verbsInProgress = verbStats.size;
  const newAvailable = (totalVerbs || 0) - verbsInProgress;

  return res.status(200).json({
    stats: { dueNow, dueToday, totalDue: dueNow + dueToday, learned, mastered, struggling, totalReviewed: filteredProgress.length },
    verbs: { inProgress: verbsInProgress, learning: verbsLearning, mastered: verbsMastered, new: newAvailable, total: totalVerbs || 0 },
    meta: { jlptLevel, asOf: now.toISOString() },
  });
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

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get user from auth header
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    userId = user?.id || null;
  }

  // Route based on method and action
  const { action } = req.query as Record<string, string>;

  // POST = Record answer
  if (req.method === 'POST') {
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handleRecordAnswer(req, res, supabase, userId);
  }

  // GET ?action=stats = Get SRS stats
  if (req.method === 'GET' && action === 'stats') {
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handleGetStats(req, res, supabase, userId);
  }

  // GET = Get drill questions (default)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      phases = '1',
      jlptLevel = 'N5',
      wordTypes = 'verb',
      count = '10',
      practiceMode = 'word',
      srsReviewMode = 'mixed',
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

    // Fetch user's verb progress for SRS if authenticated
    let userProgress: UserVerbProgress[] = [];
    let usingSRS = false;

    if (userId) {
      const verbIds = verbs.map(v => v.id);
      const { data: progressData, error: progressError } = await supabase
        .from('user_verb_progress')
        .select('*')
        .eq('user_id', userId)
        .in('verb_id', verbIds);

      if (!progressError && progressData) {
        userProgress = progressData as UserVerbProgress[];
        usingSRS = true;
      }
    }

    // Build combinations - use SRS-aware builder if user is authenticated
    let validCombinations: ValidCombination[];
    let dueCount = 0;
    let newCount = 0;

    if (usingSRS) {
      // Use SRS-aware combination builder
      const srsCombinations = buildSRSCombinations(
        verbs as Verb[],
        phaseList,
        jlptLevel,
        userProgress
      );

      // Count due and new items
      dueCount = srsCombinations.filter(c => c.isDue && !c.isNew).length;
      newCount = srsCombinations.filter(c => c.isNew).length;

      // Filter based on SRS review mode
      if (srsReviewMode === 'due_only') {
        // Only show items that are due for review (not new)
        validCombinations = srsCombinations.filter(c => c.isDue && !c.isNew);
      } else if (srsReviewMode === 'new_only') {
        // Only show new items (never reviewed)
        validCombinations = srsCombinations.filter(c => c.isNew);
      } else {
        // Mixed mode - use all combinations (already sorted by priority)
        validCombinations = srsCombinations;
      }
    } else {
      // Fall back to weighted random selection (no SRS data)
      validCombinations = buildValidCombinations(
        verbs as Verb[],
        phaseList,
        jlptLevel
      );
    }

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
        srs: {
          enabled: usingSRS,
          mode: srsReviewMode,
          progressRecords: userProgress.length,
          dueForReview: dueCount,
          newItems: newCount,
        },
      }
    });
  } catch (error) {
    console.error('Drill API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
