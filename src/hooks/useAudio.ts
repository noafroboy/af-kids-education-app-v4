'use client';

import { useEffect, useState } from 'react';
import { audioManager } from '@/lib/audio';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      const unlock = () => {
        audioManager.unlockAudioContext();
        document.removeEventListener('click', unlock);
      };
      document.addEventListener('click', unlock, { once: true });
    }
  }, []);

  function playWord(enPath: string, zhPath: string): void {
    setIsPlaying(true);
    audioManager.playWord(enPath, zhPath).then(() => {
      setIsPlaying(false);
      if (audioManager.hasError) setAudioError(true);
    });
  }

  function playEffect(name: 'correct' | 'incorrect' | 'celebration' | 'whoosh' | 'card-flip' | 'tap'): void {
    audioManager.playEffect(name);
    if (audioManager.hasError) setAudioError(true);
  }

  return { playWord, playEffect, isPlaying, audioError };
}
