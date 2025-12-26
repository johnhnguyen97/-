import { useState, useEffect, useRef } from 'react';

interface WordNote {
  word: string;
  note: string;
  updated_at: string;
}

interface WordNoteButtonProps {
  word: string;
  reading: string;
  english: string;
}

export function WordNoteButton({ word, reading, english }: WordNoteButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [note, setNote] = useState('');
  const [hasNote, setHasNote] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load note from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gojun-word-notes');
    if (stored) {
      const notes: WordNote[] = JSON.parse(stored);
      const existing = notes.find(n => n.word === word);
      if (existing) {
        setNote(existing.note);
        setHasNote(true);
      }
    }
  }, [word]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Portal emerge animation on hover
  const handleMouseEnter = () => {
    if (!isVisible && !isAnimating) {
      setIsAnimating(true);
      setAnimationClass('portal-emerge');
      setIsVisible(true);
      setTimeout(() => setIsAnimating(false), 400);
    }
  };

  // Portal collapse animation on leave
  const handleMouseLeave = () => {
    if (isVisible && !isOpen && !isAnimating) {
      setIsAnimating(true);
      setAnimationClass('portal-collapse');
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const saveNote = () => {
    const stored = localStorage.getItem('gojun-word-notes');
    let notes: WordNote[] = stored ? JSON.parse(stored) : [];

    const existingIndex = notes.findIndex(n => n.word === word);

    if (note.trim()) {
      const newNote: WordNote = {
        word,
        note: note.trim(),
        updated_at: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        notes[existingIndex] = newNote;
      } else {
        notes.push(newNote);
      }
      setHasNote(true);
    } else {
      // Remove note if empty
      notes = notes.filter(n => n.word !== word);
      setHasNote(false);
    }

    localStorage.setItem('gojun-word-notes', JSON.stringify(notes));
    handleClose();
  };

  return (
    <div
      className="absolute -top-2 -left-2 z-20"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Portal ring effect on emerge */}
      {isAnimating && animationClass === 'portal-emerge' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 rounded-full border-2 border-violet-400 portal-ring" />
        </div>
      )}

      {/* The button */}
      {(isVisible || hasNote) && (
        <button
          ref={buttonRef}
          onClick={handleClick}
          className={`word-note-btn ${animationClass} ${hasNote ? 'has-note portal-glow' : ''}`}
          style={{ opacity: hasNote && !isVisible ? 0.7 : undefined }}
        >
          {hasNote ? '📝' : '✏️'}
        </button>
      )}

      {/* Popup */}
      {isOpen && (
        <div
          ref={popupRef}
          className="word-note-popup animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
            <div className="flex-1">
              <div className="font-bold text-gray-900">{word}</div>
              <div className="text-xs text-gray-500">{reading} • {english}</div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Note input */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this word..."
            className="w-full h-20 p-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            autoFocus
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-2">
            {hasNote && (
              <button
                onClick={() => {
                  setNote('');
                  saveNote();
                }}
                className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
            <button
              onClick={saveNote}
              className="px-3 py-1.5 text-xs bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-md transition-all"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
