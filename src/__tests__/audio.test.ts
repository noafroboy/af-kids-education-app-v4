import { Howl } from 'howler';

type TestableAudioManager = {
  playWordEn: (path: string) => void;
  playWord: (en: string, zh: string) => Promise<void>;
  cancelPending: () => void;
  hasError: boolean;
  playing: boolean;
  error: boolean;
  cache: Map<string, InstanceType<typeof Howl>>;
  pendingTimeoutId: ReturnType<typeof setTimeout> | null;
};

// Re-import the module fresh each time to get an isolated singleton
function freshAudioManager(): TestableAudioManager {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/lib/audio') as { audioManager: TestableAudioManager };
  return mod.audioManager;
}

describe('AudioManager — error state reset', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('playWordEn', () => {
    it('resets the error flag before a new play attempt', () => {
      const mgr = freshAudioManager();
      // Simulate a prior load error by setting the flag directly
      (mgr as unknown as { error: boolean }).error = true;

      mgr.playWordEn('/audio/word.mp3');

      expect(mgr.hasError).toBe(false);
    });

    it('evicts the stale cache entry when error was set and path is cached', () => {
      const mgr = freshAudioManager();
      // Pre-populate the cache with a Howl for this path
      const cache = (mgr as unknown as { cache: Map<string, InstanceType<typeof Howl>> }).cache;
      const fakeHowl = new Howl({ src: ['/audio/stale.mp3'] });
      const unloadSpy = jest.spyOn(fakeHowl, 'unload');
      cache.set('/audio/stale.mp3', fakeHowl);
      (mgr as unknown as { error: boolean }).error = true;

      mgr.playWordEn('/audio/stale.mp3');

      expect(unloadSpy).toHaveBeenCalled();
      // After eviction + getOrCreate, a new Howl was added — but it's a different instance
      expect(cache.get('/audio/stale.mp3')).not.toBe(fakeHowl);
    });

    it('does not evict cache when there was no prior error', () => {
      const mgr = freshAudioManager();
      const cache = (mgr as unknown as { cache: Map<string, InstanceType<typeof Howl>> }).cache;
      const fakeHowl = new Howl({ src: ['/audio/good.mp3'] });
      const unloadSpy = jest.spyOn(fakeHowl, 'unload');
      cache.set('/audio/good.mp3', fakeHowl);
      // error is false by default — do NOT set it

      mgr.playWordEn('/audio/good.mp3');

      expect(unloadSpy).not.toHaveBeenCalled();
      expect(cache.get('/audio/good.mp3')).toBe(fakeHowl);
    });

    it('allows a second play to succeed after the first caused a load error', () => {
      const mgr = freshAudioManager();
      // Trigger the internal onloaderror callback by simulating what Howl does
      const cache = (mgr as unknown as { cache: Map<string, InstanceType<typeof Howl>> }).cache;

      // First call — path is not cached yet; getOrCreate creates it
      mgr.playWordEn('/audio/bad.mp3');
      // Simulate the load error callback firing
      (mgr as unknown as { error: boolean }).error = true;

      // Second call with the same path — should reset and create a fresh Howl
      mgr.playWordEn('/audio/bad.mp3');

      expect(mgr.hasError).toBe(false);
      // Cache should contain a Howl for this path (re-created after eviction)
      expect(cache.has('/audio/bad.mp3')).toBe(true);
    });
  });

  describe('playWord', () => {
    it('resets the error flag before a new play attempt', () => {
      const mgr = freshAudioManager();
      (mgr as unknown as { error: boolean }).error = true;

      // playWord returns a Promise; we don't need to await it for this assertion
      mgr.playWord('/audio/en.mp3', '/audio/zh.mp3');

      expect(mgr.hasError).toBe(false);
    });

    it('evicts both en and zh cache entries when error was set', () => {
      const mgr = freshAudioManager();
      const cache = (mgr as unknown as { cache: Map<string, InstanceType<typeof Howl>> }).cache;

      const enHowl = new Howl({ src: ['/audio/en.mp3'] });
      const zhHowl = new Howl({ src: ['/audio/zh.mp3'] });
      const unloadEn = jest.spyOn(enHowl, 'unload');
      const unloadZh = jest.spyOn(zhHowl, 'unload');
      cache.set('/audio/en.mp3', enHowl);
      cache.set('/audio/zh.mp3', zhHowl);
      (mgr as unknown as { error: boolean }).error = true;

      mgr.playWord('/audio/en.mp3', '/audio/zh.mp3');

      expect(unloadEn).toHaveBeenCalled();
      expect(unloadZh).toHaveBeenCalled();
      // New Howl instances should have replaced the old ones
      expect(cache.get('/audio/en.mp3')).not.toBe(enHowl);
      expect(cache.get('/audio/zh.mp3')).not.toBe(zhHowl);
    });

    it('does not evict cache entries when there was no prior error', () => {
      const mgr = freshAudioManager();
      const cache = (mgr as unknown as { cache: Map<string, InstanceType<typeof Howl>> }).cache;

      const enHowl = new Howl({ src: ['/audio/en.mp3'] });
      const zhHowl = new Howl({ src: ['/audio/zh.mp3'] });
      const unloadEn = jest.spyOn(enHowl, 'unload');
      const unloadZh = jest.spyOn(zhHowl, 'unload');
      cache.set('/audio/en.mp3', enHowl);
      cache.set('/audio/zh.mp3', zhHowl);
      // error stays false

      mgr.playWord('/audio/en.mp3', '/audio/zh.mp3');

      expect(unloadEn).not.toHaveBeenCalled();
      expect(unloadZh).not.toHaveBeenCalled();
    });
  });

  describe('cancelPending()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('is a no-op when pendingTimeoutId is null', () => {
      const mgr = freshAudioManager();
      expect((mgr as unknown as { pendingTimeoutId: ReturnType<typeof setTimeout> | null }).pendingTimeoutId).toBeNull();
      // Should not throw
      expect(() => mgr.cancelPending()).not.toThrow();
      expect((mgr as unknown as { pendingTimeoutId: ReturnType<typeof setTimeout> | null }).pendingTimeoutId).toBeNull();
    });

    it('clears the pending timeout and sets pendingTimeoutId to null', () => {
      const mgr = freshAudioManager();
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      // Manually set a fake pending timeout ID
      const fakeId = setTimeout(() => {}, 10000);
      (mgr as unknown as { pendingTimeoutId: ReturnType<typeof setTimeout> | null }).pendingTimeoutId = fakeId;

      mgr.cancelPending();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(fakeId);
      expect((mgr as unknown as { pendingTimeoutId: ReturnType<typeof setTimeout> | null }).pendingTimeoutId).toBeNull();

      clearTimeoutSpy.mockRestore();
    });

    it('calling playWord() twice cancels the first pending timeout', () => {
      const mgr = freshAudioManager();
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      // First call — this starts the EN howl; no setTimeout yet (it's queued inside 'end' event)
      // To test the cancellation, we manually simulate the scenario by setting pendingTimeoutId
      // between the two calls (as if the 'end' event fired after the first playWord call).
      mgr.playWord('/audio/en1.mp3', '/audio/zh1.mp3');

      // Simulate the 'end' event having fired and the setTimeout being scheduled
      const firstTimeoutId = setTimeout(() => {}, 10000);
      (mgr as unknown as { pendingTimeoutId: ReturnType<typeof setTimeout> | null }).pendingTimeoutId = firstTimeoutId;

      // Second call should cancel the first pending timeout
      mgr.playWord('/audio/en2.mp3', '/audio/zh2.mp3');

      expect(clearTimeoutSpy).toHaveBeenCalledWith(firstTimeoutId);
      expect((mgr as unknown as { pendingTimeoutId: ReturnType<typeof setTimeout> | null }).pendingTimeoutId).toBeNull();

      clearTimeoutSpy.mockRestore();
    });
  });
});
