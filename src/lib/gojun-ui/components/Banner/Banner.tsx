import { type ReactNode, useState, useMemo } from 'react';
import { cn } from '../../utils/cn';

// Get season based on month (0-indexed: 0=Jan, 11=Dec)
// Spring: March-May (2-4), Summer: June-August (5-7), Autumn: September-November (8-10), Winter: December-February (11, 0, 1)
function getSeasonFromMonth(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 2 && month <= 4) return 'spring';   // Mar, Apr, May
  if (month >= 5 && month <= 7) return 'summer';   // Jun, Jul, Aug
  if (month >= 8 && month <= 10) return 'autumn';  // Sep, Oct, Nov
  return 'winter';                                  // Dec, Jan, Feb
}

// Mt. Fuji SVG component
function MtFuji({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 80" className={className} preserveAspectRatio="xMidYMax meet">
      {/* Mountain body */}
      <path
        d="M100 5 L180 75 L20 75 Z"
        className="fill-slate-600/20 dark:fill-white/10"
      />
      {/* Snow cap */}
      <path
        d="M100 5 L120 25 L115 28 L105 20 L100 25 L95 20 L85 28 L80 25 Z"
        className="fill-white/60 dark:fill-white/30"
      />
    </svg>
  );
}

// Falling element component
function FallingElement({
  children,
  delay,
  duration,
  startX
}: {
  children: ReactNode;
  delay: number;
  duration: number;
  startX: number;
}) {
  return (
    <div
      className="absolute animate-fall pointer-events-none"
      style={{
        left: `${startX}%`,
        top: '-20px',
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </div>
  );
}

// Beautiful seasonal gradient fallback
function SeasonalGradient({ month }: { month?: number }) {
  const season = useMemo(() => getSeasonFromMonth(month ?? new Date().getMonth()), [month]);

  const seasonStyles = {
    spring: {
      gradient: 'bg-gradient-to-b from-pink-100 via-rose-50 to-pink-200',
      darkGradient: 'dark:from-pink-950 dark:via-rose-900/60 dark:to-pink-900/40',
      kanji: '春',
      elements: ['🌸', '🌷', '💮'],
    },
    summer: {
      gradient: 'bg-gradient-to-b from-sky-100 via-cyan-50 to-blue-200',
      darkGradient: 'dark:from-sky-950 dark:via-cyan-900/60 dark:to-blue-900/40',
      kanji: '夏',
      elements: ['☀️', '🌻', '🌊'],
    },
    autumn: {
      gradient: 'bg-gradient-to-b from-orange-100 via-amber-50 to-red-200',
      darkGradient: 'dark:from-orange-950 dark:via-amber-900/60 dark:to-red-900/40',
      kanji: '秋',
      elements: ['🍁', '🍂', '🍃'],
    },
    winter: {
      gradient: 'bg-gradient-to-b from-slate-100 via-blue-50 to-indigo-100',
      darkGradient: 'dark:from-slate-950 dark:via-blue-900/60 dark:to-indigo-900/40',
      kanji: '冬',
      elements: ['❄️', '🌨️', '❅'],
    },
  };

  const style = seasonStyles[season];

  // Generate falling elements with varied positions and timings
  const fallingElements = useMemo(() => {
    const elements: { id: number; element: string; x: number; delay: number; duration: number; size: string }[] = [];
    for (let i = 0; i < 12; i++) {
      elements.push({
        id: i,
        element: style.elements[i % style.elements.length],
        x: 5 + (i * 8) + Math.random() * 5,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 4,
        size: ['text-sm', 'text-base', 'text-lg', 'text-xl'][Math.floor(Math.random() * 4)],
      });
    }
    return elements;
  }, [style.elements]);

  return (
    <div className={cn('absolute inset-0', style.gradient, style.darkGradient)}>
      {/* Mt. Fuji in background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[120px]">
        <MtFuji className="w-full h-full" />
      </div>

      {/* Large kanji watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-serif text-gray-800/20 dark:text-white/20 select-none">
        {style.kanji}
      </div>

      {/* Falling seasonal elements */}
      <div className="absolute inset-0 overflow-hidden">
        {fallingElements.map((item) => (
          <FallingElement
            key={item.id}
            delay={item.delay}
            duration={item.duration}
            startX={item.x}
          >
            <span className={`${item.size} opacity-60`}>{item.element}</span>
          </FallingElement>
        ))}
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
  /** Month (0-indexed) for seasonal fallback gradient */
  month?: number;
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
  month,
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
            <SeasonalGradient month={month} />
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
