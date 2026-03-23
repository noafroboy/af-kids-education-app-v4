'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { VocabularyWord } from '@/types';

type CardState = 'idle' | 'correct' | 'wrong' | 'reveal';

interface ChoiceCardProps {
  word: VocabularyWord;
  state: CardState;
  onTap: () => void;
}

const correctVariants = {
  initial: { scale: 1 },
  correct: { scale: [1, 1.12, 1.05, 1.1, 1], transition: { type: 'spring', stiffness: 300, damping: 12 } },
};

const wrongVariants = {
  initial: { x: 0 },
  wrong: {
    x: [0, -8, 8, -8, 8, 0],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

const revealVariants = {
  initial: { scale: 1 },
  reveal: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 1, ease: 'easeInOut' },
  },
};

export function ChoiceCard({ word, state, onTap }: ChoiceCardProps) {
  const borderClass =
    state === 'correct'
      ? 'ring-4 ring-green-400'
      : state === 'reveal'
        ? 'ring-4 ring-yellow-400'
        : 'ring-2 ring-transparent';

  const variants =
    state === 'correct' ? correctVariants : state === 'wrong' ? wrongVariants : revealVariants;
  const animateKey = state === 'idle' ? 'initial' : state;

  return (
    <motion.button
      data-testid="choice-card"
      variants={variants}
      initial="initial"
      animate={animateKey}
      onClick={onTap}
      className={`relative flex items-center justify-center bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer ${borderClass}`}
      style={{ minWidth: 120, minHeight: 120, width: '100%', aspectRatio: '1 / 1' }}
    >
      <Image
        src={word.imagePath}
        alt={word.englishWord}
        fill
        className="object-cover rounded-2xl"
        sizes="(max-width: 428px) 45vw, 180px"
      />
      {state === 'correct' && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-400/30 rounded-2xl">
          <span className="text-5xl">✓</span>
        </div>
      )}
    </motion.button>
  );
}
