## Summary
- Fix stale-ref timer leaks in `ListenAndFind` and `MatchingPairs` that caused "state update on unmounted component" React warnings when a child navigated away mid-activity.
- Add `cancelPending()` to `AudioManager` so calling `playWord()` twice in rapid succession (e.g., double-tap) cancels the first in-flight inter-word delay and prevents audio overlap.

## Changes

### `src/components/activities/ListenAndFind.tsx`
- Snapshot `timeoutsRef.current` into a local `ids` variable at the top of the cleanup function, then call `ids.forEach(clearTimeout)` and reset `timeoutsRef.current = []`. This avoids the stale-ref bug where the ref array could grow between effect setup and cleanup.

### `src/components/activities/MatchingPairs.tsx`
- Same stale-ref snapshot fix applied to the single cleanup function that clears flip-back timers.

### `src/lib/audio.ts`
- Added `private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null` class field.
- Added public `cancelPending(): void` method that clears the pending inter-word delay timeout.
- `playWord()` now calls `this.cancelPending()` at the start and stores the 800ms delay as `this.pendingTimeoutId` so it can be cancelled by a subsequent call.

### `src/__tests__/ListenAndFind.test.tsx`
- New test: "clears all pending timeouts on unmount" — taps a card, unmounts immediately, verifies `clearTimeout` was called.

### `src/__tests__/MatchingPairs.test.tsx`
- New test: "clears pending timeouts on unmount without post-unmount errors" — flips two cards, unmounts, advances all timers, verifies no errors thrown.

### `src/__tests__/audio.test.ts`
- Extended `TestableAudioManager` type to include `cancelPending` and `pendingTimeoutId`.
- New describe block `cancelPending()` with three tests:
  - No-op when `pendingTimeoutId` is null.
  - Clears the timeout and nulls the field when one is set.
  - Second `playWord()` call cancels the first pending timeout.

## Testing
- All 212 existing tests pass (zero regressions).
- 5 new tests added and passing: 1 (ListenAndFind unmount), 1 (MatchingPairs unmount), 3 (cancelPending).
- `tsc --noEmit`: zero errors.
- `next lint` on modified files: zero warnings or errors.
