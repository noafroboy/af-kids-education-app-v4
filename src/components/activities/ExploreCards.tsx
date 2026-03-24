'use client';

import { useState, useEffect, useRef } from 'react';
import { useDB } from '@/hooks/useDB';
import { useProgress } from '@/hooks/useProgress';
import { useAudio } from '@/hooks/useAudio';
import { getAllWords, getSetting } from '@/lib/db';
import { audioManager } from '@/lib/audio';
import { shuffleArray } from '@/lib/utils';
import { VocabularyCard } from '@/components/ui/VocabularyCard';
import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { VocabularyWord } from '@/types';

interface ExploreCardsProps {
  wordList?: VocabularyWord[];
  onComplete?: () => void;
}

export function ExploreCards({ wordList, onComplete }: ExploreCardsProps) {
  const db = useDB();
  const { updateWord, saveSession } = useProgress();
  const { playWord } = useAudio();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [childName, setChildName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (wordList && wordList.length > 0) {
        if (!cancelled) {
          setWords(wordList);
          audioManager.preloadWords(wordList);
          setIsLoading(false);
        }
        if (db) {
          getSetting(db as never, 'childName').then((s) => {
            if (!cancelled && s?.value) setChildName(String(s.value));
          }).catch(() => {});
        }
        return;
      }
      if (!db) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      try {
        const [all, nameSetting] = await Promise.all([
          getAllWords(db as never),
          getSetting(db as never, 'childName'),
        ]);
        const shuffled = shuffleArray(all).slice(0, 6);
        if (!cancelled) {
          setWords(shuffled);
          if (nameSetting?.value) setChildName(String(nameSetting.value));
          audioManager.preloadWords(shuffled);
        }
      } catch (err) {
        console.warn('[ExploreCards] Failed to load:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [db, wordList]);

  const currentWord = words[currentIndex];

  function handleCardTap() {
    if (!currentWord) return;
    playWord(currentWord.audioEnPath, currentWord.audioZhPath);
  }

  async function handleNext() {
    if (!currentWord) return;
    await updateWord(currentWord.id, true);

    if (currentIndex >= words.length - 1) {
      if (onComplete) {
        onComplete();
        return;
      }
      const now = new Date().toISOString();
      await saveSession({
        startedAt: new Date(startTimeRef.current).toISOString(),
        completedAt: now,
        activityType: 'explore',
        mood: null,
        wordIds: words.map((w) => w.id),
        correctCount: words.length,
        duration: Math.round((Date.now() - startTimeRef.current) / 1000),
      });
      setComplete(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">
        <div className="text-6xl animate-float">🐼</div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-xl text-slate-500 text-center">No words found. / 没有找到词语。</p>
      </div>
    );
  }

  return (
    <div
      data-testid="explore-cards"
      className="min-h-screen bg-[#FFF9F0] flex flex-col items-center gap-6 p-4 max-w-[428px] mx-auto"
    >
      {complete && (
        <CelebrationOverlay
          childName={childName}
          wordCount={words.length}
          onPlayMore={() => {
            setCurrentIndex(0);
            setComplete(false);
            startTimeRef.current = Date.now();
          }}
        />
      )}

      <div className="w-full pt-4">
        <ProgressBar current={currentIndex + (complete ? 1 : 0)} total={words.length} />
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        {currentWord && (
          <VocabularyCard word={currentWord} onTap={handleCardTap} />
        )}
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 pb-2">
        {words.map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full transition-colors"
            style={{
              backgroundColor: i <= currentIndex ? '#FF6B35' : '#e2e8f0',
            }}
          />
        ))}
      </div>

      <button
        data-testid="card-next-btn"
        onClick={handleNext}
        className="w-full max-w-sm min-h-[88px] bg-[#FF6B35] text-white text-2xl font-bold rounded-3xl shadow-lg mb-4"
        style={{ fontFamily: 'var(--font-fredoka)' }}
      >
        {currentIndex >= words.length - 1 ? 'Done! / 完成! 🎉' : 'Next Word / 下一个 →'}
      </button>
    </div>
  );
}
