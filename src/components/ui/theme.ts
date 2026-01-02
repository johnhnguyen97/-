/**
 * Gojun Design System - Theme Tokens
 *
 * A clean, consistent design language for the Gojun app.
 * These tokens can be extracted into a standalone CSS/component library.
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary - Indigo/Purple gradient
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Main
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // Secondary - Amber/Orange gradient
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Success - Green/Emerald
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Error - Red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Neutral - Gray scale
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
} as const;

// ============================================================================
// GRADIENTS
// ============================================================================

export const gradients = {
  primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  secondary: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',

  // Tailwind class versions
  tw: {
    primary: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    secondary: 'bg-gradient-to-br from-amber-500 to-orange-500',
    success: 'bg-gradient-to-br from-emerald-500 to-green-600',
    error: 'bg-gradient-to-br from-red-500 to-rose-600',
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const radius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  glow: {
    primary: '0 0 20px rgba(99, 102, 241, 0.4)',
    secondary: '0 0 20px rgba(245, 158, 11, 0.4)',
    success: '0 0 20px rgba(16, 185, 129, 0.4)',
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace',
    japanese: '"Noto Sans JP", "Hiragino Sans", sans-serif',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ============================================================================
// COMPONENT SIZES
// ============================================================================

export const componentSizes = {
  // Touch-friendly minimum sizes
  touchTarget: '44px',

  // Button heights
  button: {
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '56px',
  },

  // Input heights
  input: {
    sm: '32px',
    md: '40px',
    lg: '48px',
  },

  // Icon sizes
  icon: {
    xs: '12px',
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
  },
} as const;

// ============================================================================
// THEME VARIANTS (Light/Dark)
// ============================================================================

export type ThemeMode = 'light' | 'dark';

export const getThemeColors = (mode: ThemeMode) => ({
  // Backgrounds
  bg: {
    primary: mode === 'dark' ? colors.neutral[900] : colors.neutral[0],
    secondary: mode === 'dark' ? colors.neutral[800] : colors.neutral[50],
    tertiary: mode === 'dark' ? colors.neutral[700] : colors.neutral[100],
    elevated: mode === 'dark' ? colors.neutral[800] : colors.neutral[0],
  },

  // Text
  text: {
    primary: mode === 'dark' ? colors.neutral[50] : colors.neutral[900],
    secondary: mode === 'dark' ? colors.neutral[400] : colors.neutral[600],
    muted: mode === 'dark' ? colors.neutral[500] : colors.neutral[400],
    inverse: mode === 'dark' ? colors.neutral[900] : colors.neutral[0],
  },

  // Borders
  border: {
    default: mode === 'dark' ? colors.neutral[700] : colors.neutral[200],
    hover: mode === 'dark' ? colors.neutral[600] : colors.neutral[300],
    focus: colors.primary[500],
  },

  // Interactive states
  interactive: {
    hover: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    active: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
});

// ============================================================================
// TAILWIND CLASS HELPERS
// ============================================================================

export const tw = {
  // Focus ring
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
  focusRingDark: 'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900',

  // Transitions
  transition: 'transition-all duration-200 ease-out',
  transitionFast: 'transition-all duration-150 ease-out',

  // Interactive
  interactive: 'cursor-pointer select-none',
  disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
};

export default {
  colors,
  gradients,
  spacing,
  radius,
  shadows,
  typography,
  transitions,
  componentSizes,
  getThemeColors,
  tw,
};
