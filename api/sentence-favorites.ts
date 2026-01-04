import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Predefined categories for sentences
export const SENTENCE_CATEGORIES = [
  { id: 'general', label: 'General', icon: '📝' },
  { id: 'greetings', label: 'Greetings', icon: '👋' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'food', label: 'Food & Dining', icon: '🍜' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'daily', label: 'Daily Life', icon: '🏠' },
  { id: 'emotions', label: 'Emotions', icon: '😊' },
  { id: 'polite', label: 'Polite Expressions', icon: '🙇' },
  { id: 'casual', label: 'Casual Speech', icon: '💬' },
  { id: 'idioms', label: 'Idioms & Proverbs', icon: '📚' },
  { id: 'slang', label: 'Slang', icon: '🔥' },
] as const;

export type SentenceCategory = typeof SENTENCE_CATEGORIES[number]['id'];

interface SentenceFavorite {
  id: string;
  user_id: string;
  japanese: string;
  english: string;
  reading?: string;
  category: string;
  source?: string;
  source_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get user from auth header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // GET - Fetch user's sentence favorites
  if (req.method === 'GET') {
    const { category } = req.query;

    let query = supabase
      .from('user_sentence_favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch favorites' });
    }

    return res.status(200).json({
      favorites: data as SentenceFavorite[],
      categories: SENTENCE_CATEGORIES,
    });
  }

  // POST - Save a sentence favorite
  if (req.method === 'POST') {
    const { japanese, english, reading, category, source, source_id, notes } = req.body;

    if (!japanese || !english) {
      return res.status(400).json({ error: 'Japanese and English text required' });
    }

    const { data, error } = await supabase
      .from('user_sentence_favorites')
      .upsert({
        user_id: user.id,
        japanese,
        english,
        reading: reading || null,
        category: category || 'general',
        source: source || null,
        source_id: source_id || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,japanese',
      })
      .select()
      .single();

    if (error) {
      console.error('Save error:', error);
      return res.status(500).json({ error: 'Failed to save favorite' });
    }

    return res.status(200).json({ favorite: data });
  }

  // DELETE - Remove a sentence favorite
  if (req.method === 'DELETE') {
    const { id, japanese } = req.body;

    let query = supabase
      .from('user_sentence_favorites')
      .delete()
      .eq('user_id', user.id);

    if (id) {
      query = query.eq('id', id);
    } else if (japanese) {
      query = query.eq('japanese', japanese);
    } else {
      return res.status(400).json({ error: 'ID or Japanese text required' });
    }

    const { error } = await query;

    if (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete favorite' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
