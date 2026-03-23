'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDB } from '@/hooks/useDB';
import { getAllWords, getSetting } from '@/lib/db';
import { shuffleArray } from '@/lib/utils';
import { ChildLayout } from '@/components/layouts/ChildLayout';
import { MatchingPairs } from '@/components/activities/MatchingPairs';
import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay';
import { useRouter } from 'next/navigation';
import type { VocabularyWord } from '@/types';

export default function MatchingPairsPage() {
  const db = useDB();
  const router = useRouter();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [age, setAge] = useState(4);
  const [childName, setChildName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [complete, setComplete] = useState(false);
  const [stars, setStars] = useState(3);
  const [matched, setMatched] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  const loadWords = useCallback(async () => {
    if (!db) return;
    setIsLoading(true);
    setError(false);
    try {
      const [all, ageSetting, nameSetting] = await Promise.all([
        getAllWords(db as never),
        getSetting(db as never, 'childAge'),
        getSetting(db as never, 'childName'),
      ]);
      const boardSize = ageSetting?.value ? (Number(ageSetting.value) <= 3 ? 3 : 4) : 4;
      const picked = shuffleArray(all).slice(0, Math.min(boardSize, all.length));
      setWords(picked);
      if (ageSetting?.value) setAge(Number(ageSetting.value));
      if (nameSetting?.value) setChildName(String(nameSetting.value));
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  function handleComplete(stats: { stars: number; matched: number }) {
    setStars(stats.stars);
    setMatched(stats.matched);
    setComplete(true);
  }

  function handlePlayAgain() {
    setComplete(false);
    setGameKey((k) => k + 1);
    loadWords();
  }

  if (isLoading) {
    return (
      <ChildLayout>
        <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">
          <div className="text-6xl animate-float">🐼</div>
        </div>
      </ChildLayout>
    );
  }

  if (error) {
    return (
      <ChildLayout>
        <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-xl text-slate-500 text-center">
            Could not load words. / 无法加载词语。
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-[#FF6B35] text-white rounded-2xl font-bold text-lg"
          >
            Go Home / 回家
          </button>
        </div>
      </ChildLayout>
    );
  }

  if (words.length === 0) {
    return (
      <ChildLayout>
        <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-xl text-slate-500 text-center">No words found. / 没有找到词语。</p>
        </div>
      </ChildLayout>
    );
  }

  return (
    <ChildLayout>
      {complete && (
        <CelebrationOverlay
          childName={childName}
          wordCount={matched}
          stars={stars}
          onPlayMore={handlePlayAgain}
        />
      )}
      <MatchingPairs
        key={gameKey}
        wordList={words}
        age={age}
        onComplete={handleComplete}
      />
    </ChildLayout>
  );
}
