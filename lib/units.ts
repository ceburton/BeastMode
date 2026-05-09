export interface UnitDef {
  id: number;
  name: string;
  slug: string;
  short: string;
  color: string;
}

export const UNITS: UnitDef[] = [
  { id: 1, name: 'Research Methods & Statistics', slug: 'research-methods', short: 'Research', color: 'sky' },
  { id: 2, name: 'Biological Bases of Behavior', slug: 'biological-bases', short: 'Biology', color: 'rose' },
  { id: 3, name: 'Sensation & Perception', slug: 'sensation-perception', short: 'Senses', color: 'amber' },
  { id: 4, name: 'Memory, Cognition & Language', slug: 'cognition', short: 'Cognition', color: 'violet' },
  { id: 5, name: 'Intelligence & Testing', slug: 'intelligence', short: 'Intelligence', color: 'emerald' },
  { id: 6, name: 'Development', slug: 'development', short: 'Development', color: 'orange' },
  { id: 7, name: 'Learning', slug: 'learning', short: 'Learning', color: 'blue' },
  { id: 8, name: 'Motivation, Emotion & Stress', slug: 'motivation-emotion', short: 'Mot/Emo', color: 'pink' },
  { id: 9, name: 'Social Psychology', slug: 'social', short: 'Social', color: 'teal' },
  { id: 10, name: 'Personality', slug: 'personality', short: 'Personality', color: 'cyan' },
  { id: 11, name: 'Abnormal Psychology', slug: 'abnormal', short: 'Disorders', color: 'red' },
  { id: 12, name: 'Treatment of Disorders', slug: 'treatment', short: 'Treatment', color: 'green' },
];

export function unitById(id: number): UnitDef | undefined {
  return UNITS.find((u) => u.id === id);
}

export function unitColorClasses(id: number) {
  const u = unitById(id);
  const color = u?.color ?? 'slate';
  return {
    bg: `bg-${color}-500/10`,
    text: `text-${color}-600 dark:text-${color}-400`,
    border: `border-${color}-500/20`,
    dot: `bg-${color}-500`,
  };
}
