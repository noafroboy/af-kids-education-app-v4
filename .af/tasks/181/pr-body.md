## Summary

- Adds Playwright E2E test suite covering all 4 critical user journeys (onboarding, guided session, free-play activities, parent dashboard) plus cross-cutting sanity checks — all 15 tests pass in under 20 seconds
- Fixes 5 bugs discovered during integration verification: missing `data-testid` attributes, two HomeScreen tap targets below 88px, and SongPlayer.tsx exceeding the 200-line component limit
- Proves IndexedDB persistence: reloading after onboarding completion shows the home screen (not onboarding) confirming data survives page refresh

## Changes

**New files:**
- `playwright.config.ts` — Playwright config: Chromium only, 375×667 viewport (iPhone SE), 30s timeout, `webServer` pointing to `npm run dev`
- `tests/e2e/helpers/seed-db.ts` — Helper that initializes IndexedDB with test credentials (PIN hash for '1234', child name 'TestChild', dummy session for streak-calendar visibility)
- `tests/e2e/onboarding.spec.ts` — Full onboarding flow + IndexedDB persistence reload test
- `tests/e2e/session.spec.ts` — Guided session: greeting → mood → explore cards → celebration overlay
- `tests/e2e/free-play.spec.ts` — All 4 activity routes navigate and render correctly
- `tests/e2e/parent-dashboard.spec.ts` — PIN gate: wrong PIN shows error, correct PIN shows dashboard with streak + word detail
- `tests/e2e/sanity.spec.ts` — Static checks (no hardcoded keys, no oversized components) + browser checks (activity routes, aria-labels, tap targets ≥88px)
- `src/components/activities/SongLyricsPanel.tsx` — Extracted from SongPlayer to bring SongPlayer under 200 lines

**Modified files:**
- `src/components/onboarding/StepAge.tsx` — Added `data-testid="onboarding-next"` to Next button
- `src/components/ui/PinPad.tsx` — Added `data-testid="pin-pad"` to outer wrapper div
- `src/components/HomeScreen.tsx` — Fixed `start-session-btn` (`min-h-[64px]` → `min-h-[88px]`) and `parent-icon` (`w-12 h-12` → `w-[88px] h-[88px]`) tap targets
- `src/components/activities/SongPlayer.tsx` — Refactored to use `SongLyricsPanel` (now 185 lines, down from 235)
- `package.json` — Added `test:e2e` script and `@playwright/test` dev dependency

## Testing

- `npx playwright test` — 15/15 tests pass in 19.7s (limit: 90s) ✅
- `npm test` — 178/178 Jest unit tests pass, no regressions ✅
- `npx tsc --noEmit` — Zero TypeScript errors ✅
- All 4 activity routes verified to render non-empty content at 375px viewport
- IndexedDB persistence verified: page.reload() after onboarding shows home screen with child name
- Parent dashboard PIN flow: wrong PIN → "Wrong PIN (N/3)" error, correct PIN → dashboard redirect
