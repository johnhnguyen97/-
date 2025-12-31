import { useState, useRef, useEffect } from 'react';

interface StrokeAnimationProps {
  videoUrl?: string;
  character: string;
  isDark: boolean;
}

export function StrokeAnimation({ videoUrl, character, isDark }: StrokeAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset state when video URL changes
    setIsLoaded(false);
    setHasError(false);
    setIsPlaying(false);
    setProgress(0);
  }, [videoUrl]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progress);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  const theme = {
    container: isDark
      ? 'bg-black/30 border-white/10'
      : 'bg-gray-100 border-stone-200',
    placeholder: isDark ? 'text-white/20' : 'text-gray-300',
    button: isDark
      ? 'bg-white/10 hover:bg-white/20 text-white'
      : 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm',
    progress: isDark ? 'bg-white/20' : 'bg-gray-300',
    progressBar: isDark ? 'bg-amber-500' : 'bg-amber-500',
  };

  // No video URL - show placeholder
  if (!videoUrl) {
    return (
      <div className={`relative aspect-square rounded-xl border-2 border-dashed flex items-center justify-center ${theme.container}`}>
        <div className="text-center">
          <div className={`text-6xl font-serif mb-2 ${theme.placeholder}`}>
            {character}
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Stroke animation not available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl border overflow-hidden ${theme.container}`}>
      {/* Video */}
      <div className="aspect-square relative">
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-6xl font-serif animate-pulse ${theme.placeholder}`}>
              {character}
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-6xl font-serif mb-2 ${theme.placeholder}`}>
                {character}
              </div>
              <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                Failed to load animation
              </p>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          src={videoUrl}
          className={`w-full h-full object-contain ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          playsInline
          muted
        />
      </div>

      {/* Progress bar */}
      {isLoaded && (
        <div className={`h-1 ${theme.progress}`}>
          <div
            className={`h-full transition-all duration-100 ${theme.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Controls */}
      {isLoaded && (
        <div className="flex items-center justify-center gap-2 p-3">
          <button
            onClick={handleRestart}
            className={`p-2 rounded-lg transition-colors ${theme.button}`}
            title="Restart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={handlePlayPause}
            className={`p-3 rounded-lg transition-colors ${theme.button}`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
