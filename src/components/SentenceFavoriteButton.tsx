import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  saveSentenceFavorite,
  deleteSentenceFavorite,
  isSentenceFavorited,
  SENTENCE_CATEGORIES,
  type SentenceCategory,
} from '../services/sentenceFavoritesApi';

interface SentenceFavoriteButtonProps {
  japanese: string;
  english: string;
  reading?: string;
  source?: string;
  sourceId?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function SentenceFavoriteButton({
  japanese,
  english,
  reading,
  source,
  sourceId,
  size = 'sm',
  showLabel = false,
}: SentenceFavoriteButtonProps) {
  const { session } = useAuth();
  const { isDark } = useTheme();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SentenceCategory>('general');

  // Check if already favorited
  useEffect(() => {
    if (session?.access_token && japanese) {
      isSentenceFavorited(session.access_token, japanese)
        .then(setIsFavorited)
        .catch(() => setIsFavorited(false));
    }
  }, [session?.access_token, japanese]);

  const handleToggle = async () => {
    if (!session?.access_token) return;

    if (isFavorited) {
      // Remove from favorites
      setIsLoading(true);
      try {
        await deleteSentenceFavorite(session.access_token, japanese);
        setIsFavorited(false);
      } catch (error) {
        console.error('Failed to remove favorite:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Show category picker
      setShowCategoryPicker(true);
    }
  };

  const handleSave = async () => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      await saveSentenceFavorite(session.access_token, {
        japanese,
        english,
        reading,
        category: selectedCategory,
        source,
        source_id: sourceId,
      });
      setIsFavorited(true);
      setShowCategoryPicker(false);
    } catch (error) {
      console.error('Failed to save favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) return null;

  const sizeClasses = size === 'sm' ? 'p-1.5' : 'p-2';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`${sizeClasses} rounded-lg transition-all ${
          isFavorited
            ? 'text-pink-500 hover:text-pink-600'
            : isDark
              ? 'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'
              : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50'
        } ${isLoading ? 'opacity-50' : ''}`}
        title={isFavorited ? 'Remove from saved sentences' : 'Save sentence'}
      >
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isFavorited ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2}
            className={iconSize}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
            />
          </svg>
          {showLabel && (
            <span className="text-xs">{isFavorited ? 'Saved' : 'Save'}</span>
          )}
        </div>
      </button>

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowCategoryPicker(false)}
          />
          <div
            className={`absolute z-50 right-0 top-full mt-2 w-64 rounded-xl shadow-xl border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } overflow-hidden`}
          >
            <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Save Sentence
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Choose a category
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto p-2">
              {SENTENCE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-colors ${
                    selectedCategory === cat.id
                      ? isDark
                        ? 'bg-pink-500/20 text-pink-300'
                        : 'bg-pink-100 text-pink-700'
                      : isDark
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="text-sm">{cat.label}</span>
                  {selectedCategory === cat.id && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className={`px-3 py-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex gap-2`}>
              <button
                onClick={() => setShowCategoryPicker(false)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${
                  isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  isDark
                    ? 'bg-pink-500 text-white hover:bg-pink-600'
                    : 'bg-pink-500 text-white hover:bg-pink-600'
                } ${isLoading ? 'opacity-50' : ''}`}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
