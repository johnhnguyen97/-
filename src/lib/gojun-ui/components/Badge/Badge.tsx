import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Outlined style */
  outlined?: boolean;
  /** Dot indicator */
  dot?: boolean;
  /** Pill shape (fully rounded) */
  pill?: boolean;
  /** Icon to show before text */
  icon?: React.ReactNode;
  /** Children */
  children?: React.ReactNode;
}

const variantStyles = {
  default: {
    solid: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    outlined: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
    dot: 'bg-gray-500',
  },
  primary: {
    solid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    outlined: 'border border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  secondary: {
    solid: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    outlined: 'border border-indigo-300 text-indigo-700 dark:border-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
  },
  success: {
    solid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    outlined: 'border border-green-300 text-green-700 dark:border-green-600 dark:text-green-400',
    dot: 'bg-green-500',
  },
  warning: {
    solid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    outlined: 'border border-yellow-300 text-yellow-700 dark:border-yellow-600 dark:text-yellow-400',
    dot: 'bg-yellow-500',
  },
  error: {
    solid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    outlined: 'border border-red-300 text-red-700 dark:border-red-600 dark:text-red-400',
    dot: 'bg-red-500',
  },
  info: {
    solid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    outlined: 'border border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
};

const sizeStyles = {
  sm: 'h-5 px-1.5 text-xs gap-1',
  md: 'h-6 px-2 text-xs gap-1.5',
  lg: 'h-7 px-2.5 text-sm gap-1.5',
};

const dotSizeStyles = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      outlined = false,
      dot = false,
      pill = true,
      icon,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const colorStyle = outlined ? variantStyles[variant].outlined : variantStyles[variant].solid;

    return (
      <span
        ref={ref}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-medium whitespace-nowrap',
          // Size
          sizeStyles[size],
          // Color
          colorStyle,
          // Shape
          pill ? 'rounded-full' : 'rounded-md',
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'rounded-full flex-shrink-0',
              dotSizeStyles[size],
              variantStyles[variant].dot
            )}
          />
        )}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// JLPT Level Badge (specialized)
export interface JLPTBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}

const jlptColors: Record<string, { solid: string; outlined: string }> = {
  N5: {
    solid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    outlined: 'border border-green-300 text-green-700 dark:border-green-600 dark:text-green-400',
  },
  N4: {
    solid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    outlined: 'border border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-400',
  },
  N3: {
    solid: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    outlined: 'border border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-400',
  },
  N2: {
    solid: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    outlined: 'border border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-400',
  },
  N1: {
    solid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    outlined: 'border border-red-300 text-red-700 dark:border-red-600 dark:text-red-400',
  },
};

export const JLPTBadge: React.FC<JLPTBadgeProps> = ({
  level,
  size = 'md',
  outlined = false,
  pill = true,
  className,
  ...props
}) => {
  const colorStyle = outlined ? jlptColors[level].outlined : jlptColors[level].solid;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-bold whitespace-nowrap',
        sizeStyles[size],
        colorStyle,
        pill ? 'rounded-full' : 'rounded-md',
        className
      )}
      {...props}
    >
      {level}
    </span>
  );
};

export default Badge;
