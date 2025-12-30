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
    'present_positive': 'do/does',
    'present_negative': "don't/doesn't",
    'past_positive': 'did',
    'past_negative': "didn't",
    'te_form': '-ing form',
    'tai_form': 'want to',
    'potential': 'can do',
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
    let sentenceQuery = supabase
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
      return res.status(200).json({ questions: [] });
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
      return res.status(200).json({ questions: [] });
    }

    // Generate questions
    const questions = [];
    const usedCombos = new Set<string>();

    for (let i = 0; i < questionCount && i < 100; i++) {
      const sentence = sentences[Math.floor(Math.random() * sentences.length)] as DrillSentence;
      const validPrompts = prompts.filter(
        (p: DrillPrompt) =>
          (p.word_type === 'both' || p.word_type === sentence.word_type) &&
          sentence.conjugations[p.to_form]
      );

      if (validPrompts.length === 0) continue;

      const prompt = validPrompts[Math.floor(Math.random() * validPrompts.length)] as DrillPrompt;
      const comboKey = `${sentence.id}-${prompt.id}`;

      if (usedCombos.has(comboKey)) {
        i--;
        continue;
      }
      usedCombos.add(comboKey);

      const correctAnswer = sentence.conjugations[prompt.to_form];
      const mcOptions = generateMCOptions(correctAnswer, sentence.conjugations, prompt.to_form);

      const question: any = {
        sentence,
        prompt,
        correctAnswer,
        mcOptions,
        practiceMode,
      };

      // Fetch example sentence if in sentence mode
      if (practiceMode === 'sentence') {
        const dictionaryForm = MASU_TO_DICTIONARY[sentence.japanese_base] || sentence.japanese_base;

        const { data: exampleSentences } = await supabase
          .from('example_sentences')
          .select('*')
          .eq('word_key', dictionaryForm)
          .limit(5);

        if (exampleSentences && exampleSentences.length > 0) {
          question.exampleSentence = exampleSentences[Math.floor(Math.random() * exampleSentences.length)];
        }
      }

      questions.push(question);
    }

    return res.status(200).json({ questions });
  } catch (error) {
    console.error('Drill API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
