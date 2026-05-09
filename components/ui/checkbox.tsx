'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

export function Checkbox({ checked, onCheckedChange, disabled, id, className, ...rest }: CheckboxProps) {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      aria-label={rest['aria-label']}
      className={cn(
        'peer h-5 w-5 shrink-0 rounded-md border border-input bg-background flex items-center justify-center ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked && 'bg-primary border-primary text-primary-foreground',
        className
      )}
    >
      {checked && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}
