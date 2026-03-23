## Plan Summary
Files to modify: [object Object], [object Object], [object Object], [object Object], [object Object]
Files to create: [object Object], [object Object], [object Object], [object Object], [object Object]
Approach: conservative
Steps:
- 1. Add playCount?: number to Song interface in src/types/index.ts
- 2. Replace songs-seed.ts with 3 nursery rhymes having full lyrics, Ms timestamps, and valid highlightWordIds
- 3. Add getAllSongs() and putSong() to db.ts
- 4. Add seek(), pause(), duration() to Howl mock in __mocks__/howler.ts
- 5. Create WordChip.tsx (~40 lines)
- 6. Create SongPicker.tsx (~80 lines) with cover tiles, EN+ZH, play-count badges
- 7. Create SongPlayer.tsx (~145 lines) with Howler setup, RAF sync, lyric display, word chip handlers, song-end banner
- 8. Create SongTime.tsx (~80 lines) as picker/player orchestrator
- 9. Replace song-time/page.tsx with client page that loads songs+vocabulary, renders SongTime
- 10. Write SongTime.test.tsx covering all required scenarios
- 11. Run npm test to verify all tests pass