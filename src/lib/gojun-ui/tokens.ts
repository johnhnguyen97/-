/**
 * Gojun UI Design Tokens
 *
 * Japanese-inspired design system with themed color palettes:
 * - Sakura (桜) - Cherry blossoms, warm pinks
 * - Sumi-e (墨絵) - Ink wash, elegant grays
 * - Koi (鯉) - Koi fish, bold oranges & blues
 * - Tsuki (月) - Moon, deep purples & silvers
 * - Zen (禅) - Minimalist, slate & stone
 */

// ============================================================================
// JAPANESE COLOR PALETTES
// ============================================================================

export const palette = {
  // Traditional Japanese colors
  sakura: '#FFB7C5',      // Cherry blossom pink
  sakuraDeep: '#C41E3A',  // Deep sakura
  sakuraLight: '#FFF0F3', // Light sakura

  indigo: '#4B0082',      // Japanese indigo (藍)
  gold: '#D4AF37',        // Gold accent (金)
  cream: '#FFF8F0',       // Cream background
  charcoal: '#2D2D2D',    // Charcoal (墨)

  ink: '#1a1a2e',         // Sumi ink
  paper: '#FAF9F6',       // Washi paper
  bamboo: '#7CB342',      // Bamboo green
  vermillion: '#E34234',  // Vermillion red (朱)

  // Koi colors
  koiOrange: '#F97316',
  koiGold: '#FBBF24',
  water: '#0EA5E9',

  // Moon/night colors
  moonSilver: '#C4B5FD',
  twilight: '#8B5CF6',
  midnight: '#1E1B4B',
} as const;

// ============================================================================
// THEME COLORS
// ============================================================================

export const colors = {
  // Primary - Amber/Orange (Koi inspired)
  primary: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Secondary - Indigo/Purple (Tsuki inspired)
  secondary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Accent - Sakura pink
  accent: {
    50: '#FFF0F3',
    100: '#FFE4E8',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },

  // Success - Bamboo green
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Error - Vermillion red
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Neutral - Sumi ink scale
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },
} as const;

// ============================================================================
// PAGE THEMES
// ============================================================================

export type ThemeName = 'sakura' | 'sumie' | 'koi' | 'tsuki' | 'zen';

export const themes: Record<ThemeName, {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
}> = {
  sakura: {
    primary: '#FFB7C5',
    secondary: '#C41E3A',
    accent: '#FF6B8A',
    background: 'linear-gradient(135deg, #FFF0F3 0%, #FFE4E8 50%, #FFF8F0 100%)',
    card: 'rgba(255, 255, 255, 0.85)',
    text: '#1F2937',
    textMuted: '#6B7280',
  },
  sumie: {
    primary: '#374151',
    secondary: '#1F2937',
    accent: '#10B981',
    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
    card: 'rgba(255, 255, 255, 0.9)',
    text: '#111827',
    textMuted: '#6B7280',
  },
  koi: {
    primary: '#F97316',
    secondary: '#EA580C',
    accent: '#0EA5E9',
    background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FEF3C7 100%)',
    card: 'rgba(255, 255, 255, 0.88)',
    text: '#1F2937',
    textMuted: '#6B7280',
  },
  tsuki: {
    primary: '#8B5CF6',
    secondary: '#6D28D9',
    accent: '#C4B5FD',
    background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 50%, #EDE9FE 100%)',
    card: 'rgba(255, 255, 255, 0.85)',
    text: '#1F2937',
    textMuted: '#6B7280',
  },
  zen: {
    primary: '#64748B',
    secondary: '#475569',
    accent: '#94A3B8',
    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
    card: 'rgba(255, 255, 255, 0.92)',
    text: '#1F2937',
    textMuted: '#6B7280',
  },
};

// ============================================================================
// GRADIENTS
// ============================================================================

export const gradients = {
  // Primary gradients
  primary: 'bg-gradient-to-r from-amber-500 to-orange-500',
  primaryHover: 'bg-gradient-to-r from-amber-600 to-orange-600',

  secondary: 'bg-gradient-to-r from-indigo-500 to-purple-600',
  secondaryHover: 'bg-gradient-to-r from-indigo-600 to-purple-700',

  accent: 'bg-gradient-to-r from-pink-400 to-rose-500',

  success: 'bg-gradient-to-r from-emerald-500 to-green-600',
  error: 'bg-gradient-to-r from-red-500 to-rose-600',

  // Page theme gradients
  sakura: 'bg-gradient-to-r from-pink-300 to-rose-400',
  koi: 'bg-gradient-to-r from-amber-500 to-orange-500',
  tsuki: 'bg-gradient-to-r from-violet-500 to-purple-600',
  sumie: 'bg-gradient-to-r from-gray-600 to-gray-800',
  zen: 'bg-gradient-to-r from-slate-500 to-slate-700',
} as const;

// ============================================================================
// SPACING & SIZING
// ============================================================================

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
} as const;

export const radius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',

  // Colored glows
  glow: {
    primary: 'shadow-lg shadow-amber-500/25',
    secondary: 'shadow-lg shadow-indigo-500/25',
    success: 'shadow-lg shadow-emerald-500/25',
    error: 'shadow-lg shadow-red-500/25',
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    japanese: ['Noto Sans JP', 'Hiragino Sans', 'sans-serif'],
    serif: ['Noto Serif JP', 'Georgia', 'serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },

  fontSize: {
    xs: 'text-xs',     // 12px
    sm: 'text-sm',     // 14px
    base: 'text-base', // 16px
    lg: 'text-lg',     // 18px
    xl: 'text-xl',     // 20px
    '2xl': 'text-2xl', // 24px
    '3xl': 'text-3xl', // 30px
    '4xl': 'text-4xl', // 36px
  },

  fontWeight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
} as const;

// ============================================================================
// TRANSITIONS & ANIMATIONS
// ============================================================================

export const transitions = {
  fast: 'transition-all duration-150 ease-out',
  normal: 'transition-all duration-200 ease-out',
  slow: 'transition-all duration-300 ease-out',
  spring: 'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
} as const;

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

export const components = {
  // Touch-friendly minimum
  touchTarget: '44px',

  // Button sizes
  button: {
    sm: { height: '32px', padding: '0 12px', fontSize: 'text-sm' },
    md: { height: '40px', padding: '0 16px', fontSize: 'text-base' },
    lg: { height: '48px', padding: '0 24px', fontSize: 'text-lg' },
    xl: { height: '56px', padding: '0 32px', fontSize: 'text-xl' },
  },

  // Input sizes
  input: {
    sm: { height: '32px', padding: '0 10px', fontSize: 'text-sm' },
    md: { height: '40px', padding: '0 14px', fontSize: 'text-base' },
    lg: { height: '48px', padding: '0 18px', fontSize: 'text-lg' },
  },

  // Checkbox/Radio sizes
  control: {
    sm: { size: '16px', icon: '10px' },
    md: { size: '20px', icon: '12px' },
    lg: { size: '24px', icon: '14px' },
  },

  // Chip sizes
  chip: {
    sm: { height: '24px', padding: '0 8px', fontSize: 'text-xs' },
    md: { height: '32px', padding: '0 12px', fontSize: 'text-sm' },
    lg: { height: '40px', padding: '0 16px', fontSize: 'text-base' },
  },
} as const;

// ============================================================================
// CALENDAR TOKENS (Kawaii Japanese Style)
// ============================================================================

export const calendar = {
  // Light mode - Kawaii pastel palette
  light: {
    // Backgrounds
    bg: '#FFF8F5',              // Warm cream
    cardBg: '#FFFFFF',          // Pure white cards
    headerBg: '#FFB8C6',        // Soft pink header

    // Day colors
    dayText: '#374151',         // Dark gray for readability
    dayTextMuted: '#9CA3AF',    // Muted for other months
    sunday: '#FF4D6D',          // Red for Sunday (Japanese tradition)
    saturday: '#4A90D9',        // Blue for Saturday
    today: '#FF6B95',           // Rose pink highlight
    todayBg: '#FFF0F5',         // Light pink background

    // Event colors (soft pastels)
    eventWord: '#C9B1FF',       // Lavender for Word of the Day
    eventKanji: '#FFD6E0',      // Pink for Kanji of the Day
    eventHoliday: '#FFE4B5',    // Peach for holidays

    // Borders & dividers
    border: '#FFE4E8',          // Soft pink border
    divider: '#F3E8FF',         // Lavender divider

    // Interactive states
    hover: '#FFF0F5',           // Light pink hover
    active: '#FFE4E8',          // Pressed state
  },

  // Dark mode - Elegant night palette
  dark: {
    // Backgrounds
    bg: '#1A1625',              // Deep purple-black
    cardBg: '#252033',          // Elevated card
    headerBg: '#3D2E5A',        // Muted purple header

    // Day colors
    dayText: '#E5E7EB',         // Light gray
    dayTextMuted: '#6B7280',    // Muted for other months
    sunday: '#FF6B8A',          // Softer red
    saturday: '#60A5FA',        // Light blue
    today: '#F472B6',           // Pink highlight
    todayBg: '#3D2E5A',         // Purple background

    // Event colors (deeper tones)
    eventWord: '#7C3AED',       // Purple for Word of the Day
    eventKanji: '#DB2777',      // Pink for Kanji of the Day
    eventHoliday: '#D97706',    // Amber for holidays

    // Borders & dividers
    border: '#374151',          // Gray border
    divider: '#4B5563',         // Gray divider

    // Interactive states
    hover: '#2D2640',           // Subtle hover
    active: '#3D2E5A',          // Pressed state
  },

  // Kawaii variant (extra cute for mobile)
  kawaii: {
    // Extra playful colors
    accent: '#FF6B95',          // Hot pink
    sparkle: '#FFD700',         // Gold sparkles
    heart: '#FF69B4',           // Heart pink
    star: '#FFE135',            // Star yellow

    // Rounded everything
    borderRadius: '1rem',
    borderRadiusLg: '1.5rem',

    // Playful shadows
    shadow: '0 4px 20px rgba(255, 107, 149, 0.15)',
    shadowHover: '0 8px 30px rgba(255, 107, 149, 0.25)',
  },

  // Seasonal banner images (Unsplash - free to use)
  seasons: {
    spring: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1200&q=80',  // Cherry blossoms Japan
    summer: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=80',    // Mt. Fuji with lake
    autumn: 'https://images.unsplash.com/photo-1576675466969-38eeae4b41f6?w=1200&q=80',  // Red maple temple Japan
    winter: 'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1200&q=80',  // Snow village Shirakawa-go
  },

  // Japanese day names
  dayNames: {
    full: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    short: ['日', '月', '火', '水', '木', '金', '土'],
    english: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },

  // Month names in Japanese
  monthNames: {
    full: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    traditional: ['睦月', '如月', '弥生', '卯月', '皐月', '水無月', '文月', '葉月', '長月', '神無月', '霜月', '師走'],
    english: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
} as const;

// ============================================================================
// REIWA ERA HELPERS
// ============================================================================

/**
 * Get Reiwa year from a date
 * Reiwa era started May 1, 2019 (Reiwa 1)
 */
export function getReiwaYear(date: Date): number {
  const year = date.getFullYear();
  return year - 2018; // 2019 = Reiwa 1, 2026 = Reiwa 8
}

/**
 * Format a date with both Western and Japanese era display
 */
export function formatJapaneseDate(year: number, month: number): {
  western: string;
  reiwa: string;
  reiwaFull: string;
  full: string;
  japanese: string;
} {
  const reiwaYear = year - 2018;
  const monthName = calendar.monthNames.english[month - 1];
  const monthJp = calendar.monthNames.full[month - 1];
  const traditionalMonth = calendar.monthNames.traditional[month - 1];

  return {
    western: `${monthName.toUpperCase()} ${year}`,
    reiwa: `令和${reiwaYear}年`,
    reiwaFull: `令和${reiwaYear}年${monthJp}`,
    full: `${monthName.toUpperCase()} ${year} (令和${reiwaYear}年)`,
    japanese: `${year}年${monthJp} (${traditionalMonth})`,
  };
}

// ============================================================================
// DARK MODE
// ============================================================================

export const darkMode = {
  bg: {
    primary: colors.neutral[900],
    secondary: colors.neutral[800],
    elevated: colors.neutral[800],
  },
  text: {
    primary: colors.neutral[50],
    secondary: colors.neutral[400],
    muted: colors.neutral[500],
  },
  border: {
    default: colors.neutral[700],
    hover: colors.neutral[600],
  },
} as const;

export default {
  palette,
  colors,
  themes,
  gradients,
  spacing,
  radius,
  shadows,
  typography,
  transitions,
  components,
  darkMode,
  calendar,
};
