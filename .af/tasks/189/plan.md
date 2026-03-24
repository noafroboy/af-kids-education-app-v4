# Task 189 — Integration Verification: Full Audit Plan

## Assumption Audit

**Assumptions made:**
- All P1/P2 fixes from Tasks 0–5 are already integrated into this branch; this task only verifies and fixes remaining gaps.
- "Zero act() warnings" means the test runner output must contain no lines matching the `act()` warning pattern.
- Fixing test files (not source code) is in scope — the warnings are a test infrastructure issue, not a product bug.

**What the task does NOT specify:**
- It does not specify whether the act() fix should be in the tests or in the source code. Default chosen: **fix the tests**, since source code is correct.
- It does not specify whether to use `fakeTimers` or `act()` for the setTimeout fix. Default chosen: **`act(async () => {...})`** — less invasive, same test structure.

**Risks & Open Questions:**
- Could wrapping `render()` in `act()` change the execution order of assertions? Unlikely — all waitFor assertions remain in place.
- Will `await act(async () => {})` (empty flush) reliably drain all microtasks? Yes — documented React Testing Library pattern.

---

## Verification Status (Pre-Fix)

| Check | Command | Status |
|-------|---------|--------|
| FlipCard minWidth/minHeight = 88 | `grep -n 'minWidth\|minHeight' FlipCard.tsx` | ✅ PASS |
| No component > 200 lines | `wc -l src/**/*.tsx | sort -rn | head` | ✅ PASS (max: GuidedSession 187 lines) |
| No hardcoded API keys | `grep -r 'sk-' src/ scripts/` | ✅ PASS |
| No orphaned zh/ audio files | `ls public/audio/zh/ \| grep bizi\|fense...` | ✅ PASS |
| Song files exist | `ls public/audio/songs/` | ✅ PASS (3 songs) |
| apple.png is 512px | `sips -g pixelHeight apple.png` | ✅ PASS |
| /parent/dashboard imports useParentAuth | `grep -l 'useParentAuth' dashboard/page.tsx` | ✅ PASS |
| /parent/settings imports useParentAuth | `grep -l 'useParentAuth' settings/page.tsx` | ✅ PASS |
| playwright.config.ts no Desktop Chrome | `grep 'Desktop Chrome' playwright.config.ts` | ✅ PASS |
| audio.ts error reset in playWord | `grep -n 'this.error = false' audio.ts` | ✅ PASS (line 54) |
| audio.ts error reset in playWordEn | same grep | ✅ PASS (line 85) |
| parent/page.tsx sets sessionStorage | `grep 'parentAuthed' parent/page.tsx` | ✅ PASS (line 52) |
| Session route is functional | inspect `/session/page.tsx` | ✅ PASS (GuidedSession, no Coming Soon) |
| TypeScript: 0 errors | `npx tsc --noEmit` | ✅ PASS |
| All 207 tests pass | `npm test` | ✅ PASS |
| Zero act() warnings | `npm test 2>&1 \| grep act()` | ❌ **FAIL** |

---

## Root Cause Analysis — act() Warnings

Two distinct warning sources, both in test files:

### Warning 1 — `setDigits` in PinPad.tsx
**File**: `src/__tests__/PinPad.test.tsx` (lines 35, 50)

```tsx
// PinPad.tsx line 31-34:
if (next.length === 4) {
  setTimeout(() => {
    onSubmit(next.join(''));
    setDigits([]);   // ← state update inside setTimeout
  }, 100);
}

// Test uses:
await new Promise((r) => setTimeout(r, 200));  // not wrapped in act()
```

The `setDigits([])` call fires 100ms after the 4th digit is pressed, inside a raw `setTimeout`. The test waits 200ms with a raw Promise — not wrapped in `act()` — so React's scheduler sees the state update as happening outside any test boundary.

### Warning 2 — `setPinHash` in parent/page.tsx
**File**: `src/__tests__/ParentPin.test.tsx` (line 27 of source)

```tsx
// parent/page.tsx useEffect:
const stored = await getSetting(db, 'pinHash');
setPinHash(String(stored?.value ?? ''));  // ← async state update

// Test: render() kicks off useEffect → getSetting → setPinHash
// But setPinHash happens in a microtask after the test's synchronous render call
render(<ParentPage />);
await waitFor(() => expect(mockGetSetting).toHaveBeenCalled());
// ^ waitFor wraps its assertion in act, but setPinHash happens BEFORE waitFor runs
```

---

## Approach Alternatives

### APPROACH A: Conservative — Fix tests only
- **What**: Add `act` from `@testing-library/react` to two test files. Wrap async state-update triggers in `act()`.
- **Effort**: S
- **Risk**: Low
- **Trade-off**: Touching test files only; zero risk to production code. The `setTimeout` in PinPad.tsx stays as-is (providing the 100ms "all 4 dots filled" UX).

### APPROACH B: Ideal — Fix source code to avoid setTimeout-based state updates
- **What**: Refactor `PinPad.tsx` to call `onSubmit` synchronously when 4 digits are entered, then use `useEffect` to reset digits after `onSubmit` runs. For the `setPinHash` issue, refactor `parent/page.tsx` to use a controlled loading state.
- **Effort**: M
- **Risk**: Medium (could break the visual 100ms delay UX, and requires updating tests)
- **Trade-off**: Better architecture but higher blast radius; UX change is a side effect.

## Approach Decision: **APPROACH A (Conservative)**

**Reason**: The act() warnings are exclusively a test infrastructure concern. The source code works exactly as intended — the 100ms PinPad delay is a deliberate UX choice, and the async PIN hash loading is correct behaviour. Fixing the tests to properly communicate async boundaries to React is the minimal, zero-risk change.

---

## Production-Readiness Checklist

1. **Persistence** — N/A. This task only modifies test files. All production data persistence (IndexedDB) was verified PASS in earlier tasks and confirmed by audit.

2. **Error handling** — N/A. Production error handling already in place and verified. Every API route/DB call already has try/catch with user-facing messages (confirmed by audit).

3. **Input validation** — N/A. No user input surfaces changed.

4. **Loading states** — N/A. No async UI operations changed.

5. **Empty states** — N/A. No UI components changed.

6. **Security** — N/A. No API keys found in src/ or scripts/. Parent auth (sessionStorage + PIN hash) confirmed working.

7. **Component size** — N/A. All files verified under 200 lines (max: GuidedSession.tsx at 187 lines). No extraction needed.

8. **Test coverage** — The fix improves existing test quality by removing false-positive test patterns (raw setTimeout in tests). Zero tests deleted. All 207 tests continue to pass.

---

## Implementation Steps

### Step 1 — Create Branch
```bash
git checkout -b af/189-task-integration-verification-full-audit/1
```

### Step 2 — Fix `src/__tests__/PinPad.test.tsx`
- Add `act` to import: `import { render, screen, fireEvent, act } from '@testing-library/react';`
- In `it('calls onSubmit after 4 digits')`: replace `await new Promise((r) => setTimeout(r, 200))` with `await act(async () => { await new Promise((r) => setTimeout(r, 200)); })`
- In `it('backspace removes last digit')`: same replacement

### Step 3 — Fix `src/__tests__/ParentPin.test.tsx`
- Add `act` to import: `import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';`
- In every test that calls `render(<ParentPage />)`:
  - Add `await act(async () => {});` immediately after `render(...)` to flush the useEffect → getSetting → setPinHash chain
  - Change synchronous `it(...)` callbacks to `async`
- Replace every `await new Promise((r) => setTimeout(r, 200))` with `await act(async () => { await new Promise((r) => setTimeout(r, 200)); })`

### Step 4 — Verify
```bash
npm test -- --passWithNoTests 2>&1 | grep -E "act\(\)|Tests:|Test Suites:"
npx tsc --noEmit
```
Expect: 0 act() warnings, 207 tests pass, 0 TypeScript errors.

### Step 5 — Write Integration Report
Write `.af/tasks/189/integration-report.md` with final PASS/FAIL for all 15 checks.

### Step 6 — Commit & Push
```bash
git add src/__tests__/PinPad.test.tsx src/__tests__/ParentPin.test.tsx .af/tasks/189/
git commit -m "fix(tests): eliminate act() warnings in PinPad and ParentPin test suites"
git push origin af/189-task-integration-verification-full-audit/1
```
