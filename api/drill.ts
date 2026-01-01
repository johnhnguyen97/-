import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Map from masu-form (drill_sentences) to dictionary form (example_sentences)
const MASU_TO_DICTIONARY: Record<string, string> = {
  '食べます': '食べる',
  '見ます': '見る',
  '起きます': '起きる',
  '寝ます': '寝る',
  '開けます': '開ける',
  '行きます': '行く',
  '書きます': '書く',
  '読みます': '読む',
  '飲みます': '飲む',
  '買います': '買う',
  '話します': '話す',
  '聞きます': '聞く',
  '待ちます': '待つ',
  'します': 'する',
  '来ます': '来る',
  '高いです': '高い',
  '安いです': '安い',
  'おいしいです': 'おいしい',
  '大きいです': '大きい',
  '小さいです': '小さい',
  '静かです': '静か',
  '元気です': '元気',
  '好きです': '好き',
  'きれいです': 'きれい',
  '有名です': '有名',
};

interface DrillSentence {
  id: string;
  japanese_base: string;
  english: string;
  word_type: 'verb' | 'adjective';
  verb_group?: string;
  adjective_type?: string;
  jlpt_level: string;
  conjugations: Record<string, { japanese: string; reading: string; romaji: string }>;
  dictionary_form?: string;
  reading?: string;
  romaji?: string;
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

interface ExampleSentence {
  id: string;
  japanese: string;
  english: string;
  word_key: string;
  word_reading: string;
  tatoeba_id: number;
  jlpt_level: string;
}

interface MCOption {
  id: string;
  text: string;
  reading: string;
  isCorrect: boolean;
  english?: string;
}

interface ValidCombination {
  sentence: DrillSentence;
  prompt: DrillPrompt;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Expanded form mapping with all conjugation types
function getConjugationEnglish(toForm: string): string {
  const formMap: Record<string, string> = {
    // Legacy forms (backward compatibility)
    'present_positive': 'do/does',
    'present_negative': "don't/doesn't",
    'past_positive': 'did',
    'past_negative': "didn't",
    'potential': 'can do',
    // Polite forms
    'masu_positive': 'do/does (polite)',
    'masu_negative': "don't/doesn't (polite)",
    'masu_past_positive': 'did (polite)',
    'masu_past_negative': "didn't (polite)",
    // Plain forms
    'plain_positive': 'dictionary form',
    'plain_negative': "don't/doesn't (plain)",
    'plain_past_positive': 'did (plain)',
    'plain_past_negative': "didn't (plain)",
    // Te-form
    'te_form': '-te form',
    'te_iru': 'is doing',
    // Desire
    'tai_form': 'want to',
    'tai_negative': "don't want to",
    'tai_past': 'wanted to',
    // Volitional
    'volitional': "let's / I'll",
    'volitional_polite': "let's (polite)",
    // Potential
    'potential_positive': 'can do',
    'potential_negative': "can't do",
    // Conditional
    'conditional_ba': 'if (general)',
    'conditional_tara': 'if/when',
    'conditional_to': 'when/whenever',
    'conditional_nara': 'if (hypothetical)',
    // Passive
    'passive_positive': 'is done (passive)',
    'passive_negative': "isn't done (passive)",
    // Causative
    'causative_positive': 'make/let do',
    'causative_negative': "don't make/let do",
    'causative_passive': 'is made to do',
    // Imperative
    'imperative': 'do! (command)',
    'imperative_negative': "don't do!",
  };
  return formMap[toForm] || toForm;
}

function generateMCOptions(
  correctAnswer: { japanese: string; reading: string; romaji: string },
  allConjugations: Record<string, { japanese: string; reading: string; romaji: string }>,
  toForm: string
): MCOption[] {
  const options: MCOption[] = [{
    id: 'correct',
    text: correctAnswer.japanese,
    reading: correctAnswer.reading,
    isCorrect: true,
    english: getConjugationEnglish(toForm),
  }];

  // Get other forms as distractors
  const otherForms = Object.entries(allConjugations)
    .filter(([key]) => key !== toForm)
    .map(([key, val]) => ({
      id: key,
      text: val.japanese,
      reading: val.reading,
      isCorrect: false,
      english: getConjugationEnglish(key),
    }));

  const shuffledOthers = shuffleArray(otherForms).slice(0, 3);
  options.push(...shuffledOthers);

  return shuffleArray(options);
}

/**
 * Generate all valid sentence-prompt combinations upfront.
 * This fixes the repetition bug by pre-computing combinations instead of
 * randomly selecting and hoping to avoid duplicates.
 */
function buildValidCombinations(
  sentences: DrillSentence[],
  prompts: DrillPrompt[]
): ValidCombination[] {
  const combinations: ValidCombination[] = [];

  for (const sentence of sentences) {
    for (const prompt of prompts) {
      // Check if this prompt is valid for this sentence
      const isWordTypeMatch = prompt.word_type === 'both' || prompt.word_type === sentence.word_type;
      const hasConjugation = sentence.conjugations && sentence.conjugations[prompt.to_form];

      if (isWordTypeMatch && hasConjugation) {
        combinations.push({ sentence, prompt });
      }
    }
  }

  return combinations;
}

/**
 * Generate questions from valid combinations.
 * If there are fewer combinations than requested, cycles through with reshuffling.
 */
function generateQuestionsFromCombinations(
  combinations: ValidCombination[],
  count: number,
  practiceMode: string
): any[] {
  if (combinations.length === 0) {
    return [];
  }

  // Shuffle all combinations
  let shuffled = shuffleArray(combinations);
  const questions: any[] = [];
  let idx = 0;

  while (questions.length < count) {
    // Reshuffle when we've exhausted all combinations
    if (idx >= shuffled.length) {
      shuffled = shuffleArray(combinations);
      idx = 0;

      // Safety check: if we've already generated all unique combinations once
      // and still need more, we'll allow repeats but with different ordering
      if (questions.length >= combinations.length) {
        // We've used all combinations at least once - continue cycling
      }
    }

    const { sentence, prompt } = shuffled[idx];
    const correctAnswer = sentence.conjugations[prompt.to_form];
    const mcOptions = generateMCOptions(correctAnswer, sentence.conjugations, prompt.to_form);

    questions.push({
      sentence,
      prompt,
      correctAnswer,
      mcOptions,
      practiceMode,
    });

    idx++;
  }

  return questions;
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
      phases = '1',
      jlptLevel = 'N5',
      wordTypes = 'verb',
      count = '10',
      practiceMode = 'word',
    } = req.query as Record<string, string>;

    const phaseList = phases.split(',').map(Number);
    const wordTypeList = wordTypes.split(',');
    const questionCount = Math.min(parseInt(count, 10), 30);

    // Fetch sentences
    const sentenceQuery = supabase
      .from('drill_sentences')
      .select('*')
      .eq('jlpt_level', jlptLevel)
      .in('word_type', wordTypeList);

    const { data: sentences, error: sentenceError } = await sentenceQuery;

    if (sentenceError) {
      console.error('Sentence fetch error:', sentenceError);
      return res.status(500).json({ error: 'Failed to fetch sentences' });
    }

    if (!sentences || sentences.length === 0) {
      return res.status(200).json({ questions: [], message: 'No sentences found for the selected criteria' });
    }

    // Fetch prompts
    const { data: prompts, error: promptError } = await supabase
      .from('drill_prompts')
      .select('*')
      .in('phase', phaseList)
      .or(`word_type.eq.both,word_type.in.(${wordTypeList.join(',')})`);

    if (promptError) {
      console.error('Prompt fetch error:', promptError);
      return res.status(500).json({ error: 'Failed to fetch prompts' });
    }

    if (!prompts || prompts.length === 0) {
      return res.status(200).json({ questions: [], message: 'No prompts found for the selected phases' });
    }

    // Build all valid combinations upfront (FIX for repetition bug)
    const validCombinations = buildValidCombinations(
      sentences as DrillSentence[],
      prompts as DrillPrompt[]
    );

    if (validCombinations.length === 0) {
      return res.status(200).json({
        questions: [],
        message: 'No valid question combinations found. Try different settings.'
      });
    }

    // Generate questions from combinations
    const questions = generateQuestionsFromCombinations(
      validCombinations,
      questionCount,
      practiceMode
    );

    // Fetch example sentences if in sentence mode
    if (practiceMode === 'sentence') {
      for (const question of questions) {
        const dictionaryForm = MASU_TO_DICTIONARY[question.sentence.japanese_base] ||
                              question.sentence.dictionary_form ||
                              question.sentence.japanese_base;

        const { data: exampleSentences } = await supabase
          .from('example_sentences')
          .select('*')
          .eq('word_key', dictionaryForm)
          .limit(5);

        if (exampleSentences && exampleSentences.length > 0) {
          question.exampleSentence = exampleSentences[Math.floor(Math.random() * exampleSentences.length)];
        }
      }
    }

    return res.status(200).json({
      questions,
      meta: {
        totalCombinations: validCombinations.length,
        requestedCount: questionCount,
        actualCount: questions.length,
      }
    });
  } catch (error) {
    console.error('Drill API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
