// Sentence Favorites API Service

const API_BASE = '/api';

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

export interface SentenceFavorite {
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

export interface SaveSentenceParams {
  japanese: string;
  english: string;
  reading?: string;
  category?: SentenceCategory;
  source?: string;
  source_id?: string;
  notes?: string;
}

/**
 * Get all sentence favorites for the current user
 */
export async function getSentenceFavorites(
  token: string,
  category?: string
): Promise<{ favorites: SentenceFavorite[]; categories: typeof SENTENCE_CATEGORIES }> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);

  const response = await fetch(`${API_BASE}/sentence-favorites?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sentence favorites');
  }

  return response.json();
}

/**
 * Save a sentence to favorites
 */
export async function saveSentenceFavorite(
  token: string,
  params: SaveSentenceParams
): Promise<{ favorite: SentenceFavorite }> {
  const response = await fetch(`${API_BASE}/sentence-favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to save sentence');
  }

  return response.json();
}

/**
 * Delete a sentence from favorites
 */
export async function deleteSentenceFavorite(
  token: string,
  idOrJapanese: string
): Promise<void> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrJapanese);

  const response = await fetch(`${API_BASE}/sentence-favorites`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(isUuid ? { id: idOrJapanese } : { japanese: idOrJapanese }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete sentence');
  }
}

/**
 * Check if a sentence is already favorited
 */
export async function isSentenceFavorited(
  token: string,
  japanese: string
): Promise<boolean> {
  try {
    const { favorites } = await getSentenceFavorites(token);
    return favorites.some(f => f.japanese === japanese);
  } catch {
    return false;
  }
}

/**
 * Get category info by ID
 */
export function getCategoryById(id: string) {
  return SENTENCE_CATEGORIES.find(c => c.id === id) || SENTENCE_CATEGORIES[0];
}
