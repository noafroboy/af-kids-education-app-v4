'use client';

import type { VocabularyWord } from '@/types';

interface WordChipProps {
  word: VocabularyWord;
  isActive?: boolean;
  onTap: (word: VocabularyWord) => void;
}

export default function WordChip({ word, isActive, onTap }: WordChipProps) {
  return (
    <button
      data-testid="word-chip"
      onClick={() => onTap(word)}
      className={`inline-flex flex-col items-center px-3 py-1 rounded-full text-sm transition-transform ${
        isActive
          ? 'scale-110 border-2 border-[#C7B8EA] bg-purple-100'
          : 'bg-white border border-gray-200'
      }`}
      style={{ fontFamily: 'var(--font-nunito)' }}
    >
      <span style={{ fontFamily: 'var(--font-fredoka)' }}>{word.englishWord}</span>
      <span className="text-xs text-gray-500">{word.mandarinWord}</span>
    </button>
  );
}
