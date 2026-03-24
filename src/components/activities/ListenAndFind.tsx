'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { useAudio } from '@/hooks/useAudio';
import { shuffleArray } from '@/lib/utils';
import { audioManager } from '@/lib/audio';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ChoiceCard } from './ChoiceCard';
import type { VocabularyWord } from '@/types';

type CardState = 'idle' | 'correct' | 'wrong' | 'reveal';

interface ListenAndFindProps {
  wordList: VocabularyWord[];
  age: number;
  onComplete: (stats: { wordsAttempted: number; correctFirst: number; duration: number }) => void;
}

function pickChoices(target: VocabularyWord, all: VocabularyWord[], count: number): VocabularyWord[] {
  const sameCategory = all.filter((w) => w.id !== target.id && w.category === target.category);
  const others = all.filter((w) => w.id !== target.id && w.category !== target.category);
  const pool = shuffleArray([...sameCategory, ...others]);
  const distractors = pool.slice(0, count - 1);
  return shuffleArray([target, ...distractors]);
}

export function ListenAndFind({ wordList, age, onComplete }: ListenAndFindProps) {
  const { updateWord, saveSession } = useProgress();
  const { playEffect } = useAudio();
  const choiceCount = age <= 3 ? 3 : 4;
  const startTimeRef = useRef(Date.now());

  const [index, setIndex] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [cardStates, setCardStates] = useState<Map<string, CardState>>(new Map());
  const [choices, setChoices] = useState<VocabularyWord[]>([]);
  const [correctFirst, setCorrectFirst] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealText, setRevealText] = useState<string | null>(null);

  const wrongAttemptsRef = useRef(wrongAttempts);
  wrongAttemptsRef.current = wrongAttempts;
  const correctFirstRef = useRef(correctFirst);
  correctFirstRef.current = correctFirst;
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const setupRound = useCallback(
    (wordIndex: number) => {
      const target = wordList[wordIndex];
      const newChoices = pickChoices(target, wordList, choiceCount);
      const states = new Map<string, CardState>();
      newChoices.forEach((w) => states.set(w.id, 'idle'));
      setChoices(newChoices);
      setCardStates(states);
      setWrongAttempts(0);
      setRevealText(null);
      audioManager.playWordEn(target.audioEnPath);
    },
    [wordList, choiceCount]
  );

  useEffect(() => {
    if (wordList.length > 0) setupRound(0);
  }, [wordList, setupRound]);

  useEffect(() => {
    return () => {
      const ids = timeoutsRef.current;
      ids.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  function advance(nextIndex: number) {
    if (nextIndex >= wordList.length) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      const cf = correctFirstRef.current;
      saveSession({
        startedAt: new Date(startTimeRef.current).toISOString(),
        completedAt: new Date().toISOString(),
        activityType: 'listenFind',
        mood: null,
        wordIds: wordList.map((w) => w.id),
        correctCount: cf,
        duration,
      }).catch(() => {});
      onComplete({ wordsAttempted: wordList.length, correctFirst: cf, duration });
    } else {
      setIndex(nextIndex);
      setIsAdvancing(false);
      setIsRevealing(false);
      setupRound(nextIndex);
    }
  }

  function handleTap(word: VocabularyWord) {
    if (isAdvancing || isRevealing) return;
    const target = wordList[index];
    if (word.id === target.id) {
      setCardStates((prev) => new Map(prev).set(word.id, 'correct'));
      if (wrongAttemptsRef.current === 0) setCorrectFirst((c) => c + 1);
      playEffect('correct');
      updateWord(word.id, true).catch(() => {});
      setIsAdvancing(true);
      const tid1 = setTimeout(() => advance(index + 1), 1200);
      timeoutsRef.current.push(tid1);
    } else {
      setCardStates((prev) => new Map(prev).set(word.id, 'wrong'));
      playEffect('incorrect');
      const next = wrongAttemptsRef.current + 1;
      setWrongAttempts(next);
      const tid2 = setTimeout(() => setCardStates((prev) => new Map(prev).set(word.id, 'idle')), 400);
      timeoutsRef.current.push(tid2);
      if (next >= 2) {
        setCardStates((prev) => new Map(prev).set(target.id, 'reveal'));
        setIsRevealing(true);
        setRevealText(`这是 ${target.mandarinWord}! / It's ${target.englishWord}!`);
        const tid3 = setTimeout(() => advance(index + 1), 2000);
        timeoutsRef.current.push(tid3);
      }
    }
  }

  if (wordList.length === 0) return null;

  const current = wordList[index];
  const progress = index + (isAdvancing || isRevealing ? 1 : 0);

  return (
    <div
      data-testid="listen-and-find"
      className="min-h-screen bg-[#FFF9F0] flex flex-col items-center gap-6 p-4 max-w-[428px] mx-auto"
    >
      <div className="w-full pt-4" data-testid="listen-find-progress">
        <ProgressBar current={progress} total={wordList.length} />
      </div>

      <div className="flex flex-col items-center gap-2 mt-2">
        <span className="text-4xl">👂</span>
        <p className="text-lg font-semibold text-slate-600" style={{ fontFamily: 'var(--font-fredoka)' }}>
          Find: {current?.englishWord}
        </p>
        <button
          onClick={() => { if (current?.audioEnPath) audioManager.playWordEn(current.audioEnPath); }}
          className="px-4 py-2 bg-[#4ECDC4] text-white rounded-xl text-sm font-bold"
        >
          Play Again / 再播放
        </button>
      </div>

      {revealText && (
        <div className="w-full text-center py-2 px-4 bg-yellow-100 rounded-2xl text-yellow-800 font-semibold text-lg">
          {revealText}
        </div>
      )}

      <div className={`grid gap-4 w-full ${choiceCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {choices.map((word) => (
          <ChoiceCard
            key={word.id}
            word={word}
            state={cardStates.get(word.id) ?? 'idle'}
            onTap={() => handleTap(word)}
          />
        ))}
      </div>
    </div>
  );
}
