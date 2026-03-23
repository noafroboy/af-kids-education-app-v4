export class Howl {
  private callbacks: Record<string, ((...args: unknown[]) => void)[]> = {};

  constructor(_options: Record<string, unknown>) {}

  play() { return 1; }
  stop() {}
  unload() {}
  playing() { return false; }
  pause(): this { return this; }
  seek(pos?: number): number { return pos ?? 0; }
  duration(): number { return 0; }
  volume(v?: number): number | this { return typeof v === 'number' ? this : 1; }

  on(event: string, cb: (...args: unknown[]) => void) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(cb);
    return this;
  }

  once(event: string, cb: (...args: unknown[]) => void) {
    const wrapped = (...args: unknown[]) => {
      cb(...args);
      this.callbacks[event] = this.callbacks[event]?.filter((f) => f !== wrapped) ?? [];
    };
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(wrapped);
    return this;
  }

  emit(event: string, ...args: unknown[]) {
    this.callbacks[event]?.forEach((cb) => cb(...args));
  }
}

export const Howler = {
  volume: jest.fn(),
  ctx: null,
};
