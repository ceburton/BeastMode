import { Suspense } from 'react';
import QuizClient from './quiz-client';

export const dynamic = 'force-dynamic';

export default function QuizPage() {
  return (
    <Suspense fallback={null}>
      <QuizClient />
    </Suspense>
  );
}
