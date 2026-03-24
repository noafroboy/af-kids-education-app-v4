# Task 185 Plan: Parent Area Security & UX

## Overview
This task fixes 4 P1 parent-area issues:
1. No PIN guard on direct URL navigation to `/parent/dashboard` and `/parent/settings`
2. Missing child name in dashboard page title
3. Silent failure when no PIN is set (`pinHash` is empty)
4. Missing error feedback when changing PIN fails in `ChangePinSection`

---

## Assumption Audit

### Assumptions Made
- **sessionStorage scope**: The task specifies sessionStorage for auth; it is session-scoped (cleared on browser tab close), which is appropriate for a PIN gate — each new session requires re-authentication.
- **`if (!isAuthed) return null`**: Rendering nothing during redirect is acceptable UX since the redirect happens synchronously in `useEffect` (near-instant on client).
- **Empty pinHash + `onboardingComplete=true`**: The task spec provides a code snippet for this case. I assume "onboarding complete but no PIN" is treated as an error state with the message `'No PIN set. Please complete onboarding. / 请先完成引导设置。'`.
- **childName title format**: `"{name}'s Progress / {name}的进度"` for non-empty name, `'Parent Dashboard / 家长面板'` for empty/null. This matches the task spec exactly.
- **ParentLayout title on loading skeleton**: The task says to apply the title update to both loading skeleton and main render. The loading skeleton currently has no `title` prop (uses default). We'll add `title` to both renders.
- **Test mocking strategy**: Components using `useParentAuth` in existing tests will need `jest.mock('@/hooks/useParentAuth', ...)` returning `{ isAuthed: true }` to avoid redirect during tests.

### What the Task Does NOT Specify
- Does not specify a loading indicator during the `isAuthed` check — `return null` is the spec.
- Does not specify whether to redirect with `router.replace` or `router.push` from useParentAuth — spec says `router.replace` (non-history push).
- Does not specify test coverage for the empty-pinHash onboarding redirect branch — will test the error message path.

### Risks & Open Questions
1. **`ParentDashboard.test.tsx` mock gap**: The current db mock doesn't include `getSetting`. After adding `getSetting` to the Promise.all, the test mock must be updated. Risk: if `getSetting` is called but not mocked, the test hangs or fails.
2. **Files already over 150 lines**: `settings/page.tsx` is 159 lines, `dashboard/page.tsx` is 153 lines. Adding a few lines pushes them further over. Per task rules, we don't refactor outside scope — acceptable.
3. **Race condition in useParentAuth**: `useEffect` runs after first render, meaning there's one render cycle where `isAuthed=false` before the redirect fires. The `return null` guard ensures no content flash.

---

## Approach Alternatives

### APPROACH A: Conservative — Exact specification implementation
Implement exactly what the task description specifies. Create `useParentAuth.ts`, modify the 4 existing files per the precise code snippets provided. No structural changes beyond what's needed.
- **Effort**: S
- **Risk**: Low
- **Trade-off**: Minimal blast radius; all changes are surgical. Does not future-proof auth (e.g., if more protected pages are added later, each needs manual hook addition).

### APPROACH B: Ideal — Middleware-based route protection
Use Next.js middleware (`middleware.ts`) to check auth server-side and redirect unauthenticated users at the edge, eliminating the flash-of-unauthenticated-content entirely. Would require moving auth state to a cookie instead of sessionStorage.
- **Effort**: L
- **Risk**: High (architectural change, cookie-based auth, risk of breaking existing flow)
- **Trade-off**: True server-side route protection, no content flash, scales to many routes. But requires a larger architectural change and changes the auth storage mechanism.

## Approach Decision
**Chosen: Approach A (Conservative)**

Reasoning: The task description provides exact code snippets for each change. The sessionStorage-based approach is intentional for this app (a local educational tool, not a server-deployed app). Approach B would be over-engineering for a client-only app using IndexedDB. The risk of breaking existing functionality with an architectural change is not justified. Approach A delivers all 4 required fixes with minimal risk.

---

## Files to Create

### `src/hooks/useParentAuth.ts` (~20 lines)
New hook per exact spec. Reads `sessionStorage.getItem('parentAuthed') === '1'` in useEffect; calls `router.replace('/parent')` if absent, sets `isAuthed=true` if present.

### `src/__tests__/useParentAuth.test.ts` (~60 lines)
Tests:
- Returns `isAuthed: false` initially and redirects when sessionStorage flag absent
- Returns `isAuthed: true` when flag is `'1'`

### `src/__tests__/ChangePinSection.test.tsx` (~90 lines)
Tests:
- Renders verify step initially
- Shows error on wrong PIN during verify
- Moves to newPin step on correct PIN
- Shows done state after successful PIN save
- Shows error message when save fails (mocked DB error)

---

## Files to Modify

### `src/app/parent/page.tsx`
**Change 1**: In `handlePinSubmit`, add `sessionStorage.setItem('parentAuthed', '1')` before `router.replace('/parent/dashboard')` in the `ok === true` branch.

**Change 2**: Replace `if (!pinHash) return;` with a block that:
- If `db` is available: checks `onboardingComplete` setting, redirects to `/onboarding` if not complete
- Sets `setErrorMsg('No PIN set. Please complete onboarding. / 请先完成引导设置。')` as fallback

### `src/app/parent/dashboard/page.tsx`
**Change 1**: Add `import { useParentAuth } from '@/hooks/useParentAuth'` and call the hook. Add `if (!isAuthed) return null` before the loading state.

**Change 2**: Add `const [childName, setChildName] = useState('')` state.

**Change 3**: Add `getSetting(db as never, 'childName')` to the `Promise.all` call and handle the result.

**Change 4**: Update both `<ParentLayout>` renders (loading skeleton + main) to use the `title` prop: `childName ? \`${childName}'s Progress / ${childName}的进度\` : 'Parent Dashboard / 家长面板'`.

**Note**: Must also add `getSetting` to the import from `@/lib/db`.

### `src/app/parent/settings/page.tsx`
**Change 1**: Add `import { useParentAuth } from '@/hooks/useParentAuth'` and call the hook. Add `if (!isAuthed) return null` before the existing return.

### `src/components/parent/ChangePinSection.tsx`
**Change 1**: In `handleNewPin` catch block, add `setErrorMsg('Failed to save new PIN / 保存失败')` after the `console.error` call.

### `src/__tests__/ParentPin.test.tsx`
- Add sessionStorage mock setup
- Add test: verifies `sessionStorage.setItem('parentAuthed', '1')` called on correct PIN
- Add test: shows error message when `pinHash` is empty

### `src/__tests__/ParentDashboard.test.tsx`
- Add `jest.mock('@/hooks/useParentAuth', () => ({ useParentAuth: () => ({ isAuthed: true }) }))`
- Add `mockGetSetting` to the `@/lib/db` mock
- Configure `mockGetSetting` to return `{ key: 'childName', value: 'Emma' }` by default
- Add test: shows `"Emma's Progress"` in title when childName is set
- Add test: shows `'Parent Dashboard'` in title when childName is empty

### `src/__tests__/ParentSettings.test.tsx`
- Add `jest.mock('@/hooks/useParentAuth', () => ({ useParentAuth: () => ({ isAuthed: true }) }))`

---

## Production-Readiness Checklist

1. **Persistence** — Auth flag uses `sessionStorage` (intentionally session-scoped; survives navigation within the same tab but not a new tab/session). Child name is read from IndexedDB (already persisted). No new in-memory-only stores introduced. ✅

2. **Error handling** — All new paths have error handling:
   - Empty `pinHash` → user-visible bilingual error message (or redirect to onboarding)
   - `ChangePinSection` save failure → `setErrorMsg('Failed to save new PIN / 保存失败')` shown in red
   - `useParentAuth` redirect is silent (no error needed — it's a navigation action)
   ✅

3. **Input validation** — No new user input is added in this task. Existing PIN validation is unchanged. N/A — no new inputs.

4. **Loading states** — `useParentAuth` returns `isAuthed: false` initially; components render `null` while the redirect fires (one render cycle). This is the spec-defined approach and is near-instantaneous. No spinner needed for an auth redirect. ✅

5. **Empty states** — Child name empty → falls back to `'Parent Dashboard / 家长面板'` without crash. Covered by test. ✅

6. **Security** — PIN hash remains SHA-256 + salt, unchanged. sessionStorage is cleared automatically on tab close (session-scoped). No API keys or secrets introduced. `sessionStorage` is appropriate for a locally-run educational app with PIN-based parent gating. ✅

7. **Component size** — `settings/page.tsx` is already 159 lines; adding ~4 lines brings it to ~163. `dashboard/page.tsx` is 153 lines; adding ~10 lines brings it to ~163. Both exceed the 150-line guideline, but the task explicitly states "Do not refactor code outside the scope of this task." These files were already over the limit before this task. Extraction is out-of-scope here. ⚠️ (pre-existing issue, not introduced by this task)

8. **Test coverage** — New tests added for:
   - `useParentAuth`: redirect (unauthenticated) + passthrough (authenticated)
   - `ChangePinSection`: error feedback on save failure
   - `ParentPage`: sessionStorage set on correct PIN + error on empty pinHash
   - `ParentDashboard`: childName in title + generic fallback title
   - Existing tests updated to mock `useParentAuth` to keep them passing ✅
