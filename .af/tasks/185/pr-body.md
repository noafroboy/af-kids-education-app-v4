## Summary
- Adds PIN guard hook (`useParentAuth`) that redirects unauthenticated direct URL access to `/parent/dashboard` and `/parent/settings` back to the PIN gate at `/parent`
- Fixes empty PIN hash silent failure: shows error message and redirects to onboarding when no PIN is set
- Adds child name display in dashboard title fetched from settings
- Adds error feedback in `ChangePinSection` when saving a new PIN fails

## Changes
**New files:**
- `src/hooks/useParentAuth.ts` — client hook that checks `sessionStorage.parentAuthed` and redirects if absent
- `src/__tests__/useParentAuth.test.ts` — tests for the hook
- `src/__tests__/ChangePinSection.test.tsx` — tests for error feedback

**Modified files:**
- `src/app/parent/page.tsx` — set sessionStorage flag on successful auth; show error when no PIN is configured
- `src/app/parent/dashboard/page.tsx` — add `useParentAuth` guard; fetch and display child name in title
- `src/app/parent/settings/page.tsx` — add `useParentAuth` guard
- `src/components/parent/ChangePinSection.tsx` — add `setErrorMsg` call in catch block
- `src/__tests__/ParentDashboard.test.tsx` — mock `useParentAuth`; add child name tests
- `src/__tests__/ParentSettings.test.tsx` — mock `useParentAuth`
- `src/__tests__/ParentPin.test.tsx` — add sessionStorage and empty PIN tests

## Testing
- All existing tests continue to pass with `useParentAuth` mocked to return `{ isAuthed: true }`
- New `useParentAuth.test.ts` verifies redirect when unauthenticated and no redirect when authenticated
- New `ChangePinSection.test.tsx` verifies error message appears on save failure
- `ParentPin.test.tsx` verifies sessionStorage flag is set on success and error message shown when no PIN hash
