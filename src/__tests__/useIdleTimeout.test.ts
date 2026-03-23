import { renderHook, act } from '@testing-library/react';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';

describe('useIdleTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('does nothing when enabled=false', () => {
    const onIdle30 = jest.fn();
    const onIdle60 = jest.fn();
    renderHook(() => useIdleTimeout({ enabled: false, onIdle30, onIdle60 }));
    act(() => jest.advanceTimersByTime(65_000));
    expect(onIdle30).not.toHaveBeenCalled();
    expect(onIdle60).not.toHaveBeenCalled();
  });

  it('fires onIdle30 after 30s', () => {
    const onIdle30 = jest.fn();
    const onIdle60 = jest.fn();
    renderHook(() => useIdleTimeout({ enabled: true, onIdle30, onIdle60 }));
    act(() => jest.advanceTimersByTime(30_000));
    expect(onIdle30).toHaveBeenCalledTimes(1);
    expect(onIdle60).not.toHaveBeenCalled();
  });

  it('fires onIdle60 after 60s', () => {
    const onIdle30 = jest.fn();
    const onIdle60 = jest.fn();
    renderHook(() => useIdleTimeout({ enabled: true, onIdle30, onIdle60 }));
    act(() => jest.advanceTimersByTime(60_000));
    expect(onIdle60).toHaveBeenCalledTimes(1);
  });

  it('resets timers on pointerdown event', () => {
    const onIdle30 = jest.fn();
    const onIdle60 = jest.fn();
    renderHook(() => useIdleTimeout({ enabled: true, onIdle30, onIdle60 }));

    // advance 25s, then fire event to reset
    act(() => jest.advanceTimersByTime(25_000));
    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
    });

    // advance another 25s — should NOT have fired because timer was reset
    act(() => jest.advanceTimersByTime(25_000));
    expect(onIdle30).not.toHaveBeenCalled();

    // advance remaining 5s to hit the 30s threshold from reset point
    act(() => jest.advanceTimersByTime(5_000));
    expect(onIdle30).toHaveBeenCalledTimes(1);
  });

  it('cleans up timers on unmount', () => {
    const onIdle30 = jest.fn();
    const onIdle60 = jest.fn();
    const { unmount } = renderHook(() => useIdleTimeout({ enabled: true, onIdle30, onIdle60 }));
    unmount();
    act(() => jest.advanceTimersByTime(65_000));
    expect(onIdle30).not.toHaveBeenCalled();
    expect(onIdle60).not.toHaveBeenCalled();
  });
});
