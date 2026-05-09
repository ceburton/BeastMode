import { getAllContent } from '@/lib/source';
import GuideClient from './guide-client';

export const dynamic = 'force-dynamic';

export default function GuidePage() {
  const data = getAllContent();
  return <GuideClient units={data} />;
}
