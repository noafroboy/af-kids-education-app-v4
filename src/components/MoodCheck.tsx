'use client';

import { motion } from 'framer-motion';
import type { MoodType } from '@/types';

interface MoodCheckProps {
  onMoodSelected: (mood: MoodType) => void;
}

const MOODS: { mood: MoodType; emoji: string; label: string; labelZh: string; testId: string }[] = [
  { mood: 'happy', emoji: '😊', label: 'Happy', labelZh: '高兴', testId: 'mood-happy' },
  { mood: 'okay', emoji: '😐', label: 'Okay', labelZh: '还好', testId: 'mood-okay' },
  { mood: 'tired', emoji: '😴', label: 'Tired', labelZh: '困', testId: 'mood-tired' },
];

export function MoodCheck({ onMoodSelected }: MoodCheckProps) {
  return (
    <div
      data-testid="mood-check"
      className="flex flex-col items-center gap-8 p-8"
    >
      <h2
        className="text-center text-[#FF6B35]"
        style={{ fontFamily: 'var(--font-fredoka)', fontSize: '28px' }}
      >
        今天怎么样? / How are you feeling?
      </h2>
      <div className="flex gap-6 justify-center">
        {MOODS.map(({ mood, emoji, label, labelZh, testId }) => (
          <motion.button
            key={mood}
            data-testid={testId}
            whileTap={{ scale: 0.85 }}
            onClick={() => onMoodSelected(mood)}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white shadow-md"
            style={{ minWidth: 96, minHeight: 96 }}
          >
            <span style={{ fontSize: '3rem', lineHeight: 1 }}>{emoji}</span>
            <span style={{ fontFamily: 'var(--font-nunito)', fontSize: '16px', fontWeight: 700 }}>
              {label}
            </span>
            <span
              className="text-slate-400"
              style={{ fontFamily: 'var(--font-nunito)', fontSize: '14px' }}
            >
              {labelZh}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
