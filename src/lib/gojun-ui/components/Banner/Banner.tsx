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

// Spring scene - Cherry blossom tree with pagoda
function SpringScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 120" className={className} preserveAspectRatio="xMidYMax meet">
      {/* Pagoda */}
      <g className="fill-rose-400/30 dark:fill-rose-300/20">
        <path d="M230 120 L230 80 L250 80 L250 120 Z" />
        <path d="M220 82 L260 82 L255 75 L240 70 L225 75 Z" />
        <path d="M225 72 L255 72 L250 65 L240 60 L230 65 Z" />
        <path d="M228 62 L252 62 L248 55 L240 50 L232 55 Z" />
        <path d="M238 52 L242 52 L240 42 Z" />
      </g>
      {/* Cherry tree trunk */}
      <path d="M80 120 L85 70 L90 120 Z" className="fill-amber-800/30 dark:fill-amber-600/20" />
      <path d="M85 75 L70 60 M85 80 L100 65" className="stroke-amber-800/30 dark:stroke-amber-600/20" strokeWidth="3" fill="none" />
      {/* Cherry blossoms */}
      <g className="fill-pink-300/50 dark:fill-pink-400/30">
        <circle cx="60" cy="50" r="15" />
        <circle cx="80" cy="40" r="18" />
        <circle cx="100" cy="50" r="14" />
        <circle cx="70" cy="65" r="12" />
        <circle cx="95" cy="62" r="13" />
        <circle cx="85" cy="55" r="10" />
      </g>
      {/* Ground */}
      <ellipse cx="150" cy="120" rx="140" ry="8" className="fill-green-300/20 dark:fill-green-500/10" />
    </svg>
  );
}

// Summer scene - Beach with ocean and sun
function SummerScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 120" className={className} preserveAspectRatio="xMidYMax meet">
      {/* Sun */}
      <circle cx="250" cy="25" r="20" className="fill-yellow-300/40 dark:fill-yellow-400/20" />
      {/* Sun rays */}
      <g className="stroke-yellow-300/30 dark:stroke-yellow-400/15" strokeWidth="2">
        <line x1="250" y1="0" x2="250" y2="5" />
        <line x1="275" y1="25" x2="280" y2="25" />
        <line x1="267" y1="8" x2="271" y2="4" />
        <line x1="267" y1="42" x2="271" y2="46" />
      </g>
      {/* Ocean waves */}
      <path d="M0 80 Q30 70 60 80 T120 80 T180 80 T240 80 T300 80 L300 120 L0 120 Z" className="fill-cyan-400/30 dark:fill-cyan-500/20" />
      <path d="M0 90 Q25 82 50 90 T100 90 T150 90 T200 90 T250 90 T300 90 L300 120 L0 120 Z" className="fill-blue-400/25 dark:fill-blue-500/15" />
      {/* Beach */}
      <path d="M0 100 Q150 95 300 100 L300 120 L0 120 Z" className="fill-amber-200/40 dark:fill-amber-300/20" />
      {/* Palm tree */}
      <path d="M40 120 L45 70 L50 120 Z" className="fill-amber-700/30 dark:fill-amber-600/20" />
      <g className="fill-green-500/35 dark:fill-green-400/20">
        <ellipse cx="30" cy="60" rx="20" ry="8" transform="rotate(-30 30 60)" />
        <ellipse cx="60" cy="60" rx="20" ry="8" transform="rotate(30 60 60)" />
        <ellipse cx="45" cy="55" rx="18" ry="7" transform="rotate(-10 45 55)" />
      </g>
    </svg>
  );
}

// Autumn scene - Temple with red maple trees
function AutumnScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 120" className={className} preserveAspectRatio="xMidYMax meet">
      {/* Mountains in background */}
      <path d="M0 90 L50 50 L100 90 Z" className="fill-orange-300/20 dark:fill-orange-400/10" />
      <path d="M80 90 L140 40 L200 90 Z" className="fill-red-300/20 dark:fill-red-400/10" />
      <path d="M180 90 L250 55 L300 90 Z" className="fill-amber-300/20 dark:fill-amber-400/10" />
      {/* Temple */}
      <g className="fill-slate-600/25 dark:fill-slate-400/15">
        <rect x="130" y="85" width="40" height="35" />
        <path d="M120 87 L170 87 L150 70 Z" />
        <rect x="145" y="95" width="10" height="25" className="fill-amber-900/30 dark:fill-amber-700/20" />
      </g>
      {/* Maple trees */}
      <g>
        <path d="M60 120 L65 80 L70 120 Z" className="fill-amber-800/30 dark:fill-amber-600/20" />
        <circle cx="65" cy="65" r="20" className="fill-red-500/40 dark:fill-red-400/25" />
        <circle cx="55" cy="75" r="12" className="fill-orange-500/35 dark:fill-orange-400/20" />
        <circle cx="75" cy="72" r="14" className="fill-red-600/35 dark:fill-red-500/20" />
      </g>
      <g>
        <path d="M240 120 L245 85 L250 120 Z" className="fill-amber-800/30 dark:fill-amber-600/20" />
        <circle cx="245" cy="70" r="18" className="fill-orange-500/40 dark:fill-orange-400/25" />
        <circle cx="235" cy="78" r="11" className="fill-red-500/35 dark:fill-red-400/20" />
        <circle cx="255" cy="75" r="13" className="fill-yellow-600/35 dark:fill-yellow-500/20" />
      </g>
      {/* Ground */}
      <ellipse cx="150" cy="120" rx="145" ry="10" className="fill-amber-200/25 dark:fill-amber-300/10" />
    </svg>
  );
}

// Winter scene - Snow village (Shirakawa-go style)
function WinterScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 120" className={className} preserveAspectRatio="xMidYMax meet">
      {/* Snowy mountains */}
      <path d="M0 80 L60 30 L120 80 Z" className="fill-slate-300/30 dark:fill-slate-400/15" />
      <path d="M60 35 L75 50 L70 48 L60 40 L50 48 L45 50 Z" className="fill-white/50 dark:fill-white/25" />
      <path d="M200 80 L270 25 L300 60 L300 80 Z" className="fill-slate-300/30 dark:fill-slate-400/15" />
      <path d="M270 30 L285 50 L280 47 L270 38 L260 47 L255 50 Z" className="fill-white/50 dark:fill-white/25" />
      {/* Traditional houses */}
      <g>
        {/* House 1 */}
        <rect x="70" y="90" width="35" height="30" className="fill-amber-100/40 dark:fill-amber-200/20" />
        <path d="M65 92 L87 60 L110 92 Z" className="fill-slate-500/30 dark:fill-slate-400/20" />
        <path d="M65 92 L87 60 L110 92 Z" className="fill-white/40 dark:fill-white/20" />
        <rect x="80" y="100" width="10" height="20" className="fill-amber-800/30 dark:fill-amber-600/20" />
      </g>
      <g>
        {/* House 2 */}
        <rect x="150" y="85" width="40" height="35" className="fill-amber-100/40 dark:fill-amber-200/20" />
        <path d="M145 87 L170 52 L195 87 Z" className="fill-slate-500/30 dark:fill-slate-400/20" />
        <path d="M145 87 L170 52 L195 87 Z" className="fill-white/40 dark:fill-white/20" />
        <rect x="163" y="97" width="12" height="23" className="fill-amber-800/30 dark:fill-amber-600/20" />
      </g>
      {/* Snow on ground */}
      <ellipse cx="150" cy="120" rx="150" ry="12" className="fill-white/40 dark:fill-white/20" />
      {/* Snow dots */}
      <g className="fill-white/60 dark:fill-white/30">
        <circle cx="30" cy="40" r="2" />
        <circle cx="100" cy="25" r="1.5" />
        <circle cx="180" cy="35" r="2" />
        <circle cx="250" cy="45" r="1.5" />
        <circle cx="50" cy="60" r="1" />
        <circle cx="220" cy="55" r="2" />
      </g>
    </svg>
  );
}

// Get seasonal scene component
function SeasonalScene({ season, className }: { season: 'spring' | 'summer' | 'autumn' | 'winter'; className?: string }) {
  switch (season) {
    case 'spring': return <SpringScene className={className} />;
    case 'summer': return <SummerScene className={className} />;
    case 'autumn': return <AutumnScene className={className} />;
    case 'winter': return <WinterScene className={className} />;
  }
}

// Seasonal effects overlay for real photos - just the falling elements
function SeasonalEffectsOverlay({ month }: { month: number }) {
  const season = useMemo(() => getSeasonFromMonth(month), [month]);

  const seasonElements: Record<string, string[]> = {
    spring: ['🌸', '🌷', '💮'],
    summer: ['☀️', '🌻', '✨'],
    autumn: ['🍁', '🍂', '🍃'],
    winter: ['❄️', '❅', '❆'],
  };

  const elements = seasonElements[season];

  // Generate falling elements
  const fallingElements = useMemo(() => {
    const items: { id: number; element: string; x: number; delay: number; duration: number; size: string }[] = [];
    for (let i = 0; i < 15; i++) {
      items.push({
        id: i,
        element: elements[i % elements.length],
        x: 3 + (i * 6.5),
        delay: Math.random() * 6,
        duration: 5 + Math.random() * 4,
        size: ['text-xs', 'text-sm', 'text-base', 'text-lg'][Math.floor(Math.random() * 4)],
      });
    }
    return items;
  }, [elements]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {fallingElements.map((item) => (
        <FallingElement
          key={item.id}
          delay={item.delay}
          duration={item.duration}
          startX={item.x}
        >
          <span className={`${item.size} opacity-70 drop-shadow-md`}>{item.element}</span>
        </FallingElement>
      ))}
    </div>
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
      {/* Seasonal scene in background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[140px]">
        <SeasonalScene season={season} className="w-full h-full" />
      </div>

      {/* Large kanji watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[100px] font-serif text-gray-800/15 dark:text-white/15 select-none">
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

      {/* Seasonal falling effects overlay (shows on real photos too) */}
      {imageLoaded && !imageError && month !== undefined && (
        <SeasonalEffectsOverlay month={month} />
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
