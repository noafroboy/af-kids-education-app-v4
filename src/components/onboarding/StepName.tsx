'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface StepNameProps {
  onNext: (name: string) => void;
  onBack: () => void;
}

export function StepName({ onNext, onBack }: StepNameProps) {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const isValid = name.trim().length > 0;

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
            Child&apos;s Name
          </h2>
          <p className="text-slate-500">孩子的名字是什么？</p>
        </div>

        <div>
          <input
            name="childName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Enter name / 输入名字"
            className="w-full min-h-[64px] text-2xl px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-[#FF6B35] focus:outline-none bg-white"
            style={{ fontFamily: 'var(--font-nunito)' }}
            autoFocus
          />
          {touched && !isValid && (
            <p className="text-red-500 text-sm mt-1">Please enter a name / 请输入名字</p>
          )}
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
            onClick={() => {
              setTouched(true);
              if (isValid) onNext(name.trim());
            }}
            disabled={!isValid}
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
