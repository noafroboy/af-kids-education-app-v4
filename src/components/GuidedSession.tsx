'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useDB } from '@/hooks/useDB';
import { useProgress } from '@/hooks/useProgress';
import { useAudio } from '@/hooks/useAudio';
import { getAllWords, getAllProgress, getSetting } from '@/lib/db';
import { shuffleArray } from '@/lib/utils';
import { GreetingStep } from '@/components/session/GreetingStep';
import { MoodCheck } from '@/components/MoodCheck';
import { ExploreCards } from '@/components/activities/ExploreCards';
import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay';
import type { MoodType, VocabularyWord } from '@/types';

const SLIDE_VARIANTS = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
};

export function GuidedSession() {
  const db = useDB();
  const router = useRouter();
  const { saveSession } = useProgress();
  const { playEffect } = useAudio();

  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<MoodType | null>(null);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [childName, setChildName] = useState('');
  const [noWords, setNoWords] = useState(false);
  const startedAt = useRef(new Date().toISOString());

  useEffect(() => {
    if (!db) return;
    getSetting(db as never, 'childName').then((s) => {
      if (s?.value) setChildName(String(s.value));
    }).catch(() => {});
  }, [db]);

  useEffect(() => {
    if (step === 0) {
      playEffect('whoosh');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWords() {
    if (!db) return;
    setLoadingWords(true);
    try {
      const [all, allProgress] = await Promise.all([
        getAllWords(db as never),
        getAllProgress(db as never),
      ]);
      const progressMap = new Map(allProgress.map((p) => [p.wordId, p]));
      const unmastered = all.filter((w) => {
        const p = progressMap.get(w.id);
        return !p || p.masteryLevel < 2;
      });
      const pool = unmastered.length >= 3 ? unmastered : all;
      if (pool.length === 0) {
        setNoWords(true);
        return;
      }
      setWords(shuffleArray(pool).slice(0, 3));
    } catch (err) {
      console.warn('[GuidedSession] fetchWords failed:', err);
      setNoWords(true);
    } finally {
      setLoadingWords(false);
    }
  }

  async function handleMoodSelected(m: MoodType) {
    setMood(m);
    await fetchWords();
    setStep(2);
  }

  async function handleExploreComplete() {
    const now = new Date().toISOString();
    await saveSession({
      startedAt: startedAt.current,
      completedAt: now,
      activityType: 'guidedSession',
      mood,
      wordIds: words.map((w) => w.id),
      correctCount: words.length,
      duration: Math.round((new Date(now).getTime() - new Date(startedAt.current).getTime()) / 1000),
    }).catch(() => {});
    setStep(3);
  }

  async function handlePlayMore() {
    startedAt.current = new Date().toISOString();
    await fetchWords();
    setStep(2);
  }

  if (noWords && step === 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
        <p className="text-xl text-slate-500 text-center">
          No words found / 没有找到词语
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-8 min-h-[88px] bg-[#FF6B35] text-white rounded-2xl font-bold text-lg"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Go Home / 回家
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {step === 0 && (
        <motion.div
          key="greeting"
          variants={SLIDE_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          <GreetingStep onProceed={() => setStep(1)} />
        </motion.div>
      )}

      {step === 1 && (
        <motion.div
          key="mood"
          variants={SLIDE_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center min-h-screen"
        >
          <MoodCheck onMoodSelected={handleMoodSelected} />
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          key="explore"
          variants={SLIDE_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {loadingWords ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-6xl animate-bounce">🐼</div>
            </div>
          ) : (
            <ExploreCards wordList={words} onComplete={handleExploreComplete} />
          )}
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          key="celebration"
          variants={SLIDE_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          <CelebrationOverlay
            childName={childName}
            wordCount={words.length}
            onPlayMore={handlePlayMore}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
