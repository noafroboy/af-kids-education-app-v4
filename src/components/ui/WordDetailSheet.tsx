'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAudio } from '@/hooks/useAudio';
import type { VocabularyWord, WordProgress, MasteryLevel } from '@/types';

interface WordDetailSheetProps {
  word: VocabularyWord;
  progress: WordProgress | null;
  onClose: () => void;
}

const MASTERY_LABELS: Record<MasteryLevel, string> = {
  0: 'Unseen / 未见',
  1: 'Introduced / 已介绍',
  2: 'Recognized / 已认识',
  3: 'Mastered / 已掌握',
};

export function WordDetailSheet({ word, progress, onClose }: WordDetailSheetProps) {
  const { playWordEn } = useAudio();
  const masteryLevel = (progress?.masteryLevel ?? 0) as MasteryLevel;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-end" data-testid="word-detail-sheet">
        <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          exit={{ y: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="p-6 flex flex-col items-center gap-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-2xl text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
            <Image
              src={word.imagePath}
              alt={word.englishWord}
              width={192}
              height={192}
              className="rounded-2xl object-cover"
            />
            <h2 className="text-[#FF6B35] text-3xl" style={{ fontFamily: 'var(--font-fredoka)' }}>
              {word.englishWord}
            </h2>
            <p className="font-bold text-2xl text-slate-700" style={{ fontFamily: 'var(--font-nunito)' }}>
              {word.mandarinWord}
            </p>
            <p className="text-slate-400 italic text-lg" style={{ fontFamily: 'var(--font-nunito)' }}>
              {word.pinyin}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => playWordEn(word.audioEnPath)}
                className="flex-1 py-3 rounded-xl bg-blue-50 text-blue-700 font-semibold"
              >
                🇺🇸 English
              </button>
              <button
                onClick={() => playWordEn(word.audioZhPath)}
                className="flex-1 py-3 rounded-xl bg-red-50 text-red-700 font-semibold"
              >
                🇨🇳 Mandarin
              </button>
            </div>
            <div className="w-full bg-slate-50 rounded-xl p-4 space-y-2 text-sm text-slate-600">
              <p>👁️ Seen: {progress?.seenCount ?? 0} times / 见过{progress?.seenCount ?? 0}次</p>
              <p>✅ Correct: {progress?.correctCount ?? 0} times</p>
              <p>🏆 Mastery: {MASTERY_LABELS[masteryLevel]}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
