/**
 * Gojun UI (和紙 Washi)
 * Japanese-inspired design system
 *
 * @example
 * import { Button, Toggle, Slider, Chip, Furigana } from '@/lib/gojun-ui';
 * import { cn } from '@/lib/gojun-ui/utils/cn';
 * import { gradients, colors } from '@/lib/gojun-ui/tokens';
 */

// Components
export * from './components';

// Types
export * from './types';

// Tokens
export {
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
  type ThemeName,
} from './tokens';

// Utilities
export { cn } from './utils/cn';
