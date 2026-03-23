'use client';

import { useEffect, useRef } from 'react';

interface UseIdleTimeoutParams {
  enabled: boolean;
  onIdle30: () => void;
  onIdle60: () => void;
}

interface UseIdleTimeoutReturn {
  resetTimers: () => void;
}

export function useIdleTimeout({ enabled, onIdle30, onIdle60 }: UseIdleTimeoutParams): UseIdleTimeoutReturn {
  const idle30Timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idle60Timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIdle30Ref = useRef(onIdle30);
  const onIdle60Ref = useRef(onIdle60);
  const resetRef = useRef<() => void>(() => {});

  // Keep callback refs up to date
  onIdle30Ref.current = onIdle30;
  onIdle60Ref.current = onIdle60;

  useEffect(() => {
    if (!enabled) {
      if (idle30Timer.current) clearTimeout(idle30Timer.current);
      if (idle60Timer.current) clearTimeout(idle60Timer.current);
      return;
    }

    function reset() {
      if (idle30Timer.current) clearTimeout(idle30Timer.current);
      if (idle60Timer.current) clearTimeout(idle60Timer.current);
      idle30Timer.current = setTimeout(() => onIdle30Ref.current(), 30_000);
      idle60Timer.current = setTimeout(() => onIdle60Ref.current(), 60_000);
    }

    resetRef.current = reset;
    reset();

    const events = ['pointerdown', 'pointermove', 'keydown'] as const;
    events.forEach((e) => window.addEventListener(e, reset));

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (idle30Timer.current) clearTimeout(idle30Timer.current);
      if (idle60Timer.current) clearTimeout(idle60Timer.current);
    };
  }, [enabled]);

  return { resetTimers: () => resetRef.current() };
}
