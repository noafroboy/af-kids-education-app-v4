## Summary
- Builds the Song Time activity (4th core learning activity) with Howler.js audio playback and real-time lyric synchronization
- Adds songs seed data for 3 nursery rhymes (Twinkle Twinkle, Old MacDonald, Head Shoulders Knees and Toes) with Mandarin translations and vocabulary word highlighting
- Implements play count tracking in IndexedDB and graceful error handling for missing audio files

## Changes

### New Components
- `src/components/activities/WordChip.tsx` — vocabulary word bubble with EN+ZH and tap interaction
- `src/components/activities/SongPicker.tsx` — 3-tile song selection screen with cover art, titles, play count badges
- `src/components/activities/SongPlayer.tsx` — full player with Howler.js, RAF lyric sync, word chip interaction, completion banner
- `src/components/activities/SongTime.tsx` — picker/player orchestrator with `data-testid='song-time'`
- `src/app/activities/song-time/page.tsx` — client page loading songs from IndexedDB

### Data Layer
- `src/lib/songs-seed.ts` — 3 nursery rhymes with lyric timestamps, Mandarin translations, vocabulary highlightWordIds
- `src/lib/db.ts` — added `getAllSongs()`, `putSong()`, songs seeded in upgradeCallback
- `src/types/index.ts` — added `playCount?: number` to Song interface

### Testing
- `src/components/activities/__tests__/SongTime.test.tsx` — 16 tests covering picker, player, error state, word chip, completion banner

## Testing
- All 90 tests pass with `npm test` (16 new + 74 existing)
- TypeScript compiles without errors (`npx tsc --noEmit`)
- Missing audio handled gracefully (loaderror event → error state UI, not crash)
- Play counts stored in IndexedDB, badges update on re-visit
