'use client';

import { motion } from 'framer-motion';

interface StepHandoffProps {
  onDone: () => void;
}

export function StepHandoff({ onDone }: StepHandoffProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-8 min-h-screen p-8 text-center"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <div className="text-8xl animate-float" role="img" aria-label="Panda">🐼</div>

      <div>
        <h2
          className="text-3xl font-bold text-[#FF6B35] mb-2"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Hand the device to your child!
        </h2>
        <p className="text-xl text-slate-600">把设备交给孩子！</p>
      </div>

      <p className="text-slate-500 max-w-xs">
        Setup is complete. Your child is ready to start learning!
        <br />
        设置完成，孩子准备好开始学习了！
      </p>

      <button
        data-testid="onboarding-done"
        onClick={onDone}
        className="w-full max-w-xs min-h-[88px] bg-[#4ECDC4] text-white text-2xl font-bold rounded-3xl shadow-lg"
        style={{ fontFamily: 'var(--font-fredoka)' }}
      >
        Let&apos;s Play! / 开始玩! 🎉
      </button>
    </motion.div>
  );
}
