'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MascotIdleProps {
  size?: 'sm' | 'md' | 'lg';
  showBubble?: boolean;
  onClick?: () => void;
  className?: string;
}

const SIZE_MAP: Record<string, number> = {
  sm: 56,
  md: 96,
  lg: 140,
};

export function MascotIdle({ size = 'md', showBubble = false, onClick, className }: MascotIdleProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const px = SIZE_MAP[size];

  useEffect(() => {
    let blinkTimer: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setIsBlinking(true);
      blinkTimer = setTimeout(() => setIsBlinking(false), 200);
    }, 3000);
    return () => {
      clearInterval(interval);
      if (blinkTimer) clearTimeout(blinkTimer);
    };
  }, []);

  return (
    <div
      data-testid="mascot-idle"
      className={`relative inline-flex flex-col items-center${className ? ` ${className}` : ''}`}
      style={{ width: px, height: px }}
      onClick={onClick}
    >
      <AnimatePresence>
        {showBubble && (
          <motion.div
            key="bubble"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full mb-2 bg-[#FF6B35] text-white rounded-2xl px-3 py-2 text-xs whitespace-nowrap z-10"
            style={{ fontFamily: 'var(--font-fredoka)', left: '50%', transform: 'translateX(-50%)' }}
          >
            Tap me! / 点我玩！
            <span
              className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent border-t-[#FF6B35]"
              style={{ width: 0, height: 0 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        style={{ width: px, height: px, cursor: onClick ? 'pointer' : 'default' }}
      >
        <svg viewBox="0 0 100 100" width={px} height={px} xmlns="http://www.w3.org/2000/svg">
          {/* Ears */}
          <circle cx="22" cy="24" r="13" fill="#1a1a1a" />
          <circle cx="78" cy="24" r="13" fill="#1a1a1a" />
          <circle cx="22" cy="24" r="7" fill="#555" />
          <circle cx="78" cy="24" r="7" fill="#555" />

          {/* Head */}
          <ellipse cx="50" cy="53" rx="38" ry="36" fill="white" stroke="#1a1a1a" strokeWidth="2" />

          {/* Eye patches */}
          <motion.rect
            x="24" y="38"
            width="18"
            rx="5"
            fill="#1a1a1a"
            animate={{ height: isBlinking ? 2 : 14 }}
            transition={{ duration: 0.15 }}
            style={{ originY: 'center' }}
          />
          <motion.rect
            x="58" y="38"
            width="18"
            rx="5"
            fill="#1a1a1a"
            animate={{ height: isBlinking ? 2 : 14 }}
            transition={{ duration: 0.15 }}
            style={{ originY: 'center' }}
          />

          {/* Eye whites */}
          <circle cx="33" cy="44" r="5" fill="white" opacity={isBlinking ? 0 : 1} />
          <circle cx="67" cy="44" r="5" fill="white" opacity={isBlinking ? 0 : 1} />

          {/* Pupils */}
          <circle cx="34" cy="45" r="3" fill="#1a1a1a" opacity={isBlinking ? 0 : 1} />
          <circle cx="68" cy="45" r="3" fill="#1a1a1a" opacity={isBlinking ? 0 : 1} />

          {/* Nose */}
          <ellipse cx="50" cy="61" rx="4" ry="3" fill="#1a1a1a" />

          {/* Mouth */}
          <path
            d="M 40 67 Q 50 76 60 67"
            stroke="#1a1a1a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}
