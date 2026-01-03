import { type ReactNode, useState, useMemo } from 'react';
import { cn } from '../../utils/cn';

// Get current season based on month
function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// Beautiful seasonal gradient fallback
function SeasonalGradient() {
  const season = useMemo(() => getCurrentSeason(), []);

  const seasonStyles = {
    spring: {
      gradient: 'bg-gradient-to-br from-pink-200 via-rose-100 to-pink-300',
      darkGradient: 'dark:from-pink-900/60 dark:via-rose-800/40 dark:to-pink-900/60',
      kanji: '桜',
      decoration: '🌸',
    },
    summer: {
      gradient: 'bg-gradient-to-br from-sky-200 via-blue-100 to-cyan-200',
      darkGradient: 'dark:from-sky-900/60 dark:via-blue-800/40 dark:to-cyan-900/60',
      kanji: '富',
      decoration: '🗻',
    },
    autumn: {
      gradient: 'bg-gradient-to-br from-orange-200 via-amber-100 to-red-200',
      darkGradient: 'dark:from-orange-900/60 dark:via-amber-800/40 dark:to-red-900/60',
      kanji: '紅',
      decoration: '🍁',
    },
    winter: {
      gradient: 'bg-gradient-to-br from-slate-200 via-blue-50 to-indigo-200',
      darkGradient: 'dark:from-slate-900/60 dark:via-blue-900/40 dark:to-indigo-900/60',
      kanji: '雪',
      decoration: '❄️',
    },
  };

  const style = seasonStyles[season];

  return (
    <div className={cn('absolute inset-0', style.gradient, style.darkGradient)}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large kanji watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-serif text-white/20 dark:text-white/10 select-none">
          {style.kanji}
        </div>

        {/* Floating decorations */}
        <div className="absolute top-4 right-8 text-3xl opacity-40 animate-float">{style.decoration}</div>
        <div className="absolute top-12 left-12 text-2xl opacity-30 animate-float" style={{ animationDelay: '1s' }}>{style.decoration}</div>
        <div className="absolute bottom-16 right-16 text-xl opacity-25 animate-float" style={{ animationDelay: '2s' }}>{style.decoration}</div>
        <div className="absolute bottom-8 left-1/4 text-2xl opacity-35 animate-float" style={{ animationDelay: '0.5s' }}>{style.decoration}</div>
      </div>
    </div>
  );
}

export interface BannerProps {
  /** Image source URL */
  image: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Height of the banner */
  height?: string | number;
  /** Gradient blend direction */
  blend?: 'bottom' | 'top' | 'both' | 'none';
  /** Overlay style for text readability */
  overlay?: 'dark' | 'light' | 'none';
  /** Ken Burns animation effect */
  animate?: boolean;
  /** Additional class names */
  className?: string;
  /** Children to render on top of banner */
  children?: ReactNode;
  /** Fallback content while image loads */
  fallback?: ReactNode;
}

export function Banner({
  image,
  alt = 'Banner image',
  height = '200px',
  blend = 'bottom',
  overlay = 'none',
  animate = true,
  className,
  children,
  fallback,
}: BannerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  // Blend gradient based on direction
  const blendGradients: Record<string, string> = {
    bottom: 'linear-gradient(to bottom, transparent 40%, rgba(255,248,245,0.5) 70%, rgba(255,248,245,1) 100%)',
    top: 'linear-gradient(to top, transparent 40%, rgba(255,248,245,0.5) 70%, rgba(255,248,245,1) 100%)',
    both: 'linear-gradient(to bottom, rgba(255,248,245,0.8) 0%, transparent 30%, transparent 70%, rgba(255,248,245,1) 100%)',
    none: 'none',
  };

  // Dark mode blend gradients
  const darkBlendGradients: Record<string, string> = {
    bottom: 'linear-gradient(to bottom, transparent 40%, rgba(26,22,37,0.5) 70%, rgba(26,22,37,1) 100%)',
    top: 'linear-gradient(to top, transparent 40%, rgba(26,22,37,0.5) 70%, rgba(26,22,37,1) 100%)',
    both: 'linear-gradient(to bottom, rgba(26,22,37,0.8) 0%, transparent 30%, transparent 70%, rgba(26,22,37,1) 100%)',
    none: 'none',
  };

  const overlayStyles: Record<string, string> = {
    dark: 'bg-black/30',
    light: 'bg-white/20',
    none: '',
  };

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        className
      )}
      style={{ height: heightStyle }}
    >
      {/* Background image */}
      {!imageError && (
        <img
          src={image}
          alt={alt}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            animate && 'animate-ken-burns',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {/* Loading state / Fallback - Beautiful seasonal gradients */}
      {(!imageLoaded || imageError) && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {fallback || (
            <SeasonalGradient />
          )}
        </div>
      )}

      {/* Overlay for text readability */}
      {overlay !== 'none' && (
        <div className={cn('absolute inset-0', overlayStyles[overlay])} />
      )}

      {/* Gradient blend overlay - Light mode */}
      {blend !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none dark:hidden"
          style={{ background: blendGradients[blend] }}
        />
      )}

      {/* Gradient blend overlay - Dark mode */}
      {blend !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none hidden dark:block"
          style={{ background: darkBlendGradients[blend] }}
        />
      )}

      {/* Content */}
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 z-10">
          {children}
        </div>
      )}
    </div>
  );
}

export interface BannerTitleProps {
  children: ReactNode;
  className?: string;
  /** Show decorative lines around title */
  decorated?: boolean;
}

export function BannerTitle({ children, className, decorated = true }: BannerTitleProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {decorated && (
        <span className="w-12 h-px bg-gradient-to-r from-transparent to-pink-400/60 dark:to-pink-300/40" />
      )}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white drop-shadow-sm">
        {children}
      </h2>
      {decorated && (
        <span className="w-12 h-px bg-gradient-to-l from-transparent to-pink-400/60 dark:to-pink-300/40" />
      )}
    </div>
  );
}

export interface BannerSubtitleProps {
  children: ReactNode;
  className?: string;
}

export function BannerSubtitle({ children, className }: BannerSubtitleProps) {
  return (
    <p className={cn(
      'text-sm text-gray-600 dark:text-gray-300 mt-1',
      className
    )}>
      {children}
    </p>
  );
}
