'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useDB } from '@/hooks/useDB';
import { getSetting, getAllSessions } from '@/lib/db';

const ACTIVITIES = [
  {
    id: 'explore-cards',
    emoji: '🃏',
    en: 'Explore Cards',
    zh: '探索卡片',
    href: '/activities/explore-cards',
    bg: '#FF6B35',
    testId: 'activity-explore-cards',
  },
  {
    id: 'listen-find',
    emoji: '👂',
    en: 'Listen & Find',
    zh: '听一听',
    href: '/activities/listen-find',
    bg: '#4ECDC4',
    testId: 'activity-listen-find',
  },
  {
    id: 'matching-pairs',
    emoji: '🃁',
    en: 'Matching Pairs',
    zh: '配对游戏',
    href: '/activities/matching-pairs',
    bg: '#C7B8EA',
    testId: 'activity-matching-pairs',
  },
  {
    id: 'song-time',
    emoji: '🎵',
    en: 'Song Time',
    zh: '歌曲时间',
    href: '/activities/song-time',
    bg: '#FF6B35',
    testId: 'activity-song-time',
  },
];

export function HomeScreen() {
  const db = useDB();
  const [childName, setChildName] = useState('');
  const [todayWords, setTodayWords] = useState(0);

  useEffect(() => {
    if (!db) return;
    (async () => {
      try {
        const nameSetting = await getSetting(db as never, 'childName');
        if (nameSetting?.value) setChildName(String(nameSetting.value));

        const sessions = await getAllSessions(db as never);
        const today = new Date().toDateString();
        const todayCount = sessions
          .filter((s) => new Date(s.completedAt).toDateString() === today)
          .reduce((acc, s) => acc + (s.wordIds?.length ?? 0), 0);
        setTodayWords(todayCount);
      } catch (err) {
        console.warn('[HomeScreen] Failed to load data:', err);
      }
    })();
  }, [db]);

  return (
    <div
      data-testid="home-screen"
      className="min-h-screen bg-[#FFF9F0] p-4 flex flex-col gap-4 max-w-[428px] mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <span
          className="text-2xl font-bold text-[#FF6B35]"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          LittleBridge 小桥
        </span>
        <Link
          href="/parent"
          data-testid="parent-icon"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow text-3xl"
          aria-label="Parent settings"
        >
          🐼
        </Link>
      </div>

      {/* Greeting */}
      <div className="text-center py-2">
        <h1
          className="text-3xl font-bold text-slate-700"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          {childName ? `你好, ${childName}! / Hello, ${childName}!` : '你好! / Hello!'}
        </h1>
        <p className="text-sm text-slate-400 mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
          今日: {todayWords}个词 / Today: {todayWords} words
        </p>
      </div>

      {/* Mascot */}
      <div className="flex justify-center py-2">
        <div className="text-6xl animate-float" role="img" aria-label="Panda mascot">🐼</div>
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-2 gap-3">
        {ACTIVITIES.map((act) => (
          <Link
            key={act.id}
            href={act.href}
            data-testid={act.testId}
            className="min-h-[120px] rounded-2xl flex flex-col items-center justify-center gap-1 p-4 shadow-md text-white"
            style={{ backgroundColor: act.bg }}
          >
            <span className="text-4xl">{act.emoji}</span>
            <span className="font-bold text-base" style={{ fontFamily: 'var(--font-fredoka)' }}>
              {act.en}
            </span>
            <span className="text-sm opacity-90">{act.zh}</span>
          </Link>
        ))}
      </div>

      {/* Start Session CTA */}
      <motion.div whileHover={{ scale: 1.02 }}>
        <Link
          href="/session"
          data-testid="start-session-btn"
          className="block w-full min-h-[64px] bg-[#FF6B35] text-white text-xl font-bold rounded-2xl shadow-lg text-center py-4"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Start Session / 开始学习 🚀
        </Link>
      </motion.div>
    </div>
  );
}
