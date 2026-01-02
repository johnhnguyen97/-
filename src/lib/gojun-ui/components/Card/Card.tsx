import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: 'default' | 'outlined' | 'elevated' | 'gradient';
  /** Gradient theme (only for variant="gradient") */
  gradient?: 'primary' | 'secondary' | 'sakura' | 'koi' | 'tsuki' | 'zen';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Border radius */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** Is the card interactive (clickable) */
  interactive?: boolean;
  /** Is the card selected */
  selected?: boolean;
  /** Children */
  children: React.ReactNode;
}

const variantStyles = {
  default: 'bg-white/80 backdrop-blur-sm border border-gray-200/50',
  outlined: 'bg-transparent border-2 border-gray-200',
  elevated: 'bg-white shadow-lg shadow-gray-200/50',
  gradient: '', // Set dynamically
};

const gradientStyles = {
  primary: 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50',
  secondary: 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/50',
  sakura: 'bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200/50',
  koi: 'bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200/50',
  tsuki: 'bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/50',
  zen: 'bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200/50',
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-6 sm:p-8',
};

const roundedStyles = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  '2xl': 'rounded-[2rem]',
  '3xl': 'rounded-[2.5rem]',
};

const darkVariantStyles = {
  default: 'dark:bg-gray-800/80 dark:border-gray-700/50',
  outlined: 'dark:border-gray-700',
  elevated: 'dark:bg-gray-800 dark:shadow-gray-900/50',
  gradient: '', // Set dynamically
};

const darkGradientStyles = {
  primary: 'dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800/50',
  secondary: 'dark:from-indigo-900/20 dark:to-purple-900/20 dark:border-indigo-800/50',
  sakura: 'dark:from-pink-900/20 dark:to-rose-900/20 dark:border-pink-800/50',
  koi: 'dark:from-amber-900/20 dark:to-orange-900/20 dark:border-orange-800/50',
  tsuki: 'dark:from-violet-900/20 dark:to-purple-900/20 dark:border-violet-800/50',
  zen: 'dark:from-slate-800/50 dark:to-gray-800/50 dark:border-slate-700/50',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      gradient = 'primary',
      padding = 'md',
      rounded = 'xl',
      interactive = false,
      selected = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = variant === 'gradient' ? gradientStyles[gradient] : variantStyles[variant];
    const darkStyles = variant === 'gradient' ? darkGradientStyles[gradient] : darkVariantStyles[variant];

    return (
      <div
        ref={ref}
        className={cn(
          // Base
          'relative overflow-hidden transition-all duration-200',
          baseStyles,
          darkStyles,
          paddingStyles[padding],
          roundedStyles[rounded],
          // Interactive
          interactive && [
            'cursor-pointer',
            'hover:scale-[1.02] hover:shadow-lg',
            'active:scale-[0.98]',
          ],
          // Selected
          selected && [
            'ring-2 ring-amber-500 ring-offset-2',
            'dark:ring-amber-400 dark:ring-offset-gray-900',
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ className, children, ...props }) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

// Card Title
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ className, children, ...props }) => (
  <h3
    className={cn(
      'text-lg font-semibold text-gray-900 dark:text-white',
      className
    )}
    {...props}
  >
    {children}
  </h3>
);

// Card Description
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ className, children, ...props }) => (
  <p
    className={cn(
      'text-sm text-gray-500 dark:text-gray-400 mt-1',
      className
    )}
    {...props}
  >
    {children}
  </p>
);

// Card Content
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ className, children, ...props }) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

// Card Footer
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ className, children, ...props }) => (
  <div
    className={cn(
      'mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center gap-3',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export default Card;
