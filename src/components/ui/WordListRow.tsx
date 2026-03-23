'use client';

import Image from 'next/image';
import type { VocabularyWord, WordProgress, MasteryLevel } from '@/types';

interface WordListRowProps {
  word: VocabularyWord;
  progress: WordProgress | null;
  onClick: () => void;
}

const MASTERY_CONFIG: Record<MasteryLevel, { labelZh: string; color: string }> = {
  0: { labelZh: '未见', color: 'bg-slate-200 text-slate-600' },
  1: { labelZh: '已介绍', color: 'bg-yellow-100 text-yellow-700' },
  2: { labelZh: '已认识', color: 'bg-blue-100 text-blue-700' },
  3: { labelZh: '已掌握', color: 'bg-green-100 text-green-700' },
};

export function WordListRow({ word, progress, onClick }: WordListRowProps) {
  const level = (progress?.masteryLevel ?? 0) as MasteryLevel;
  const mastery = MASTERY_CONFIG[level];

  return (
    <button
      data-testid="word-row"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
    >
      <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
        <Image
          src={word.imagePath}
          alt={word.englishWord}
          width={48}
          height={48}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 truncate" style={{ fontFamily: 'var(--font-nunito)' }}>
          {word.englishWord}
        </p>
        <p className="text-slate-500 text-sm truncate" style={{ fontFamily: 'var(--font-nunito)' }}>
          {word.mandarinWord}
        </p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${mastery.color}`}>
        {mastery.labelZh}
      </span>
    </button>
  );
}
