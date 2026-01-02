/**
 * Shared TypeScript types for Gojun UI components
 */

export type Size = 'sm' | 'md' | 'lg';
export type Intent = 'primary' | 'secondary' | 'accent' | 'success' | 'error';

export interface BaseComponentProps {
  className?: string;
  disabled?: boolean;
}

export interface FormControlProps extends BaseComponentProps {
  size?: Size;
  intent?: Intent;
}

// Re-export for convenience
export type { Size as WashiSize, Intent as WashiIntent };
