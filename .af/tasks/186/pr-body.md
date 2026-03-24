## Summary
- Fixes the broken SongPlayer retry button by using a `retryCount` state that, when incremented, re-triggers the Howl `useEffect` to create a fresh audio instance rather than just clearing error flags.
- Extracts `SongCoverArt` and `SongPlayerControls` sub-components from `SongPlayer`, reducing it from 185 to 165 lines (under the 200-line limit).
- Adds greeting audio to `GreetingStep` — when a learning session starts, the child hears "hello" within 1 second of the screen rendering.

## Changes

### New files
- `src/components/activities/SongCoverArt.tsx` — cover art image with 🎵 emoji fallback on load error
- `src/components/activities/SongPlayerControls.tsx` — play/pause button + inline error UI (error message, retry button, back button)

### Modified files
- `src/components/activities/SongPlayer.tsx` — adds `retryCount` state; Howl `useEffect` depends on `retryCount` so retry creates a fresh Howl; removes `imgError` state (moved to `SongCoverArt`); removes early-return error block; uses `<SongCoverArt>` and `<SongPlayerControls>`; now 165 lines
- `src/components/session/GreetingStep.tsx` — imports `audioManager` and adds a mount `useEffect` calling `audioManager.playWordEn('/audio/en/hello.mp3')`
- `src/__tests__/SongTime.test.tsx` — adds 3 new tests: retry creates a new Howl instance, play button is disabled after retry, GreetingStep calls `playWordEn` on mount

## Testing
- All 194 tests pass across 23 test suites (`npm test`)
- TypeScript reports zero errors (`npx tsc --noEmit`)
- ESLint reports zero errors (only pre-existing warnings in unrelated files)
- Manually confirmed `public/audio/en/hello.mp3` exists before adding the audio call
