# Plan: Fix P1 Timer Leaks (Task 192)

## Assumption Audit

### Ambiguities resolved
- **"Apply this pattern to EVERY cleanup function in the file"** — After reading the files, `ListenAndFind.tsx` has exactly ONE cleanup function (the `useEffect` at line 68-70). The `useEffect` at line 64-66 has no cleanup. Only the one cleanup needs the fix.
- **"Find all useEffect cleanup functions that call forEach/clearTimeout on a ref"** — `MatchingPairs.tsx` has exactly ONE cleanup function (line 114-116). Same situation as above.
- **"replace `const timeoutId = setTimeout(...)` or `setTimeout(...)`"** — The actual code on line 59 of `audio.ts` is a bare `setTimeout(...)` (no variable assignment), so we replace it with `this.pendingTimeoutId = setTimeout(...)`.
- **"At the START of playWord()"** — The task says call `this.cancelPending()` at the very start of the method body, before any error-handling or cache eviction logic.

### What the task does NOT specify (defaults chosen)
- Whether to add `cancelPending()` call in `playWordEn()` — **Not required**. Task only mentions `playWord()`.
- Whether to clear the Howl `.play()` call itself — **Not required**. Only the inter-word delay `setTimeout` needs tracking.
- Whether `timeoutsRef.current = []` should be in the snapshot fix — **Yes**, per the task spec: "Then clear using the snapshot: `ids.forEach(clearTimeout); timeoutsRef.current = [];`"

### Risks & Open Questions
1. **Zero-delay timeout in MatchingPairs** (line 91: `setTimeout(() => checkComplete(updated), 0)`) — This is NOT pushed to `timeoutsRef` and fires synchronously within the current event loop tick. It is intentionally not tracked. No fix needed.
2. **`cancelPending` only kills the inter-word delay** — It doesn't stop an already-playing Howl. This is acceptable per the task description ("cancels the first pending audio cue").
3. **Existing `audio.test.ts` uses `freshAudioManager()`** — New tests for `cancelPending()` must follow the same re-require pattern to avoid singleton state pollution between tests.

---

## Approach Alternatives

### APPROACH A — Conservative ✅ CHOSEN
Minimal, surgical changes exactly as specified in the task:
- Snapshot `timeoutsRef.current` before clearing in both component cleanup functions.
- Add `pendingTimeoutId` field + `cancelPending()` to `AudioManager`, wire `playWord()` to use it.
- Add targeted unit tests for each new behavior.

**Effort:** S | **Risk:** Low | **Trade-off:** Precisely scoped; no risk of touching working code, but does not address the zero-delay nested timeout in MatchingPairs (which is intentional).

### APPROACH B — Ideal
Add a `useTimeouts` custom hook that wraps the ref + cleanup pattern, centralising the fix. Also add a `cancelAll()` method to AudioManager that stops Howl playback (not just the pending delay).

**Effort:** M | **Risk:** Med | **Trade-off:** Better long-term maintainability but involves refactoring shared utilities outside the task's stated scope, violating the Iron Law against scope creep.

## Approach Decision

**Chose Approach A.** The task description is explicit about the exact lines to change and the exact pattern to apply. Approach B would introduce a new custom hook and modify AudioManager beyond what is required — violating Iron Law #5 (No Scope Creep). The conservative approach is lower risk and faster to verify.

---

## Changes by File

### 1. `src/components/activities/ListenAndFind.tsx` (line 68-70)

**Before:**
```tsx
useEffect(() => {
  return () => { timeoutsRef.current.forEach(clearTimeout); };
}, []);
```

**After:**
```tsx
useEffect(() => {
  return () => {
    const ids = timeoutsRef.current;
    ids.forEach(clearTimeout);
    timeoutsRef.current = [];
  };
}, []);
```

**Why:** The cleanup function currently closes over the ref object. If React re-renders between when the effect runs and when cleanup fires, the array inside the ref may have grown (new timers pushed by new interactions). The snapshot `const ids = timeoutsRef.current` captures the live array reference at cleanup time (not a stale copy), then we zero the ref so future pushes don't accumulate garbage IDs.

### 2. `src/components/activities/MatchingPairs.tsx` (line 114-116)

**Before:**
```tsx
useEffect(() => {
  return () => { timeoutsRef.current.forEach(clearTimeout); };
}, []);
```

**After:**
```tsx
useEffect(() => {
  return () => {
    const ids = timeoutsRef.current;
    ids.forEach(clearTimeout);
    timeoutsRef.current = [];
  };
}, []);
```

**Why:** Identical stale-ref problem. After unmount, `isFlipping.current` prevents further handleFlip calls, but the `tid2` (800ms flip-back timer) that was scheduled right before unmount would still fire and call `setCards` / `setFlippedIds` on an unmounted component.

### 3. `src/lib/audio.ts`

**Changes:**
1. Add `private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;` class field.
2. Add public `cancelPending()` method.
3. At start of `playWord()`, call `this.cancelPending()`.
4. Replace bare `setTimeout(...)` on line 59 with `this.pendingTimeoutId = setTimeout(...)`.

**Why:** When `playWord()` is called twice in quick succession (e.g. two fast taps on the "Play Again" button), the first 800ms inter-word delay fires after the second call has already started a new English cue. This causes both the Mandarin audio from the first call AND the English+Mandarin from the second call to play simultaneously. `cancelPending()` aborts the first delay before the second sequence begins.

---

## Test Plan

### `src/__tests__/ListenAndFind.test.tsx` — new test
- **"clears all pending timeouts on unmount"**: Render, simulate a correct tap (schedules a 1200ms setTimeout), then `unmount()` inside `act()`. Spy on `clearTimeout` and verify it was called. Also verify `timeoutsRef.current` is `[]` after cleanup (requires exporting the ref or spying on the cleanup call).

### `src/__tests__/MatchingPairs.test.tsx` — new test
- **"clears pending timeouts on unmount without post-unmount errors"**: Render, flip two cards (schedules 400ms + 800ms timeouts), call `unmount()` inside `act()`, advance timers — no thrown errors and no React state-update warnings.

### `src/__tests__/audio.test.ts` — new describe block: `cancelPending()`
- **"is a no-op when pendingTimeoutId is null"**: call `cancelPending()` on a fresh manager — does not throw, `pendingTimeoutId` stays null.
- **"clears the pending timeout when one is set"**: set `pendingTimeoutId` to a fake timer ID, spy on `clearTimeout`, call `cancelPending()` — spy was called with correct ID, field is null.
- **"calling playWord() twice cancels first pending timeout"**: call `playWord()` once (schedules the delay), immediately call `playWord()` again — verify `clearTimeout` was called with the first timeout ID.

---

## Production-Readiness Checklist

1. **Persistence** — N/A — This task makes no data storage changes. All changes are in-memory timer lifecycle management within React components and a singleton class.

2. **Error handling** — N/A — No new external calls are introduced. Existing error handling in `playWord()` and `playWordEn()` is unchanged.

3. **Input validation** — N/A — No user-facing input is involved in these changes.

4. **Loading states** — N/A — No async operations are added or changed.

5. **Empty states** — N/A — No UI changes; component rendering logic is untouched.

6. **Security** — N/A — No API keys, no LLM, no user data processed by the changed code.

7. **Component size** — `ListenAndFind.tsx` is 168 lines (within 200-line iron law limit); change adds 2 lines. `MatchingPairs.tsx` is 162 lines; change adds 2 lines. `audio.ts` is 121 lines; change adds ~10 lines → ~131 lines. All within limits. No extraction required.

8. **Test coverage** — Adding 5 new tests: 1 for ListenAndFind unmount, 1 for MatchingPairs unmount, 3 for `cancelPending()`. These cover the happy path (timers clear on unmount), the no-op case (cancelPending with no pending timeout), and the rapid-call scenario (second playWord cancels first).
