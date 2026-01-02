/**
 * ChipGroup Component
 * Single-select chip group with controlled value
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { Chip } from './Chip';
import type { Size, Intent } from '../../types';

export interface ChipOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface ChipGroupProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: ChipOption<T>[];
  size?: Size;
  intent?: Intent;
  outlined?: boolean;
  disabled?: boolean;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

const gapClasses = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
};

export function ChipGroup<T extends string = string>({
  value,
  onChange,
  options,
  size = 'md',
  intent = 'primary',
  outlined = false,
  disabled = false,
  className,
  gap = 'md',
}: ChipGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn('flex flex-wrap', gapClasses[gap], className)}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          icon={option.icon}
          selected={value === option.value}
          onClick={() => onChange(option.value)}
          size={size}
          intent={intent}
          outlined={outlined}
          disabled={disabled || option.disabled}
        />
      ))}
    </div>
  );
}

export default ChipGroup;
