'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-slate-500 mb-1">
          <span>{label}</span>
          <span>{current}/{total}</span>
        </div>
      )}
      {!label && (
        <div className="text-xs text-slate-400 text-right mb-1">{current}/{total}</div>
      )}
      <div className="w-full bg-slate-200 rounded-full" style={{ minHeight: '8px' }}>
        <motion.div
          className="h-2 rounded-full bg-[#FF6B35]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
