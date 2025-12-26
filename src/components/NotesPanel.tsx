import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFavorites, deleteFavorite, type Favorite } from '../services/favoritesApi';
import { WORD_CATEGORIES } from './FavoriteButton';

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'favorites' | 'notes';

// Note type for personal notes
interface Note {
  id: string;
  content: string;
  created_at: string;
}

// Get category styling
const getCategoryStyle = (categoryId: string) => {
  const cat = WORD_CATEGORIES.find(c => c.id === categoryId);
  return cat || { id: categoryId, label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1), icon: '?', color: 'from-gray-500 to-gray-600' };
};

const CATEGORY_ORDER = WORD_CATEGORIES.map(c => c.id as string);

export function NotesPanel({ isOpen, onClose }: NotesPanelProps) {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('favorites');
  const [isVisible, setIsVisible] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Favorite[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  // Notes state (local storage for now)
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      if (session?.access_token) {
        loadFavorites();
      }
      loadNotes();
    }
  }, [isOpen, session]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  // Load favorites from API
  const loadFavorites = async () => {
    if (!session?.access_token) return;
    setFavoritesLoading(true);
    setFavoritesError(null);
    try {
      const data = await getFavorites(session.access_token);
      setFavorites(data.favorites);
      setGrouped(data.grouped);
    } catch (err) {
      setFavoritesError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleDeleteFavorite = async (word: string) => {
    if (!session?.access_token) return;
    try {
      await deleteFavorite(word, session.access_token);
      await loadFavorites();
    } catch (err) {
      setFavoritesError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  // Load notes from localStorage
  const loadNotes = () => {
    const stored = localStorage.getItem('gojun-notes');
    if (stored) {
      setNotes(JSON.parse(stored));
    }
  };

  // Save notes to localStorage
  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem('gojun-notes', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      created_at: new Date().toISOString()
    };
    saveNotes([note, ...notes]);
    setNewNote('');
  };

  const handleUpdateNote = (id: string) => {
    if (!editContent.trim()) return;
    const updated = notes.map(n =>
      n.id === id ? { ...n, content: editContent.trim() } : n
    );
    saveNotes(updated);
    setEditingNoteId(null);
    setEditContent('');
  };

  const handleDeleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
  };

  if (!isOpen) return null;

  // Sort categories
  const categories = Object.keys(grouped).sort((a, b) => {
    const aIdx = CATEGORY_ORDER.indexOf(a);
    const bIdx = CATEGORY_ORDER.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const displayFavorites = selectedCategory === 'all'
    ? favorites
    : grouped[selectedCategory] || [];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-200 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 md:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                📝
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">Notes</h2>
                <p className="text-white/80 text-xs md:text-sm">
                  {activeTab === 'favorites' ? `${favorites.length} saved words` : `${notes.length} notes`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:rotate-90 duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'favorites'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <span>★</span> Favorites
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'notes'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <span>📝</span> My Notes
            </button>
          </div>

          {/* Category Filter for Favorites */}
          {activeTab === 'favorites' && categories.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-white/30 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                All ({favorites.length})
              </button>
              {categories.map(cat => {
                const style = getCategoryStyle(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
                      selectedCategory === cat
                        ? 'bg-white/30 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center bg-white/20">
                      {style.icon}
                    </span>
                    {grouped[cat]?.length || 0}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
          {activeTab === 'favorites' ? (
            // Favorites Tab
            <>
              {favoritesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  </div>
                </div>
              ) : favoritesError ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium">{favoritesError}</p>
                </div>
              ) : displayFavorites.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
                    <span className="text-4xl">★</span>
                  </div>
                  <p className="text-gray-600 font-medium">No favorites yet</p>
                  <p className="text-gray-400 text-sm mt-1">Click the ★ on words to save them</p>
                </div>
              ) : (
                <div className="space-y-2 stagger-children">
                  {displayFavorites.map((fav) => {
                    const catStyle = getCategoryStyle(fav.category);
                    return (
                      <div
                        key={fav.id}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all group"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${catStyle.color} text-white font-bold flex items-center justify-center text-sm shrink-0`}>
                          {catStyle.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xl font-bold text-gray-900">{fav.word}</span>
                            <span className="text-sm text-gray-500">{fav.reading}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{fav.english}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteFavorite(fav.word)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Remove"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            // Notes Tab
            <>
              {/* Add Note Input */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Write a note..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Notes List */}
              {notes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
                    <span className="text-4xl">📝</span>
                  </div>
                  <p className="text-gray-600 font-medium">No notes yet</p>
                  <p className="text-gray-400 text-sm mt-1">Add your first note above</p>
                </div>
              ) : (
                <div className="space-y-2 stagger-children">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all group"
                    >
                      {editingNoteId === note.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateNote(note.id)}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-400 outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateNote(note.id)}
                            className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-gray-800">{note.content}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(note.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditContent(note.content);
                              }}
                              className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
