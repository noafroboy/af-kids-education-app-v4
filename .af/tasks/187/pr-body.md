## Summary
- Fixes a silent audio bug where a single load error permanently blocked all subsequent audio playback by resetting the error flag and evicting stale cache entries on each new play attempt.
- Keeps the HomeScreen word-count counter fresh after a child completes an activity by re-fetching on `visibilitychange` (tab regains focus), with proper cleanup on unmount.
- Corrects the Playwright viewport so E2E tests run at the intended 375×667 mobile size instead of the 1280×720 Desktop Chrome override.

## Changes

### src/lib/audio.ts
- `playWordEn`: reset `this.error = false` before each play attempt; evict stale cached `Howl` when error flag was set so a fresh instance is created.
- `playWord`: same eviction logic for both `enPath` and `zhPath`; reset `this.error = false` before setting `isPlaying`.

### src/components/HomeScreen.tsx
- Extracted inline IIFE into a named `fetchData` async function inside `useEffect`.
- Added `document.addEventListener('visibilitychange', handleVisibilityChange)` that calls `fetchData()` when `visibilityState === 'visible'`.
- Return a cleanup function that calls `removeEventListener` to prevent memory leaks.

### playwright.config.ts
- Removed `...devices['Desktop Chrome']` spread from the `chromium` project so the global `use.viewport: { width: 375, height: 667 }` is no longer overridden.

### src/__tests__/audio.test.ts (new)
- Unit tests for `playWordEn` and `playWord` error-reset and cache-eviction behavior (5 tests).

### src/__tests__/HomeScreen.test.tsx (new)
- Unit tests for initial fetch, visibility-change re-fetch, hidden-state no-fetch, and listener cleanup on unmount (4 tests).

### tests/e2e/viewport.spec.ts (new)
- Playwright test that asserts `page.viewportSize()` returns `{ width: 375, height: 667 }`.

## Testing
- `npm test` — 205 Jest unit tests pass (25 suites), 0 failures.
- `npx tsc --noEmit` — zero TypeScript errors.
- New tests cover all three behavioral changes: audio error reset (5 cases), HomeScreen visibility refresh (4 cases), and Playwright viewport (1 E2E spec).
