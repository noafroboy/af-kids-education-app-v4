## Summary
- Fixes act() warnings across all 4 unit test suites by wrapping `jest.runOnlyPendingTimers()` calls in `act()` and ensuring async state updates complete before tests finish.
- Adds required audioManager spy assertions to ListenAndFind and completion-flow flushing to MatchingPairs.
- Adds PIN bypass protection E2E test verifying unauthenticated users are redirected to the PIN gate.

## Changes

### src/__tests__/ListenAndFind.test.tsx
- Wrapped `jest.runOnlyPendingTimers()` in `act()` in `afterEach` to eliminate act() warnings from pending timer callbacks.
- Added test `'plays audio via audioManager when round starts (not raw Audio)'` using `jest.spyOn(audioManager, 'playWordEn')`.
- Added test `'Play Again button calls audioManager.playWordEn'` using `jest.spyOn` to verify the Play Again button uses `audioManager` (not raw `Audio`).

### src/__tests__/MatchingPairs.test.tsx
- Added `act(() => { jest.advanceTimersByTime(0); })` in the `onComplete` test after a match to flush the nested `setTimeout(() => checkComplete(...), 0)` callback.

### src/__tests__/SongTime.test.tsx
- Wrapped `jest.runOnlyPendingTimers()` in `act()` in both `afterEach` hooks (SongTime describe and GreetingStep describe) to eliminate act() warnings from RAF/MascotIdle timer callbacks.

### src/__tests__/ParentDashboard.test.tsx
- Added `act` to the `@testing-library/react` import.
- Converted `'renders loading skeleton initially'` to async and added `await waitFor(...)` to flush async state updates from `useEffect`, eliminating act() warnings.

### tests/e2e/parent-dashboard.spec.ts
- Added `'direct navigation to /parent/dashboard redirects to PIN page'` E2E test that verifies unauthenticated users navigating directly to the dashboard are redirected to the PIN gate.

## Testing
- `npm test -- --testPathPattern='ListenAndFind|MatchingPairs|SongTime|ParentDashboard'`: 58 tests pass, zero act() warnings in output.
- Full test suite: 207 tests pass, no regressions.
- E2E test added to `tests/e2e/parent-dashboard.spec.ts` for CI Playwright runs.
