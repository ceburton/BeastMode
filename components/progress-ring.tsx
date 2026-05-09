import * as React from 'react';
import { cn } from '@/lib/utils';

export function ProgressRing({
  value,
  max,
  size = 88,
  stroke = 8,
  className,
  label,
  sub,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  className?: string;
  label?: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className={cn('relative inline-flex flex-col items-center justify-center', className)}>
      <svg width={size} height={size} role="img" aria-label={`${Math.round(pct * 100)}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg font-semibold">{label ?? `${Math.round(pct * 100)}%`}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
