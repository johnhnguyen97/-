import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface WordNote {
  word: string;
  note: string;
  updated_at: string;
}

interface WordNotesContextType {
  notes: WordNote[];
  notedWords: Set<string>;
  hasNote: (word: string) => boolean;
  getNote: (word: string) => string;
  saveNote: (word: string, note: string) => void;
  deleteNote: (word: string) => void;
}

const WordNotesContext = createContext<WordNotesContextType | undefined>(undefined);

const STORAGE_KEY = 'gojun-word-notes';

export function WordNotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<WordNote[]>([]);
  const [notedWords, setNotedWords] = useState<Set<string>>(new Set());

  // Load notes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: WordNote[] = JSON.parse(stored);
        setNotes(parsed);
        setNotedWords(new Set(parsed.map(n => n.word)));
      } catch (e) {
        console.error('Failed to parse word notes:', e);
      }
    }
  }, []);

  const hasNote = useCallback((word: string) => {
    return notedWords.has(word);
  }, [notedWords]);

  const getNote = useCallback((word: string) => {
    const note = notes.find(n => n.word === word);
    return note?.note || '';
  }, [notes]);

  const saveNote = useCallback((word: string, noteText: string) => {
    setNotes(prev => {
      const existingIndex = prev.findIndex(n => n.word === word);
      const newNote: WordNote = {
        word,
        note: noteText.trim(),
        updated_at: new Date().toISOString()
      };

      let updated: WordNote[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = newNote;
      } else {
        updated = [...prev, newNote];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setNotedWords(prev => new Set([...prev, word]));
  }, []);

  const deleteNote = useCallback((word: string) => {
    setNotes(prev => {
      const updated = prev.filter(n => n.word !== word);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setNotedWords(prev => {
      const updated = new Set(prev);
      updated.delete(word);
      return updated;
    });
  }, []);

  return (
    <WordNotesContext.Provider value={{ notes, notedWords, hasNote, getNote, saveNote, deleteNote }}>
      {children}
    </WordNotesContext.Provider>
  );
}

export function useWordNotes() {
  const context = useContext(WordNotesContext);
  if (!context) {
    throw new Error('useWordNotes must be used within a WordNotesProvider');
  }
  return context;
}
