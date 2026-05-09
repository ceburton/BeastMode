import { getAllContent } from '@/lib/source';
import RecallClient from './recall-client';

export const dynamic = 'force-dynamic';

export default function RecallPage() {
  const data = getAllContent();
  return <RecallClient units={data} />;
}
