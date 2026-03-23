'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AudioButton } from './AudioButton';
import type { VocabularyWord } from '@/types';

const PLACEHOLDER_BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';

interface VocabularyCardProps {
  word: VocabularyWord;
  onTap?: () => void;
}

export function VocabularyCard({ word, onTap }: VocabularyCardProps) {
  const [imgSrc, setImgSrc] = useState(word.imagePath);

  return (
    <motion.div
      data-testid="vocab-card"
      className="flex flex-col items-center gap-4 bg-white rounded-3xl shadow-lg p-6 min-h-[320px] w-full max-w-sm cursor-pointer select-none"
      whileTap={{ scale: 0.96, transition: { type: 'spring', stiffness: 400 } }}
      onClick={onTap}
    >
      <div className="relative w-64 h-64 rounded-3xl overflow-hidden shadow-md">
        <Image
          src={imgSrc}
          alt={word.englishWord}
          fill
          sizes="256px"
          className="object-cover"
          placeholder="blur"
          blurDataURL={PLACEHOLDER_BLUR}
          onError={() => setImgSrc('/images/placeholder.png')}
        />
      </div>

      <div className="text-center space-y-1">
        <p
          className="text-[36px] font-bold leading-tight"
          style={{ fontFamily: 'var(--font-fredoka)', color: '#FF6B35' }}
        >
          {word.englishWord}
        </p>
        <p className="text-[24px] font-bold text-slate-700" style={{ fontFamily: 'var(--font-nunito)' }}>
          {word.mandarinWord}
        </p>
        <p className="text-[16px] italic text-slate-400" style={{ fontFamily: 'var(--font-nunito)' }}>
          {word.pinyin}
        </p>
      </div>

      <AudioButton enPath={word.audioEnPath} zhPath={word.audioZhPath} />
    </motion.div>
  );
}
