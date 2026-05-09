import * as React from 'react';
import { cn } from '@/lib/utils';

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
}: {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
    >
      <div
        className={cn('h-full transition-all duration-500 ease-out bg-primary', indicatorClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
