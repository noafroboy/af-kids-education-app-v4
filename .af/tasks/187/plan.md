# Task 187 Plan — P2 Infrastructure Fixes

## Overview

Three targeted P2 fixes across three files:

1. **`src/lib/audio.ts`** — Reset the `error` flag (and evict stale cache) on new play attempts so that a transient audio-load failure doesn't permanently silences subsequent valid audio.
2. **`src/components/HomeScreen.tsx`** — Refresh the daily word-count counter when the browser tab regains visibility, so a child sees up-to-date progress without a manual page reload.
3. **`playwright.config.ts`** — Remove the `...devices['Desktop Chrome']` spread that overrides the globally-configured 375×667 mobile viewport.

---

## Assumption Audit

Before planning, the following ambiguities were identified:

| Assumption | Clarification / Default chosen |
|---|---|
| Which `playwright.config.ts` fix style? | Task says "prefer the empty-use approach" → `use: {}` (not Pixel 5) |
| Should the audio error reset happen on _every_ call or only when `this.error` is `true`? | Always reset `this.error = false` before the attempt (matches task code exactly) |
| Does the visibility refresh need to re-fetch `childName` too? | Yes — the provided `fetchData` refactor fetches both `childName` and `todayWords` |
| Which paths get evicted in `playWord`? | Both `enPath` and `zhPath` (as shown in task code with `forEach`) |
| Does the sanity test's 200-line limit apply to `audio.ts`? | `audio.ts` is in `src/lib/`, not `src/components/`; sanity test only checks `src/components/`. Task requirement specifies `< 200 lines` for `audio.ts` explicitly. |

### Risks & Open Questions

- **AudioManager singleton in Jest**: The `audioManager` export is a module-level singleton. Jest can retain state across tests unless `jest.resetModules()` or `jest.isolateModules()` is used. Tests must guard against state leakage.
- **HomeScreen `db` mock**: `useDB` returns an IndexedDB handle. The hook + `getSetting`/`getAllSessions` DB functions must be properly mocked to avoid real IndexedDB calls in unit tests.
- **`visibilitychange` timing**: The event fires a `fetchData()` async call. Tests must use `act()` + `waitFor()` to avoid flaky assertions.

---

## Approach Alternatives

### Approach A — Conservative (minimize code changes)

Make only the three targeted source-file edits described in the task. Rely on existing E2E tests for verification. No new test files.

- **Effort**: S
- **Risk**: Low
- **Trade-off**: Violates Iron Law 4 ("no untested happy paths"). The three behavioral changes have no unit-test coverage and no way to catch regressions in CI at the unit level.

### Approach B — Ideal (changes + tests)

Make the three targeted source-file edits **plus** write targeted unit/E2E tests for each behavioral change.

- **Effort**: M
- **Risk**: Low
- **Trade-off**: More files to write, but the Howler mock and Jest infrastructure are already in place, keeping effort manageable. Satisfies Iron Law 4.

---

## Approach Decision

**Chosen: Approach B**

The Iron Laws mandate that every new behavior has at least one test. All three changes introduce new runtime behavior (error flag reset, visibility listener, viewport correction), and the project already has comprehensive test infrastructure (Jest + `@testing-library/react`, `src/__mocks__/howler.ts`, Playwright). Writing the tests is low-risk, keeps CI meaningful, and future-proofs against regressions.

---

## Files to Modify

### 1. `src/lib/audio.ts` (107 → ~121 lines)

**Problem**: `this.error = true` is set inside `onloaderror` and never cleared. Every subsequent call to `playWordEn` or `playWord` creates a new Howl via `getOrCreate`, but the Howl for the _previously failed path_ is still in the cache in an error state. New paths would work, but the error flag is never communicated as a block — the real issue is the stale cached Howl for the broken path.

**Fix**:
- In `playWordEn`: Before calling `getOrCreate`, if `this.error` is set **and** the path is in cache, unload + delete the stale entry. Then always reset `this.error = false`.
- In `playWord`: Same pattern, but for both `enPath` and `zhPath` (using `forEach`). Reset `this.error = false` before setting `this.isPlaying = true`.

**Line count after**: ~121 (task requires < 200 ✓)

### 2. `src/components/HomeScreen.tsx` (145 → ~155 lines)

**Problem**: The `useEffect` uses an inline IIFE to fetch data only on mount. After a session completes and the user switches back to the home tab, `visibilityState` changes to `'visible'` but no re-fetch occurs.

**Fix**:
- Extract the IIFE body into a named `fetchData` async function inside the `useEffect`.
- Call `fetchData()` immediately (replaces the IIFE call).
- Add `document.addEventListener('visibilitychange', handleVisibilityChange)` where `handleVisibilityChange` calls `fetchData()` only when `document.visibilityState === 'visible'`.
- Return a cleanup function that calls `document.removeEventListener('visibilitychange', handleVisibilityChange)`.

**Line count after**: ~155 (under the 200-line sanity check enforced on `src/components/` ✓)

### 3. `playwright.config.ts` (29 → 29 lines)

**Problem**: `projects[0].use: { ...devices['Desktop Chrome'] }` expands to `{ viewport: { width: 1280, height: 720 }, ... }`, which overrides the global `use.viewport: { width: 375, height: 667 }`. Every E2E test that relies on mobile layout is silently running at desktop resolution.

**Fix**: Replace `{ ...devices['Desktop Chrome'] }` with `{}`. The global `use` block already configures `viewport: { width: 375, height: 667 }`, which is now uncontested.

---

## Files to Create

### 4. `src/__tests__/audio.test.ts`

Unit tests for the AudioManager error-reset behavior:

- `playWordEn resets error flag before new attempt`
- `playWordEn evicts stale cache entry when error was set`
- `playWordEn does not evict cache when no prior error`
- `playWord resets error flag before new attempt`
- `playWord evicts both en and zh cache entries when error was set`

Uses the existing `src/__mocks__/howler.ts` mock (auto-resolved by Jest via `moduleNameMapper` or `automock`).

### 5. `src/__tests__/HomeScreen.test.tsx`

Unit tests for the visibility change behavior:

- `fetches data on initial mount`
- `re-fetches when visibilityState becomes visible`
- `does not re-fetch when visibilityState becomes hidden`
- `removes visibilitychange listener on unmount`

Mocks: `@/hooks/useDB`, `@/lib/db` (`getSetting`, `getAllSessions`), `next/link`, `framer-motion`.

### 6. `tests/e2e/viewport.spec.ts`

Playwright test:

- `viewport is 375×667` — asserts `page.viewportSize()` equals `{ width: 375, height: 667 }`

This is the definitive regression guard against the Desktop Chrome override returning.

---

## Production-Readiness Checklist

1. **Persistence** — N/A. These changes are runtime behavior fixes. Data persistence is unchanged; `getAllSessions` and `getSetting` read from the existing IndexedDB store.

2. **Error handling** — `playWordEn` already has a `try/catch`; `playWord` already has `loaderror` callbacks on both Howl instances. `HomeScreen.fetchData` already has a `try/catch` with `console.warn`. No new error paths are introduced by any of these changes.

3. **Input validation** — N/A. No user input is involved in any of the three changes.

4. **Loading states** — N/A. The HomeScreen visibility refresh is a silent background re-fetch (no spinner needed for a word-count update). The existing initial-load pattern (no explicit loading indicator for `todayWords`) is unchanged.

5. **Empty states** — `todayWords` defaults to `0`; the template already renders "今日: 0个词" for zero. No change required.

6. **Security** — N/A. No API keys, tokens, or user-controlled values are involved.

7. **Component size** — `HomeScreen.tsx` grows from 145 to ~155 lines (well under the 200-line sanity limit). `audio.ts` grows from 107 to ~121 lines (under the 200-line task requirement).

8. **Test coverage** — Three new test files covering the happy path, error scenarios, and edge cases for each behavioral change. See "Files to Create" above.

---

## Implementation Order

| Step | Action |
|------|--------|
| 1 | `git checkout -b af/187-task-p2-infrastructure-fixes-audiomanage/1` |
| 2 | Edit `src/lib/audio.ts` |
| 3 | Edit `src/components/HomeScreen.tsx` |
| 4 | Edit `playwright.config.ts` |
| 5 | Write `src/__tests__/audio.test.ts` |
| 6 | Write `src/__tests__/HomeScreen.test.tsx` |
| 7 | Write `tests/e2e/viewport.spec.ts` |
| 8 | Run `npm test` — verify all Jest unit tests pass |
| 9 | Commit, push, write `.af/tasks/187/pr-body.md` |
