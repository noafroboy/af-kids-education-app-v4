import { Howl } from 'howler';
import type { VocabularyWord } from '@/types';

type SfxName = 'correct' | 'incorrect' | 'celebration' | 'whoosh' | 'card-flip' | 'tap';

class AudioManager {
  private iOSUnlocked = false;
  private isPlaying = false;
  private error = false;
  private cache: Map<string, Howl> = new Map();
  private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;

  unlockAudioContext(): void {
    if (this.iOSUnlocked) return;
    try {
      const AudioContext = window.AudioContext || (window as never)['webkitAudioContext'];
      if (AudioContext) {
        const ctx = new AudioContext();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this.iOSUnlocked = true;
      }
    } catch {
      console.warn('[AudioManager] Could not unlock AudioContext');
    }
  }

  private getOrCreate(path: string): Howl {
    if (!this.cache.has(path)) {
      const howl = new Howl({
        src: [path],
        html5: true,
        onloaderror: (_id: number, err: unknown) => {
          console.warn(`[AudioManager] Load error for ${path}:`, err);
          this.error = true;
        },
      });
      this.cache.set(path, howl);
    }
    return this.cache.get(path)!;
  }

  cancelPending(): void {
    if (this.pendingTimeoutId !== null) {
      clearTimeout(this.pendingTimeoutId);
      this.pendingTimeoutId = null;
    }
  }

  playWord(enPath: string, zhPath: string): Promise<void> {
    this.cancelPending();
    if (this.error) {
      [enPath, zhPath].forEach((p) => {
        if (this.cache.has(p)) {
          this.cache.get(p)?.unload();
          this.cache.delete(p);
        }
      });
    }
    this.error = false;
    this.isPlaying = true;
    return new Promise((resolve) => {
      const enHowl = this.getOrCreate(enPath);
      enHowl.once('end', () => {
        this.pendingTimeoutId = setTimeout(() => {
          this.pendingTimeoutId = null;
          const zhHowl = this.getOrCreate(zhPath);
          zhHowl.once('end', () => {
            this.isPlaying = false;
            resolve();
          });
          zhHowl.once('loaderror', () => {
            this.isPlaying = false;
            resolve();
          });
          zhHowl.play();
        }, 800);
      });
      enHowl.once('loaderror', () => {
        this.isPlaying = false;
        resolve();
      });
      enHowl.play();
    });
  }

  playWordEn(enPath: string): void {
    if (this.error && this.cache.has(enPath)) {
      this.cache.get(enPath)?.unload();
      this.cache.delete(enPath);
    }
    this.error = false;
    try {
      const howl = this.getOrCreate(enPath);
      howl.play();
    } catch {
      console.warn(`[AudioManager] Could not play word: ${enPath}`);
    }
  }

  playEffect(name: SfxName): void {
    const path = `/audio/sfx/${name}.mp3`;
    try {
      const howl = this.getOrCreate(path);
      howl.play();
    } catch {
      console.warn(`[AudioManager] Could not play effect: ${name}`);
    }
  }

  preloadWords(words: VocabularyWord[]): void {
    for (const word of words) {
      this.getOrCreate(word.audioEnPath);
      this.getOrCreate(word.audioZhPath);
    }
  }

  get hasError(): boolean {
    return this.error;
  }

  get playing(): boolean {
    return this.isPlaying;
  }
}

export const audioManager = new AudioManager();
