'use client';

import { Nav } from '@/components/nav';
import { useCommandPalette } from '@/components/command-palette';

export function NavWithSearch() {
  const palette = useCommandPalette();
  return <Nav onOpenSearch={() => palette.setOpen(true)} />;
}
