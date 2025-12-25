import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, supabaseAdmin } from './lib/auth';
import { decrypt } from './lib/crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (auth.error) {
    return res.status(401).json({ error: auth.error });
  }

  try {
    const { sentence, parsedWords } = req.body;

    if (!sentence || typeof sentence !== 'string') {
      return res.status(400).json({ error: 'Sentence is required' });
    }

    // Get user's encrypted API key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('user_api_keys')
      .select('encrypted_key, iv, auth_tag, salt')
      .eq('user_id', auth.userId)
      .single();

    if (keyError || !keyData) {
      return res.status(400).json({ error: 'No API key configured. Please add your Anthropic API key in Settings.' });
    }

    // Decrypt the API key
    let apiKey: string;
    try {
      apiKey = decrypt({
        encrypted: keyData.encrypted_key,
        iv: keyData.iv,
        authTag: keyData.auth_tag,
        salt: keyData.salt,
      });
    } catch {
      return res.status(500).json({ error: 'Failed to decrypt API key' });
    }

    // Build the prompt for Claude
    const prompt = buildTranslationPrompt(sentence, parsedWords);

    // Call Anthropic API with user's key
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json().catch(() => ({}));
      console.error('Anthropic API error:', errorData);

      if (anthropicResponse.status === 401) {
        return res.status(400).json({ error: 'Invalid API key. Please update your API key in Settings.' });
      }

      return res.status(500).json({ error: 'Failed to get translation from AI' });
    }

    const data = await anthropicResponse.json();
    const content = data.content[0]?.text;

    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse the JSON response from Claude
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Invalid response format from AI' });
    }

    const translationResult = JSON.parse(jsonMatch[0]);
    return res.status(200).json(translationResult);

  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildTranslationPrompt(sentence: string, parsedWords: unknown[]): string {
  return `You are a Japanese language expert. Translate the following English sentence into Japanese, breaking it down into its grammatical components.

English sentence: "${sentence}"

Parsed words from English: ${JSON.stringify(parsedWords)}

IMPORTANT RULES:
1. Break down the sentence into INDIVIDUAL grammatical units
2. Include particles as SEPARATE entries (は, が, を, に, で, etc.)
3. For verbs, split the stem and auxiliary endings (e.g., "eating" → 食べ + て + いる)
4. Order the words in CORRECT Japanese word order (typically: Subject + Topic-Marker + Object + Object-Marker + Verb)
5. For each word, specify its grammatical role

Return a JSON object with this EXACT structure:
{
  "fullTranslation": "complete Japanese sentence with all particles",
  "wordOrder": ["subject", "topic-marker", "object", "object-marker", "verb"],
  "wordOrderDisplay": "Subject は → Object を → Verb",
  "words": [
    {
      "english": "English word/meaning",
      "japanese": "日本語",
      "reading": "hiragana reading",
      "romaji": "romaji",
      "partOfSpeech": "noun/verb/particle/auxiliary/etc",
      "role": "subject/verb/verb-stem/auxiliary/object/particle/adjective/adverb/other",
      "particle": "associated particle if any",
      "particleMeaning": "what the particle means",
      "particleExplanation": "detailed explanation of the particle's function"
    }
  ],
  "grammarNotes": [
    {
      "title": "Grammar Point",
      "titleJapanese": "文法ポイント",
      "explanation": "Explanation of the grammar pattern used",
      "example": "Example sentence",
      "exampleTranslation": "Translation of example"
    }
  ]
}

CRITICAL:
- Particles MUST be separate entries with role="particle"
- Verb conjugation endings MUST be separate entries with role="auxiliary"
- The "words" array should be in the correct Japanese sentence order
- Include ALL particles needed for the sentence

Return ONLY the JSON object, no other text.`;
}
