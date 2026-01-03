import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getFavorites, saveFavorite, deleteFavorite } from '../services/favoritesApi';
import type { Favorite } from '../services/favoritesApi';
import { detectCategory } from '../components/FavoriteButton';
import type { WordCategory } from '../components/FavoriteButton';

interface FavoritesContextType {
  favorites: Favorite[];
  favoritedWords: Set<string>;
  loading: boolean;
  isFavorited: (word: string) => boolean;
  addFavorite: (word: string, reading: string, english: string, partOfSpeech?: string) => Promise<void>;
  removeFavorite: (word: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoritedWords, setFavoritedWords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!session?.access_token) {
      setFavorites([]);
      setFavoritedWords(new Set());
      return;
    }

    setLoading(true);
    try {
      const { favorites: fetchedFavorites } = await getFavorites(session.access_token);
      setFavorites(fetchedFavorites);
      setFavoritedWords(new Set(fetchedFavorites.map(f => f.word)));
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Load favorites when session changes
  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorited = useCallback((word: string) => {
    return favoritedWords.has(word);
  }, [favoritedWords]);

  const addFavorite = useCallback(async (word: string, reading: string, english: string, partOfSpeech?: string) => {
    if (!session?.access_token) return;

    try {
      const category = detectCategory(partOfSpeech, word) as WordCategory;
      const newFavorite = await saveFavorite(word, reading, english, session.access_token, category);
      setFavorites(prev => [...prev, newFavorite]);
      setFavoritedWords(prev => new Set([...prev, word]));
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  }, [session?.access_token]);

  const removeFavorite = useCallback(async (word: string) => {
    if (!session?.access_token) return;

    try {
      await deleteFavorite(word, session.access_token);
      setFavorites(prev => prev.filter(f => f.word !== word));
      setFavoritedWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(word);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  }, [session?.access_token]);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      favoritedWords,
      loading,
      isFavorited,
      addFavorite,
      removeFavorite,
      refreshFavorites,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
