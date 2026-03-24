# Plan: Core Activity UI & Audio Fixes (Task 183)

## Assumption Audit

### Assumptions made
- "All three setTimeout calls in handleTap" refers to: the 1200ms advance, the 400ms wrong-card reset, and the 2000ms reveal-then-advance. The 2000ms call is only created when `next >= 2` (wrong attempts threshold). All three must still be tracked even though the third is conditional.
- "Two timeouts in handleFlip" in MatchingPairs refers to: the outer `setTimeout(..., 400)` and the inner `setTimeout(..., 800)` that is created inside the outer callback. Both must be captured and pushed onto `timeoutsRef.current`.
- The task says `useEffect` must be imported in MatchingPairs — currently it only imports `useState, useRef, useCallback`. The import line must be updated.
- The `inner` 800ms `tid` in `handleFlip` is created inside the outer callback body; capturing it requires a local `const tid2 = setTimeout(...)` inside that same callback scope, then `timeoutsRef.current.push(tid2)`.

### What the task does NOT specify
- Whether to remove the existing `global.Audio` mock from the test file — decision: keep it to avoid breaking any future test that may still use `new Audio`, but update the one test that checks it.
- Whether to add timeout-cleanup tests to MatchingPairs — decision: no new test added for MatchingPairs cleanup (the bug is about runtime React warnings, not business logic). The existing test suite coverage is sufficient.

### Risks & Open Questions
1. **Test breakage**: The test "plays audio on mount with first word audioEnPath" directly asserts `expect(global.Audio).toHaveBeenCalledWith(...)`. After removing `new Audio()` from the component, this will fail. This test must be updated to mock `audioManager` instead.
2. **useEffect import in MatchingPairs**: Not yet imported — need to add it.
3. **Inner timeout capture**: The 800ms timeout in `handleFlip` is inside the outer 400ms callback. The `const tid2 = setTimeout(...)` must be declared inside that callback so `timeoutsRef.current.push(tid2)` is reachable.
4. **Line count**: ListenAndFind is currently 160 lines. Adding ~12 lines brings it to ~172 lines — within the 200-line limit. MatchingPairs is 155 lines; adding ~10 brings it to ~165 lines. Both stay well under 200.

---

## Approach Alternatives

### APPROACH A: Conservative
**Minimize code changes, use existing patterns.**
- Change `minWidth/minHeight: 80 → 88` in FlipCard (1-line change).
- Replace raw `new Audio()` calls with `audioManager.playWordEn()` in ListenAndFind (2 sites).
- Add `timeoutsRef` + timeout tracking + cleanup `useEffect` to ListenAndFind and MatchingPairs.
- Update the one failing test in ListenAndFind.test.tsx; add one new test for the Play Again button.
- **Effort**: S | **Risk**: Low | **Trade-off**: Laser-focused on the task spec; no risk of unintended side effects.

### APPROACH B: Ideal
**Best long-term solution — extract a shared `useTrackedTimeouts()` hook.**
- Create `src/hooks/useTrackedTimeouts.ts` that returns a `setTimeout` wrapper and auto-clears on unmount.
- Refactor both ListenAndFind and MatchingPairs to use the hook.
- Add a unit test for the new hook.
- **Effort**: M | **Risk**: Med | **Trade-off**: Better abstraction and reusability, but introduces new files and hook patterns beyond what the task requests.

## Approach Decision

**Chosen: APPROACH A — Conservative.**

Rationale: The task description is prescriptive about exactly what code changes to make (specific `const tid = ...` + `timeoutsRef.current.push(tid)` patterns). Introducing a new shared hook is outside the task scope and risks violating the "NO SCOPE CREEP" iron law. The conservative approach fulfils every stated requirement with minimal blast radius.

---

## Specific File Changes

### 1. `src/components/activities/FlipCard.tsx` (93 → 93 lines)
- Line 30: `minWidth: 80, minHeight: 80` → `minWidth: 88, minHeight: 88`

### 2. `src/components/activities/ListenAndFind.tsx` (160 → ~172 lines)
- Add import: `import { audioManager } from '@/lib/audio';`
- `setupRound` callback: remove `new Audio(...)` / `audio.play()`, replace with `audioManager.playWordEn(target.audioEnPath)`
- Play Again button onClick: replace `new Audio(...)` with `if (current?.audioEnPath) audioManager.playWordEn(current.audioEnPath)`
- Add `const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);` near line 43
- Wrap three `setTimeout` calls in `handleTap` with tracking:
  - `const tid = setTimeout(() => advance(index + 1), 1200); timeoutsRef.current.push(tid);`
  - `const tid = setTimeout(() => setCardStates(...), 400); timeoutsRef.current.push(tid);`
  - `const tid = setTimeout(() => advance(index + 1), 2000); timeoutsRef.current.push(tid);`
- Add cleanup useEffect (no deps — runs once on mount, cleans up on unmount)

### 3. `src/components/activities/MatchingPairs.tsx` (155 → ~166 lines)
- Add `useEffect` to the imports line
- Add `const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);` near line 41
- In `handleFlip`, capture both nested timeouts:
  - Outer: `const tid1 = setTimeout(() => { ...; const tid2 = setTimeout(() => { ... }, 800); timeoutsRef.current.push(tid2); ... }, 400); timeoutsRef.current.push(tid1);`
- Add cleanup useEffect

### 4. `src/__tests__/ListenAndFind.test.tsx`
- Add mock for `audioManager`: `jest.mock('@/lib/audio', () => ({ audioManager: { playWordEn: mockPlayWordEn } }))`
- Update test "plays audio on mount with first word audioEnPath" to assert `mockPlayWordEn` was called instead of `global.Audio`
- Add test "Play Again button calls audioManager.playWordEn with current word's audioEnPath"

---

## Production-Readiness Checklist

1. **Persistence** — N/A — Pure UI component fixes. No data is created or stored by these changes. Existing persistence (useProgress, IndexedDB) is untouched.

2. **Error handling** — `audioManager.playWordEn` already has internal `try/catch` with `console.warn`. The timeout cleanup useEffects prevent React "setState on unmounted component" errors at runtime. No new external calls are introduced.

3. **Input validation** — N/A — No user input processing is changed by these modifications.

4. **Loading states** — N/A — These are tap-target sizing and audio plumbing fixes, not async data operations.

5. **Empty states** — N/A — Empty state logic (`if (wordList.length === 0) return null`) is already present in ListenAndFind and is untouched.

6. **Security** — N/A — No API keys, no LLM calls, no network requests added.

7. **Component size** — FlipCard: 93 lines (unchanged). ListenAndFind: ~172 lines after changes (under 200). MatchingPairs: ~166 lines after changes (under 200). All compliant.

8. **Test coverage** — The one test that asserts on `global.Audio` will be updated to assert on `audioManager.playWordEn`. A new test covers the Play Again button. All other existing tests should continue to pass without modification.
