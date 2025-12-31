import { useState, useRef, useEffect } from 'react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface KanjiAudioProps {
  audioUrl?: string;
  label: string;
  reading: string;
  isDark: boolean;
}

export function KanjiAudio({ audioUrl, label, reading, isDark }: KanjiAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Use the speech synthesis hook for TTS fallback
  const { speak, speaking, supported: speechSupported } = useSpeechSynthesis({
    lang: 'ja-JP',
    rate: 0.8,
  });

  useEffect(() => {
    setHasError(false);
    setIsPlayingAudio(false);
  }, [audioUrl]);

  const handlePlayAudio = () => {
    if (!audioRef.current || hasError) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => setHasError(true));
    }
  };

  const handleEnded = () => {
    setIsPlayingAudio(false);
  };

  const handleClick = () => {
    // If we have a working audio URL, use it
    if (audioUrl && !hasError) {
      handlePlayAudio();
    } else if (speechSupported) {
      // Otherwise use Web Speech API
      speak(reading);
    }
  };

  const isPlaying = isPlayingAudio || speaking;
  const isDisabled = !audioUrl && !speechSupported;

  const theme = {
    button: isDark
      ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
      : 'bg-white hover:bg-gray-50 text-gray-700 border-stone-200 shadow-sm',
    buttonActive: isDark
      ? 'bg-amber-500/80 text-white border-amber-500/50'
      : 'bg-amber-500 text-white border-amber-500 shadow-md',
    buttonDisabled: isDark
      ? 'bg-white/5 text-gray-600 cursor-not-allowed'
      : 'bg-gray-100 text-gray-400 cursor-not-allowed',
    label: isDark ? 'text-gray-400' : 'text-gray-500',
    reading: isDark ? 'text-white' : 'text-gray-800',
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
          isDisabled
            ? theme.buttonDisabled
            : isPlaying
              ? theme.buttonActive
              : theme.button
        } ${isPlaying ? 'scale-95 animate-pulse' : ''}`}
        title={isDisabled ? 'Audio unavailable' : `Play ${label}`}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
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
          onPlay={() => setIsPlayingAudio(true)}
          onPause={() => setIsPlayingAudio(false)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
