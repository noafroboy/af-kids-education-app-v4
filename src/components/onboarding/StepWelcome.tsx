'use client';

import { motion } from 'framer-motion';
import { audioManager } from '@/lib/audio';

interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <motion.div
      data-testid="onboarding-welcome"
      className="flex flex-col items-center justify-center gap-8 min-h-screen p-8 text-center"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <div className="text-8xl animate-float" role="img" aria-label="Panda">🐼</div>
      <div>
        <h1
          className="text-5xl font-bold text-[#FF6B35] mb-2"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          LittleBridge
        </h1>
        <p className="text-2xl font-bold text-slate-600" style={{ fontFamily: 'var(--font-fredoka)' }}>
          小桥
        </p>
      </div>
      <p className="text-lg text-slate-600 max-w-xs">
        Bilingual English-Mandarin learning for curious kids!
        <br />
        <span className="text-slate-500">中英双语学习，专为好奇宝宝！</span>
      </p>
      <button
        data-testid="onboarding-start"
        onClick={() => {
          audioManager.unlockAudioContext();
          onNext();
        }}
        className="w-full max-w-xs min-h-[88px] bg-[#FF6B35] text-white text-2xl font-bold rounded-3xl shadow-lg"
        style={{ fontFamily: 'var(--font-fredoka)' }}
      >
        Get Started / 开始 🚀
      </button>
    </motion.div>
  );
}
