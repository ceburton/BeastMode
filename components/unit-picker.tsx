'use client';

import * as React from 'react';
import { UNITS } from '@/lib/units';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function UnitPicker({
  value,
  onChange,
  className,
}: {
  value: number[];
  onChange: (next: number[]) => void;
  className?: string;
}) {
  const allSelected = value.length === 0 || value.length === UNITS.length;

  function toggle(id: number) {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Units</p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onChange([])}>All</Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(UNITS.map((u) => u.id))}
            className={value.length === UNITS.length ? 'bg-secondary' : ''}
          >
            None
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {UNITS.map((u) => {
          const checked = value.length === 0 ? true : value.includes(u.id);
          return (
            <label
              key={u.id}
              className={cn(
                'flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors',
                'hover:bg-accent/50',
                checked ? 'border-primary/40 bg-primary/5' : 'border-border'
              )}
            >
              <Checkbox checked={checked} onCheckedChange={() => toggle(u.id)} aria-label={u.name} />
              <div className="flex-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-normal">U{u.id}</Badge>
                  <span className="font-medium">{u.name}</span>
                </div>
              </div>
            </label>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {allSelected ? 'All units included.' : `${value.length} of ${UNITS.length} units selected.`}
      </p>
    </div>
  );
}
