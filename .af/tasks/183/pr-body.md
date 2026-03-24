## Summary
- Raises FlipCard tap targets from 80 px to 88 px (minWidth/minHeight) to satisfy the WCAG 2.5.5 spec and the app's 88 px minimum for children ages 2–5.
- Replaces raw `new Audio()` usage in ListenAndFind with `audioManager.playWordEn()` so word audio plays consistently on iOS Safari and Android Chrome.
- Adds `timeoutsRef` + cleanup `useEffect` to ListenAndFind and MatchingPairs so in-flight timers are cancelled on unmount, preventing React "setState on unmounted component" warnings.

## Changes

### src/components/activities/FlipCard.tsx
- `minWidth: 80, minHeight: 80` → `minWidth: 88, minHeight: 88` on the outer container.

### src/components/activities/ListenAndFind.tsx
- Added `import { audioManager } from '@/lib/audio'`.
- `setupRound()`: replaced `new Audio(target.audioEnPath).play()` with `audioManager.playWordEn(target.audioEnPath)`.
- "Play Again" button `onClick`: replaced `new Audio(...)` with `audioManager.playWordEn(current.audioEnPath)` (guarded by null-check).
- Added `timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])`.
- All three `setTimeout` calls in `handleTap` (1200 ms advance, 400 ms wrong-reset, 2000 ms reveal-advance) now push their IDs onto `timeoutsRef.current`.
- Added cleanup `useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), [])`.

### src/components/activities/MatchingPairs.tsx
- Added `useEffect` to the React import.
- Added `timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])`.
- Both nested `setTimeout` calls in `handleFlip` (400 ms outer, 800 ms inner flip-back) now push their IDs onto `timeoutsRef.current`.
- Added cleanup `useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), [])`.

### src/__tests__/ListenAndFind.test.tsx
- Added `jest.mock('@/lib/audio', () => ({ audioManager: { playWordEn: jest.fn() } }))` using inline `jest.fn()` to avoid hoisting TDZ issues.
- Updated "plays audio on mount" test to assert on `audioManager.playWordEn` instead of `global.Audio`.
- Added new test: "Play Again button calls audioManager.playWordEn with current word audioEnPath".

## Testing
- All 179 existing tests pass (`npm test -- --no-coverage`).
- TypeScript type check passes with zero errors (`npx tsc --noEmit`).
- New test verifies `audioManager.playWordEn` is called on mount with the first word's audio path.
- New test verifies the "Play Again" button triggers `audioManager.playWordEn` with the current word's audio path.
