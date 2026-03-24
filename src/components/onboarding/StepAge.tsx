'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface StepAgeProps {
  onNext: (age: number) => void;
  onBack: () => void;
}

const AGES = [2, 3, 4, 5];

export function StepAge({ onNext, onBack }: StepAgeProps) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-8 min-h-screen p-8"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h2
            className="text-3xl font-bold text-[#FF6B35] mb-1"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            How old?
          </h2>
          <p className="text-slate-500">孩子几岁？</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {AGES.map((age) => (
            <button
              key={age}
              data-testid={`age-option-${age}`}
              onClick={() => setSelected(age)}
              className="min-h-[88px] rounded-2xl text-4xl font-bold transition-all shadow"
              style={{
                fontFamily: 'var(--font-fredoka)',
                backgroundColor: selected === age ? '#FF6B35' : 'white',
                color: selected === age ? 'white' : '#FF6B35',
                border: '2px solid',
                borderColor: selected === age ? '#FF6B35' : '#e2e8f0',
              }}
            >
              {age}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 min-h-[88px] border-2 border-slate-300 text-slate-600 text-xl font-bold rounded-2xl"
          >
            Back / 返回
          </button>
          <button
            data-testid="onboarding-next"
            onClick={() => { if (selected !== null) onNext(selected); }}
            disabled={selected === null}
            className="flex-1 min-h-[88px] bg-[#FF6B35] text-white text-xl font-bold rounded-2xl disabled:opacity-50"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Next / 下一步
          </button>
        </div>
      </div>
    </motion.div>
  );
}
