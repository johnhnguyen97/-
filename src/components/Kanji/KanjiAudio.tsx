import { useState, useRef, useEffect } from 'react';

interface KanjiAudioProps {
  audioUrl?: string;
  label: string;
  reading: string;
  isDark: boolean;
}

export function KanjiAudio({ audioUrl, label, reading, isDark }: KanjiAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsPlaying(false);
  }, [audioUrl]);

  const handlePlay = () => {
    if (!audioRef.current || hasError) return;

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setHasError(true));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  // Fallback to Web Speech API if no audio URL
  const handleSpeechFallback = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(reading);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const theme = {
    button: isDark
      ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
      : 'bg-white hover:bg-gray-50 text-gray-700 border-stone-200 shadow-sm',
    buttonDisabled: isDark
      ? 'bg-white/5 text-gray-600 cursor-not-allowed'
      : 'bg-gray-100 text-gray-400 cursor-not-allowed',
    label: isDark ? 'text-gray-400' : 'text-gray-500',
    reading: isDark ? 'text-white' : 'text-gray-800',
  };

  const isDisabled = !audioUrl && !('speechSynthesis' in window);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={audioUrl && !hasError ? handlePlay : handleSpeechFallback}
        disabled={isDisabled}
        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
          isDisabled ? theme.buttonDisabled : theme.button
        } ${isPlaying ? 'scale-95' : ''}`}
        title={hasError ? 'Audio unavailable' : `Play ${label}`}
      >
        {isPlaying ? (
          <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.5 5C11.5 4.17 12.67 3.75 13.24 4.38L18.24 9.88C18.58 10.26 18.58 10.82 18.24 11.2L13.24 16.7C12.67 17.33 11.5 16.91 11.5 16.08V5Z" />
            <path d="M5 9.5H8.5V14.5H5V9.5Z" />
          </svg>
        ) : hasError ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

      <div>
        <div className={`text-xs uppercase tracking-wide ${theme.label}`}>{label}</div>
        <div className={`font-medium ${theme.reading}`}>{reading}</div>
      </div>

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
