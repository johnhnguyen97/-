import { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FavoriteButton } from '../FavoriteButton';
import { WordNoteButton } from '../WordNoteButton';

export interface WordDetailModalProps {
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech?: string;
  jlptLevel?: string;
  isLearned?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onMarkLearned?: () => void;
}

export function WordDetailModal({
  word,
  reading,
  meaning,
  partOfSpeech,
  jlptLevel,
  isLearned = false,
  isOpen,
  onClose,
  onMarkLearned,
}: WordDetailModalProps) {
  const { isDark } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`fixed z-50 animate-slideUp ${
          // Mobile: bottom sheet, Desktop: centered modal
          'inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2'
        }`}
      >
        <div
          className={`
            w-full sm:w-[400px] max-h-[85vh] overflow-y-auto
            rounded-t-3xl sm:rounded-2xl shadow-2xl
            ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
          `}
        >
          {/* Header with close button */}
          <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {jlptLevel && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  {jlptLevel}
                </span>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Word of the Day
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Large Word Display */}
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                {word}
              </div>
              <div className="text-2xl text-gray-500 dark:text-gray-400">
                {reading}
              </div>
              {partOfSpeech && (
                <div className="text-sm text-gray-400 dark:text-gray-500 italic mt-1">
                  {partOfSpeech}
                </div>
              )}
            </div>

            {/* Meaning */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 mb-6">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Meaning
              </div>
              <div className="text-xl text-gray-800 dark:text-gray-200">
                "{meaning}"
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FavoriteButton
                  word={word}
                  reading={reading}
                  english={meaning}
                  partOfSpeech={partOfSpeech}
                />
                <WordNoteButton
                  word={word}
                  reading={reading}
                  english={meaning}
                />
              </div>

              {onMarkLearned && (
                <button
                  onClick={onMarkLearned}
                  className={`
                    px-4 py-2 rounded-xl font-medium transition-all
                    ${isLearned
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {isLearned ? '✓ Learned' : 'Mark as Learned'}
                </button>
              )}
            </div>
          </div>

          {/* Mobile drag indicator */}
          <div className="sm:hidden w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
        </div>
      </div>
    </>
  );
}

export default WordDetailModal;
