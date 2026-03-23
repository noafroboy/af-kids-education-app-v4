'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PinPad } from '@/components/ui/PinPad';

interface StepPinProps {
  onNext: (pinHash: string) => void;
  onBack: () => void;
}

export function StepPin({ onNext, onBack }: StepPinProps) {
  const [error, setError] = useState(false);

  async function handleSubmit(pin: string) {
    if (pin.length !== 4) {
      setError(true);
      return;
    }
    setError(false);
    try {
      const { hashPIN } = await import('@/lib/crypto');
      const hash = await hashPIN(pin);
      onNext(hash);
    } catch {
      setError(true);
    }
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-8 min-h-screen p-8"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <div className="w-full max-w-sm space-y-4 flex flex-col items-center">
        <div className="text-center">
          <h2
            className="text-3xl font-bold text-[#FF6B35] mb-1"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Create PIN
          </h2>
          <p className="text-slate-500">创建4位密码</p>
        </div>

        {error && (
          <p className="text-red-500 text-sm">Something went wrong. Please try again. / 请重试</p>
        )}

        <PinPad onSubmit={handleSubmit} error={error} />

        <button
          onClick={onBack}
          className="w-full min-h-[56px] border-2 border-slate-300 text-slate-600 text-lg font-semibold rounded-2xl"
        >
          Back / 返回
        </button>
      </div>
    </motion.div>
  );
}
