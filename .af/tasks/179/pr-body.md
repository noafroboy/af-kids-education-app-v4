## Summary
- Adds the complete guided session flow — the app's core daily learning ritual — walking children through a panda greeting, mood check-in, 3 vocabulary words, and a celebration screen, with the full session saved to IndexedDB.
- Introduces the MascotIdle animated panda (inline SVG with Framer Motion float + blink) that lives in the bottom-left corner of all child activity screens, showing a speech bubble after 30 s of inactivity and navigating home after 60 s.
- Delivers reusable `MoodCheck` and `CategorySelector` components and the `useIdleTimeout` hook that powers the idle behavior wired into `ChildLayout`.

## Changes

### New files
- `src/hooks/useIdleTimeout.ts` — window `pointerdown`/`pointermove`/`keydown` listeners fire `onIdle30` (30 s) and `onIdle60` (60 s); disabled via `enabled=false` on home screen; cleaned up on unmount
- `src/components/ui/MascotIdle.tsx` — inline SVG panda face, Framer Motion float animation (2.2 s loop), blink every 3 s, `showBubble` speech bubble with AnimatePresence, `size` prop (sm 56 px / md 96 px / lg 140 px)
- `src/components/MoodCheck.tsx` — three ≥96 px emoji buttons (😊😐😴) with whileTap animation and bilingual labels; calls `onMoodSelected(MoodType)` immediately on tap
- `src/components/CategorySelector.tsx` — 2-column grid of category tiles (emoji, EN/ZH label, word count badge) plus an "All Categories" tile; calls `onSelect(Category | 'all')`
- `src/components/session/GreetingStep.tsx` — MascotIdle lg + bilingual heading + 3 s auto-advance timer + Let's Go button (extracted to keep GuidedSession under 150 lines)
- `src/components/GuidedSession.tsx` — 4-step AnimatePresence flow (Greeting → MoodCheck → ExploreCards → CelebrationOverlay); fetches ≤3 unmastered words from IndexedDB (fallback to all words); records `guidedSession` with mood + wordIds to IndexedDB via `useProgress.saveSession`

### Modified files
- `src/components/layouts/ChildLayout.tsx` — wires `useIdleTimeout` (idle30 → show mascot bubble, idle60 → `router.push('/')`); renders `MascotIdle` bottom-left on non-home screens; clears bubble on any pointer event
- `src/app/session/page.tsx` — replaces coming-soon placeholder with `'use client'` page wrapping `GuidedSession` in `ChildLayout`
- `src/components/activities/ExploreCards.tsx` — adds optional `onComplete?: () => void` prop; when provided, calls it on last card instead of running internal `saveSession`+`setComplete` (existing tests unaffected)

### Tests
- `src/__tests__/useIdleTimeout.test.ts` — 5 cases: disabled no-op, 30 s callback, 60 s callback, reset on pointerdown, cleanup on unmount
- `src/__tests__/MascotIdle.test.tsx` — 8 cases: renders, SVG present, size props, speech bubble show/hide, onClick fires
- `src/__tests__/MoodCheck.test.tsx` — 7 cases: renders, bilingual heading, 3 buttons, each calls correct MoodType, min-size assertion
- `src/__tests__/CategorySelector.test.tsx` — 7 cases: renders, All tile, category tiles, emoji/counts, onSelect callbacks, empty state
- `src/__tests__/GuidedSession.test.tsx` — 8 cases: greeting initial render, proceed button, bilingual text, click advance, 3 s auto-advance, mood → explore step, whoosh effect on mount, mood-check step present

## Testing
- `npm test` — 125 tests pass, 0 failures across 15 suites
- `npx tsc --noEmit` — zero TypeScript errors
- `npx next lint` — zero ESLint warnings or errors
- `npx next build` — clean build, `/session` route produced at 4.24 kB
