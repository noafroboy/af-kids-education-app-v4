'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MascotIdle } from '@/components/ui/MascotIdle';

interface GreetingStepProps {
  onProceed: () => void;
}

export function GreetingStep({ onProceed }: GreetingStepProps) {
  useEffect(() => {
    const timer = setTimeout(() => onProceed(), 3000);
    return () => clearTimeout(timer);
  }, [onProceed]);

  return (
    <div
      data-testid="session-greeting"
      className="flex flex-col items-center justify-center gap-8 p-8 min-h-screen"
    >
      <MascotIdle size="lg" />

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center text-[#FF6B35]"
        style={{ fontFamily: 'var(--font-fredoka)', fontSize: '32px' }}
      >
        我们来学习吧!
        <br />
        Let&apos;s learn!
      </motion.h2>

      <motion.button
        data-testid="session-proceed-btn"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        whileTap={{ scale: 0.95 }}
        onClick={onProceed}
        className="w-full max-w-xs bg-[#FF6B35] text-white rounded-3xl shadow-lg font-bold text-2xl"
        style={{ fontFamily: 'var(--font-fredoka)', minHeight: 88 }}
      >
        Let&apos;s Go! / 出发！
      </motion.button>
    </div>
  );
}
