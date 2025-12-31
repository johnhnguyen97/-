import { useState, useRef, useEffect, useCallback } from 'react';

interface StrokeAnimationProps {
  videoUrl?: string; // Legacy prop, no longer used
  character: string;
  isDark: boolean;
}

// Color palette for strokes (like KanjiVG viewer)
const STROKE_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#be185d', // pink
  '#854d0e', // brown
  '#4f46e5', // indigo
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
];

// Preprocess SVG to add colors directly to paths
function preprocessSvg(svgString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return svgString;

  // Remove stroke numbers group
  const numbersGroup = svg.querySelector('.kgNumbers');
  if (numbersGroup) numbersGroup.remove();

  // Remove stroke="currentColor" from kgPaths group
  const kgPaths = svg.querySelector('.kgPaths');
  if (kgPaths) {
    kgPaths.removeAttribute('stroke');
  }

  // Get all paths and apply colors directly
  const paths = kgPaths ? kgPaths.querySelectorAll('path') : svg.querySelectorAll('path');
  paths.forEach((path, index) => {
    const color = STROKE_COLORS[index % STROKE_COLORS.length];
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
  });

  return new XMLSerializer().serializeToString(svg);
}

export function StrokeAnimation({ character, isDark }: StrokeAnimationProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<{ cancel: boolean; cleanup?: () => void }>({ cancel: true });

  const theme = {
    container: isDark
      ? 'bg-black/30 border-white/10'
      : 'bg-gray-100 border-stone-200',
    placeholder: isDark ? 'text-white/20' : 'text-gray-300',
    button: isDark
      ? 'bg-white/10 hover:bg-white/20 text-white'
      : 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm',
    buttonActive: isDark
      ? 'bg-amber-500/80 hover:bg-amber-500 text-white'
      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md',
  };

  // Fetch KanjiVG SVG
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setSvgContent(null);

    const kanjiCode = character.charCodeAt(0).toString(16).padStart(5, '0');
    const svgUrl = `https://kan-g.vnaka.dev/k/${kanjiCode}.svg`;

    fetch(svgUrl)
      .then(res => {
        if (res.ok) return res.text();
        throw new Error('SVG not found');
      })
      .then(svg => {
        const processedSvg = preprocessSvg(svg);
        setSvgContent(processedSvg);

        // Inject SVG directly into DOM after state update
        requestAnimationFrame(() => {
          if (svgContainerRef.current) {
            svgContainerRef.current.innerHTML = processedSvg;
          }
        });
      })
      .catch(() => {
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Cleanup animation on unmount or character change
    return () => {
      animationRef.current.cancel = true;
      if (animationRef.current.cleanup) {
        animationRef.current.cleanup();
      }
    };
  }, [character]);

  // Play stroke animation
  const playAnimation = useCallback(() => {
    if (!svgContainerRef.current) return;
    if (animationRef.current.cancel === false) return; // Already animating

    const svg = svgContainerRef.current.querySelector('svg');
    if (!svg) return;

    const kgPaths = svg.querySelector('.kgPaths');
    const paths = Array.from(
      kgPaths ? kgPaths.querySelectorAll('path') : svg.querySelectorAll('path')
    ) as SVGPathElement[];

    if (paths.length === 0) return;

    // Mark as animating
    animationRef.current.cancel = false;
    setIsAnimating(true);

    // Store original colors and set paths to gray (background)
    const originalColors = paths.map(p => p.getAttribute('stroke') || '#000');
    paths.forEach(path => {
      path.setAttribute('stroke', '#e0e0e0');
    });

    // Create overlay group for colored animated strokes
    const animGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    animGroup.setAttribute('class', 'animation-overlay');
    (kgPaths || svg).appendChild(animGroup);

    // Prepare animated paths - all start hidden
    const animData = paths.map((path, index) => {
      const clone = path.cloneNode(true) as SVGPathElement;
      const length = path.getTotalLength();

      clone.setAttribute('stroke', originalColors[index]);
      clone.setAttribute('stroke-width', '4');
      clone.setAttribute('fill', 'none');
      clone.setAttribute('stroke-linecap', 'round');
      clone.setAttribute('stroke-linejoin', 'round');
      clone.style.strokeDasharray = String(length);
      clone.style.strokeDashoffset = String(length); // Fully hidden

      animGroup.appendChild(clone);

      return { element: clone, length };
    });

    // Animation state
    const strokeDuration = 400; // ms per stroke
    const pauseBetween = 80; // ms pause between strokes
    let currentStroke = 0;
    let strokeProgress = 0;
    let lastTimestamp: number | null = null;
    let isPausing = false;
    let pauseEndTime = 0;
    let animationId: number | null = null;

    function animate(timestamp: number) {
      if (animationRef.current.cancel) {
        return; // Stop if cancelled
      }

      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // Handle pause between strokes
      if (isPausing) {
        if (timestamp >= pauseEndTime) {
          isPausing = false;
          currentStroke++;
          strokeProgress = 0;
        } else {
          animationId = requestAnimationFrame(animate);
          return;
        }
      }

      // Check if animation complete
      if (currentStroke >= animData.length) {
        // Clean up - remove overlay, restore colors
        if (animGroup.parentNode) {
          animGroup.remove();
        }
        paths.forEach((path, index) => {
          path.setAttribute('stroke', originalColors[index]);
        });
        animationRef.current.cancel = true;
        setIsAnimating(false);
        return;
      }

      // Animate current stroke
      const { element, length } = animData[currentStroke];
      strokeProgress += deltaTime / strokeDuration;

      if (strokeProgress >= 1) {
        // Stroke complete
        element.style.strokeDashoffset = '0';
        isPausing = true;
        pauseEndTime = timestamp + pauseBetween;
      } else {
        // Draw stroke progressively
        const offset = length * (1 - strokeProgress);
        element.style.strokeDashoffset = String(offset);
      }

      animationId = requestAnimationFrame(animate);
    }

    // Start animation
    animationId = requestAnimationFrame(animate);

    // Store cleanup function
    animationRef.current.cleanup = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (animGroup.parentNode) {
        animGroup.remove();
      }
      paths.forEach((path, index) => {
        path.setAttribute('stroke', originalColors[index]);
      });
    };
  }, []);

  // Stop animation and restore state
  const resetAnimation = useCallback(() => {
    animationRef.current.cancel = true;
    if (animationRef.current.cleanup) {
      animationRef.current.cleanup();
      animationRef.current.cleanup = undefined;
    }
    setIsAnimating(false);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={`relative aspect-square rounded-xl border-2 border-dashed flex items-center justify-center ${theme.container}`}>
        <div className="text-center">
          <div className={`text-6xl font-serif mb-2 animate-pulse ${theme.placeholder}`}>
            {character}
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Loading stroke order...
          </p>
        </div>
      </div>
    );
  }

  // Error state - SVG not available
  if (hasError || !svgContent) {
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
      {/* SVG container */}
      <div className="aspect-square relative p-4">
        <div
          ref={svgContainerRef}
          className="w-full h-full flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-[180px] [&_svg]:max-h-[180px]"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 p-3 border-t border-inherit">
        <button
          onClick={isAnimating ? resetAnimation : playAnimation}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            isAnimating ? theme.button : theme.buttonActive
          }`}
          title={isAnimating ? 'Stop' : 'Play stroke order'}
        >
          {isAnimating ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              <span className="text-sm font-medium">Stop</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-sm font-medium">Play</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
