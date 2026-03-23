## Summary
- Built Listen & Find activity with audio playback, age-adaptive grid (3 cards for age ≤3, 4 for age ≥4), correct/incorrect Framer Motion animations, 2-wrong-attempt reveal flow, and IndexedDB progress recording
- Built Matching Pairs activity with CSS 3D flip cards (perspective-1000, rotateY 400ms), match detection with isFlipping guard, star rating (3/2/1 based on wrong flips vs board size), and session recording
- Both activities record progress to IndexedDB via updateWordProgress and recordSession; updateWordProgress now uses a readwrite transaction to prevent concurrent write races

## Changes
- `src/components/activities/ChoiceCard.tsx`: new sub-component — image-only choice card with idle/correct/wrong/reveal animation states
- `src/components/activities/ListenAndFind.tsx`: new component — core Listen & Find round logic and layout
- `src/app/activities/listen-find/page.tsx`: replaced stub with full implementation (DB loading, age/name settings, CelebrationOverlay integration)
- `src/components/activities/FlipCard.tsx`: new sub-component — CSS 3D flip card (front panda back, EN content back, ZH content back)
- `src/components/activities/MatchingPairs.tsx`: new component — core Matching Pairs board logic and layout
- `src/app/activities/matching-pairs/page.tsx`: replaced stub with full implementation
- `src/lib/progress.ts`: updateWordProgress refactored to use IDB readwrite transaction
- `src/lib/audio.ts`: added playWordEn(path) fire-and-forget method
- `src/hooks/useAudio.ts`: exposed playWordEn from AudioManager
- `src/components/ui/CelebrationOverlay.tsx`: added optional stars prop (default 3) for MatchingPairs star rating display

## Testing
- Unit tests for ListenAndFind: renders container, 3/4 choice cards by age, progress bar testid, audio on mount, correct tap calls updateWord, wrong tap skips updateWord, incorrect SFX played, 2-wrong reveals bilingual text, reveal skips updateWord, onComplete fires
- Unit tests for MatchingPairs: renders container, 6/8 flip cards by age, matched card testid, double-tap guard, matched card tap guard, updateWord on match, mismatch revert after timeout, onComplete mechanism
- TypeScript compilation: zero errors
- ESLint: zero warnings or errors
- Total test suite: 74 tests passing across 9 test suites
