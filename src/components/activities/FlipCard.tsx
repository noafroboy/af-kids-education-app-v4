'use client';

import Image from 'next/image';
import type { VocabularyWord } from '@/types';

export type CardType = 'en' | 'zh';

export interface PairCard {
  id: string;
  wordId: string;
  type: CardType;
  word: VocabularyWord;
  isFlipped: boolean;
  isMatched: boolean;
}

interface FlipCardProps {
  card: PairCard;
  onFlip: (id: string) => void;
}

export function FlipCard({ card, onFlip }: FlipCardProps) {
  const testId = card.isMatched ? 'flip-card-matched' : 'flip-card';

  return (
    <div
      data-testid={testId}
      onClick={() => onFlip(card.id)}
      className="cursor-pointer"
      style={{ perspective: '1000px', width: '100%', aspectRatio: '1 / 1', minWidth: 80, minHeight: 80 }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.4s ease',
          transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face — card back design */}
        <div
          style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
          className="rounded-2xl bg-[#4ECDC4] flex items-center justify-center shadow-md"
        >
          <span className="text-3xl select-none">🐼</span>
        </div>

        {/* Back face — content */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            position: 'absolute',
            inset: 0,
            transform: 'rotateY(180deg)',
          }}
          className={`rounded-2xl flex flex-col items-center justify-center shadow-md overflow-hidden ${
            card.isMatched ? 'ring-4 ring-green-400 bg-green-50' : 'bg-white'
          }`}
        >
          {card.type === 'en' ? (
            <>
              <div className="relative w-full flex-1" style={{ minHeight: 60 }}>
                <Image
                  src={card.word.imagePath}
                  alt={card.word.englishWord}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </div>
              <p className="text-xs font-bold text-slate-700 pb-1 px-1 text-center truncate w-full">
                {card.word.englishWord}
              </p>
            </>
          ) : (
            <>
              <p
                className="text-3xl font-bold text-[#FF6B35]"
                style={{ fontFamily: 'var(--font-fredoka)' }}
              >
                {card.word.mandarinWord}
              </p>
              <p className="text-xs text-slate-500">{card.word.pinyin}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
