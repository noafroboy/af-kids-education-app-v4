'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface PinPadProps {
  onSubmit: (pin: string) => void;
  onClear?: () => void;
  error?: boolean;
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export function PinPad({ onSubmit, onClear, error }: PinPadProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    };
  }, []);

  function handleKey(key: string) {
    if (key === '⌫') {
      setDigits((prev) => prev.slice(0, -1));
    } else if (key === '') {
      return;
    } else {
      const next = [...digits, key];
      setDigits(next);
      if (next.length === 4) {
        if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
        submitTimerRef.current = setTimeout(() => {
          onSubmit(next.join(''));
          setDigits([]);
        }, 100);
      }
    }
  }

  function handleClear() {
    setDigits([]);
    onClear?.();
  }

  return (
    <div data-testid="pin-pad" className="flex flex-col items-center gap-6">
      {/* PIN display */}
      <motion.div
        className="flex gap-3"
        animate={error ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-full border-3 flex items-center justify-center text-2xl transition-all ${
              i < digits.length
                ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                : 'bg-white border-slate-300'
            }`}
          >
            {i < digits.length ? '●' : '○'}
          </div>
        ))}
      </motion.div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {ROWS.flat().map((key, idx) => {
          if (key === '') {
            return (
              <button
                key={`empty-${idx}`}
                className="w-[88px] h-[88px]"
                aria-hidden="true"
                tabIndex={-1}
                onClick={handleClear}
              />
            );
          }
          const isBackspace = key === '⌫';
          const testId = isBackspace ? 'pin-key-backspace' : `pin-key-${key}`;
          return (
            <motion.button
              key={key}
              data-testid={testId}
              whileTap={{ scale: 0.85 }}
              onClick={() => handleKey(key)}
              className="w-[88px] h-[88px] rounded-2xl bg-white shadow-md flex items-center justify-center text-2xl text-slate-700 select-none"
              style={{ fontFamily: isBackspace ? undefined : 'var(--font-fredoka)' }}
              aria-label={isBackspace ? 'Backspace' : key}
            >
              {key}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
