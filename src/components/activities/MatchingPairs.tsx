'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { useAudio } from '@/hooks/useAudio';
import { shuffleArray } from '@/lib/utils';
import { FlipCard } from './FlipCard';
import type { PairCard } from './FlipCard';
import type { VocabularyWord } from '@/types';

interface MatchingPairsProps {
  wordList: VocabularyWord[];
  age: number;
  onComplete: (stats: { stars: number; matched: number }) => void;
}

function buildCards(words: VocabularyWord[]): PairCard[] {
  const pairs: PairCard[] = [];
  words.forEach((word) => {
    pairs.push({ id: `${word.id}-en`, wordId: word.id, type: 'en', word, isFlipped: false, isMatched: false });
    pairs.push({ id: `${word.id}-zh`, wordId: word.id, type: 'zh', word, isFlipped: false, isMatched: false });
  });
  return shuffleArray(pairs);
}

export function MatchingPairs({ wordList, age, onComplete }: MatchingPairsProps) {
  const boardSize = age <= 3 ? 3 : 4;
  const roundWords = wordList.slice(0, boardSize);

  const { updateWord, saveSession } = useProgress();
  const { playEffect } = useAudio();
  const startTimeRef = useRef(Date.now());

  const [cards, setCards] = useState<PairCard[]>(() => buildCards(roundWords));
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [wrongFlips, setWrongFlips] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const isFlipping = useRef(false);

  const wrongFlipsRef = useRef(wrongFlips);
  wrongFlipsRef.current = wrongFlips;
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const checkComplete = useCallback(
    (updatedCards: PairCard[]) => {
      if (updatedCards.every((c) => c.isMatched)) {
        const wf = wrongFlipsRef.current;
        const stars = wf <= boardSize ? 3 : wf <= boardSize * 2 ? 2 : 1;
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        saveSession({
          startedAt: new Date(startTimeRef.current).toISOString(),
          completedAt: new Date().toISOString(),
          activityType: 'matchingPairs',
          mood: null,
          wordIds: roundWords.map((w) => w.id),
          correctCount: roundWords.length,
          duration,
        }).catch(() => {});
        setIsDone(true);
        onComplete({ stars, matched: roundWords.length });
      }
    },
    [boardSize, roundWords, saveSession, onComplete]
  );

  function handleFlip(cardId: string) {
    if (isFlipping.current) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isMatched || card.isFlipped) return;
    if (flippedIds.length >= 2) return;

    const newFlipped = [...flippedIds, cardId];
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)));
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      isFlipping.current = true;
      const tid1 = setTimeout(() => {
        setCards((prev) => {
          const [aId, bId] = newFlipped;
          const a = prev.find((c) => c.id === aId)!;
          const b = prev.find((c) => c.id === bId)!;
          if (a.wordId === b.wordId) {
            playEffect('correct');
            updateWord(a.wordId, true).catch(() => {});
            const updated = prev.map((c) =>
              c.id === aId || c.id === bId ? { ...c, isMatched: true } : c
            );
            setFlippedIds([]);
            isFlipping.current = false;
            setTimeout(() => checkComplete(updated), 0);
            return updated;
          } else {
            playEffect('incorrect');
            setWrongFlips((w) => w + 1);
            const tid2 = setTimeout(() => {
              setCards((prev2) =>
                prev2.map((c) =>
                  c.id === aId || c.id === bId ? { ...c, isFlipped: false } : c
                )
              );
              setFlippedIds([]);
              isFlipping.current = false;
            }, 800);
            timeoutsRef.current.push(tid2);
            return prev;
          }
        });
      }, 400);
      timeoutsRef.current.push(tid1);
    }
  }

  useEffect(() => {
    return () => {
      const ids = timeoutsRef.current;
      ids.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  function handleNewGame() {
    startTimeRef.current = Date.now();
    setCards(buildCards(roundWords));
    setFlippedIds([]);
    setWrongFlips(0);
    setIsDone(false);
    isFlipping.current = false;
  }

  const cols = boardSize === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div
      data-testid="matching-pairs"
      className="min-h-screen bg-[#FFF9F0] flex flex-col items-center gap-6 p-4 max-w-[428px] mx-auto"
    >
      <div className="w-full pt-4 text-center">
        <h2
          className="text-2xl font-bold text-[#C7B8EA]"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Matching Pairs / 配对游戏
        </h2>
      </div>

      <div className={`grid ${cols} gap-3 w-full`}>
        {cards.map((card) => (
          <FlipCard key={card.id} card={card} onFlip={handleFlip} />
        ))}
      </div>

      {isDone && (
        <button
          data-testid="new-game-btn"
          onClick={handleNewGame}
          className="mt-4 w-full max-w-xs min-h-[72px] bg-[#FF6B35] text-white text-xl font-bold rounded-3xl shadow-lg"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          New Game / 新游戏
        </button>
      )}
    </div>
  );
}
