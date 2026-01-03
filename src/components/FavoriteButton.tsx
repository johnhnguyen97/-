import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveFavorite, deleteFavorite } from '../services/favoritesApi';

// Grammar-based categories
export const WORD_CATEGORIES = [
  { id: 'noun', label: 'Noun', icon: '名', color: 'from-blue-500 to-blue-600' },
  { id: 'verb-transitive', label: 'Verb (他)', icon: '他', color: 'from-green-500 to-green-600' },
  { id: 'verb-intransitive', label: 'Verb (自)', icon: '自', color: 'from-emerald-500 to-emerald-600' },
  { id: 'i-adjective', label: 'い-Adj', icon: 'い', color: 'from-orange-500 to-orange-600' },
  { id: 'na-adjective', label: 'な-Adj', icon: 'な', color: 'from-amber-500 to-amber-600' },
  { id: 'adverb', label: 'Adverb', icon: '副', color: 'from-purple-500 to-purple-600' },
  { id: 'particle', label: 'Particle', icon: '助', color: 'from-pink-500 to-pink-600' },
  { id: 'expression', label: 'Expression', icon: '表', color: 'from-red-500 to-red-600' },
  { id: 'kanji', label: 'Kanji', icon: '漢', color: 'from-indigo-500 to-indigo-600' },
  { id: 'other', label: 'Other', icon: '他', color: 'from-gray-500 to-gray-600' },
] as const;

export type WordCategory = typeof WORD_CATEGORIES[number]['id'];

// Auto-detect category based on part of speech or word ending
export function detectCategory(partOfSpeech?: string, word?: string): WordCategory {
  const pos = partOfSpeech?.toLowerCase() || '';

  if (pos.includes('kanji') || pos === 'kanji') return 'kanji';
  if (pos.includes('particle')) return 'particle';
  if (pos.includes('adverb')) return 'adverb';
  if (pos.includes('i-adjective') || pos.includes('い-adjective')) return 'i-adjective';
  if (pos.includes('na-adjective') || pos.includes('な-adjective')) return 'na-adjective';
  if (pos.includes('adjective')) {
    // Check word ending for い vs な adjectives
    if (word?.endsWith('い')) return 'i-adjective';
    return 'na-adjective';
  }
  if (pos.includes('transitive')) return 'verb-transitive';
  if (pos.includes('intransitive')) return 'verb-intransitive';
  if (pos.includes('verb')) return 'verb-intransitive'; // default verb type
  if (pos.includes('noun')) return 'noun';
  if (pos.includes('expression') || pos.includes('phrase')) return 'expression';

  return 'other';
}

interface FavoriteButtonProps {
  word: string;
  reading: string;
  english: string;
  partOfSpeech?: string;
  isFavorited: boolean;
  onToggle?: () => void;
}

export function FavoriteButton({ word, reading, english, partOfSpeech, isFavorited, onToggle }: FavoriteButtonProps) {
  const { session } = useAuth();
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!session?.access_token || loading) return;

    setLoading(true);
    try {
      if (favorited) {
        await deleteFavorite(word, session.access_token);
        setFavorited(false);
      } else {
        // Auto-detect category
        const category = detectCategory(partOfSpeech, word);
        await saveFavorite(word, reading, english, session.access_token, category);
        setFavorited(true);
      }
      if (onToggle) onToggle();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-5 h-5 rounded-full flex items-center justify-center bg-white/90 shadow-sm border border-gray-200 hover:bg-yellow-50 hover:border-yellow-300 active:scale-90 transition-all"
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      disabled={loading}
    >
      {loading ? (
        <span className="w-2.5 h-2.5 block animate-spin rounded-full border-2 border-yellow-300 border-t-yellow-600"></span>
      ) : (
        <svg
          className="w-3 h-3 transition-transform"
          fill={favorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: favorited ? '#fbbf24' : '#9ca3af' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      )}
    </button>
  );
}
