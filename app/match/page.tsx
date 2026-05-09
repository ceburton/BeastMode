import { getAllContent } from '@/lib/source';
import MatchClient from './match-client';

export const dynamic = 'force-dynamic';

export default function MatchPage() {
  const data = getAllContent();
  // Flatten to one term-array-per-unit for client picker
  const unitsForClient = data.map((u) => ({
    id: u.id,
    name: u.name,
    terms: u.topics.flatMap((t) =>
      t.terms.map((tm) => ({ id: tm.id, term: tm.term, definition: tm.definition }))
    ),
  }));
  return <MatchClient units={unitsForClient} />;
}
