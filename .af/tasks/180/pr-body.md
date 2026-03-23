## Summary
- Builds the complete parent area: PIN-entry gate, progress dashboard, and settings page — the secondary user flow for parents to monitor their child's learning progress.
- Implements reusable UI primitives (StreakCalendar, WordListRow, WordDetailSheet, ParentLayout) and a multi-step ChangePinSection component to keep all files under the 150-line limit.
- All data is sourced from real IndexedDB records via existing `getAllWords`, `getAllProgress`, `getAllSessions`, and `getWeeklyStats` helpers, with no in-memory primary stores.

## Changes

### New components
- `src/components/layouts/ParentLayout.tsx` — indigo header with bilingual back-to-home link and optional right slot, slate-50 body, max-w-lg centered
- `src/components/ui/StreakCalendar.tsx` — 7-day calendar row showing session activity as coral filled circles, with today highlighted via ring border
- `src/components/ui/WordListRow.tsx` — word list item with 48×48 thumbnail, bilingual text, and color-coded mastery badge pill
- `src/components/ui/WordDetailSheet.tsx` — Framer Motion slide-up bottom sheet with 192×192 image, bilingual text, separate EN/ZH audio buttons, and progress stats
- `src/components/parent/ChangePinSection.tsx` — multi-step PIN change flow (verify current → enter new → save hash) extracted to keep settings under 150 lines

### New pages
- `src/app/parent/page.tsx` — PIN gate with shake on error, wrong-attempt counter, "Forgot PIN" button after 3 failures, reset-all-progress modal, and redirect to dashboard on success
- `src/app/parent/dashboard/page.tsx` — loading skeleton, empty state (no sessions), weekly stats header, StreakCalendar, category filter tabs, scrollable word list, and WordDetailSheet on tap
- `src/app/parent/settings/page.tsx` — child profile editor (name + age tiles), Change PIN section, and Reset Progress with Framer Motion confirm dialog

### DB additions
- `src/lib/db.ts` — added `clearProgress()` and `clearSessions()` helpers used by the PIN-reset and settings-reset flows

### Tests
- `src/__tests__/ParentLayout.test.tsx` — renders, back link, title, right slot
- `src/__tests__/ParentPin.test.tsx` — correct PIN navigates, wrong PIN error, 3-attempt lockout, forgot/reset flow
- `src/__tests__/ParentDashboard.test.tsx` — loading skeleton, empty state, stats, streak calendar, category filter, WordDetailSheet open/close, settings link
- `src/__tests__/WordDetailSheet.test.tsx` — renders, bilingual text, close button/backdrop, EN/ZH audio buttons, mastery stats
- `src/__tests__/StreakCalendar.test.tsx` — 7 circles, today ring, active fill, day labels
- `src/__tests__/ParentSettings.test.tsx` — pre-fill from DB, save profile, save confirmation, change PIN section, reset confirm/cancel

## Testing
- `npm test` — 178 tests pass (21 suites), 0 failures
- `npx tsc --noEmit` — 0 TypeScript errors
- `npm run lint` — 0 ESLint warnings or errors
- `npm run build` — clean production build, all 11 routes compiled successfully
