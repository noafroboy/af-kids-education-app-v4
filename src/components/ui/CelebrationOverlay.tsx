'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

interface CelebrationOverlayProps {
  childName: string;
  wordCount: number;
  stars?: number;
  onPlayMore?: () => void;
}

export function CelebrationOverlay({ childName, wordCount, stars = 3, onPlayMore }: CelebrationOverlayProps) {
  const router = useRouter();

  useEffect(() => {
    confetti({
      angle: 60,
      spread: 70,
      particleCount: 100,
      origin: { x: 0, y: 0.6 },
      colors: ['#FF6B35', '#4ECDC4', '#C7B8EA'],
    });
    confetti({
      angle: 120,
      spread: 70,
      particleCount: 100,
      origin: { x: 1, y: 0.6 },
      colors: ['#FF6B35', '#4ECDC4', '#C7B8EA'],
    });
  }, []);

  const starIcons = Array.from({ length: stars }, () => '⭐');

  return (
    <motion.div
      data-testid="celebration-overlay"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-8"
      style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFF9F0 60%, #4ECDC4 100%)' }}
    >
      <div className="flex gap-2">
        {starIcons.map((star, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.15, type: 'spring', stiffness: 300 }}
            className="text-4xl"
          >
            {star}
          </motion.span>
        ))}
      </div>

      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold text-white text-center drop-shadow-md"
        style={{ fontFamily: 'var(--font-fredoka)' }}
      >
        太棒了! Great Job!
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-xl text-white text-center drop-shadow-sm"
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        {childName} learned {wordCount} words!
        <br />
        {childName}学了{wordCount}个词!
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <button
          onClick={onPlayMore ?? (() => router.back())}
          className="w-full min-h-[88px] rounded-2xl bg-white text-[#FF6B35] text-xl font-bold shadow-lg"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Play More / 再玩一次
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full min-h-[88px] rounded-2xl bg-[#4ECDC4] text-white text-xl font-bold shadow-lg"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Go Home / 回家
        </button>
      </motion.div>
    </motion.div>
  );
}
