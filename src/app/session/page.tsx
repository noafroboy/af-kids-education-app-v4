'use client';

import { ChildLayout } from '@/components/layouts/ChildLayout';
import { GuidedSession } from '@/components/GuidedSession';

export default function SessionPage() {
  return (
    <ChildLayout showHomeButton={true}>
      <GuidedSession />
    </ChildLayout>
  );
}
