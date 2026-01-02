/**
 * ChipGroupMulti Component
 * Multi-select chip group with controlled value array
 */

import { cn } from '../../utils/cn';
import { Chip } from './Chip';
import type { Size, Intent } from '../../types';
import type { ChipOption } from './ChipGroup';

export interface ChipGroupMultiProps<T extends string = string> {
  value: T[];
  onChange: (value: T[]) => void;
  options: ChipOption<T>[];
  min?: number;
  max?: number;
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

export function ChipGroupMulti<T extends string = string>({
  value,
  onChange,
  options,
  min = 0,
  max = Infinity,
  size = 'md',
  intent = 'primary',
  outlined = false,
  disabled = false,
  className,
  gap = 'md',
}: ChipGroupMultiProps<T>) {
  const handleToggle = (optionValue: T) => {
    const isSelected = value.includes(optionValue);

    if (isSelected) {
      // Check if we can deselect (min constraint)
      if (value.length > min) {
        onChange(value.filter((v) => v !== optionValue));
      }
    } else {
      // Check if we can select (max constraint)
      if (value.length < max) {
        onChange([...value, optionValue]);
      }
    }
  };

  return (
    <div
      role="group"
      aria-label="Multi-select options"
      className={cn('flex flex-wrap', gapClasses[gap], className)}
    >
      {options.map((option) => {
        const isSelected = value.includes(option.value);
        const canDeselect = value.length > min;
        const canSelect = value.length < max;
        const isDisabledByConstraint = isSelected ? !canDeselect : !canSelect;

        return (
          <Chip
            key={option.value}
            label={option.label}
            icon={option.icon}
            selected={isSelected}
            onClick={() => handleToggle(option.value)}
            size={size}
            intent={intent}
            outlined={outlined}
            disabled={disabled || option.disabled || isDisabledByConstraint}
          />
        );
      })}
    </div>
  );
}

export default ChipGroupMulti;
