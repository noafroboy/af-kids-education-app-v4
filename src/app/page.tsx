'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDB } from '@/hooks/useDB';
import { getSetting } from '@/lib/db';
import { HomeScreen } from '@/components/HomeScreen';

type AppState = 'loading' | 'home' | 'onboarding';

export default function RootPage() {
  const db = useDB();
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>('loading');

  useEffect(() => {
    if (!db) return;
    (async () => {
      try {
        const setting = await getSetting(db as never, 'onboardingComplete');
        if (setting?.value === 'true') {
          setAppState('home');
        } else {
          setAppState('onboarding');
        }
      } catch {
        setAppState('onboarding');
      }
    })();
  }, [db]);

  useEffect(() => {
    if (appState === 'onboarding') {
      router.replace('/onboarding');
    }
  }, [appState, router]);

  if (appState === 'loading' || appState === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center gap-4">
        <span className="text-8xl" role="img" aria-label="Loading">🐼</span>
        <p className="text-xl text-slate-500" style={{ fontFamily: 'var(--font-nunito)' }}>
          Loading... / 加载中...
        </p>
      </div>
    );
  }

  return <HomeScreen />;
}
