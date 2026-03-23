# Plan: Song Time Activity (Task 178)

## Assumption Audit

### Ambiguities resolved

| Ambiguity | Assumption |
|-----------|-----------|
| `playCount` storage — Song type has no such field | Add `playCount?: number` to the `Song` interface; store in the existing `songs` IndexedDB store. |
| "sky" and "up" are not in vocabulary seed | Use only IDs that exist: `object-star`, `object-moon` for Twinkle; `animal-cow`, `animal-duck` for Old MacDonald; `body-head`, `body-eyes`, `body-ears`, `body-nose` for Head Shoulders. |
| Task description says Old MacDonald highlights "cow/猫" — clear typo | Use `animal-cow` (牛), `animal-duck` (鸭子). |
| "pig" not in vocabulary seed | Skip pig highlight; use `animal-cow` and `animal-duck` only for that song. |
| Cover image for Old MacDonald | Reuse `/images/vocabulary/cow.png` (exists in seed). |
| Cover image for Head Shoulders | Reuse `/images/vocabulary/head.png` (exists in seed). |
| Timestamps for lyrics | Use reasonable nursery-rhyme pacing (~4s per line). Timestamps are approximate; sync is correct once real MP3s are placed. |
| Vocabulary needed for word chips | Page.tsx loads vocabulary via `getAllWords()` and passes to SongTime → SongPlayer, following the same pattern as `listen-find/page.tsx`. |
| DB version bump for new seed | DB stays at version 1. Seed runs on fresh DB creation. Development app — this is acceptable. Comment in seed file explains this. |

### What the task does NOT specify (defaults chosen)

- **Word chip audio delay after song resumes**: Task says "after 2s resume song." Implemented via `setTimeout(resume, 2000)` after the word audio ends — not strictly 2s after tap, but 2s after the word playback completes.
- **Song picker "back" destination**: Goes to `/` (home). ChildLayout provides the home button, but an explicit `← Back` button is added per the requirement.
- **Tile minimum height**: `min-h-[120px]` per requirement.
- **Play button size**: `w-[88px] h-[88px]` per requirement.
- **Loading state in player**: Shows a brief loading indicator while Howler initialises (before error or ready event).

---

## Risks & Open Questions

1. **Audio files are missing** — All three MP3s don't exist. Howler fires `loaderror` immediately. The player must catch this and show a graceful error UI (no crash, no blank screen).
2. **requestAnimationFrame in jsdom** — The RAF-based lyric sync loop won't auto-cycle in tests. RAF is mocked to a no-op; lyric sync is tested by directly advancing state.
3. **scrollIntoView not in jsdom** — Must guard with `?.scrollIntoView?.()`.
4. **Existing v1 IndexedDB** — Users with an existing `littlebridge` v1 DB see the old "Animal Friends" song, not the 3 new songs. Acceptable for a dev app; production would bump DB version and re-seed.
5. **Howler mock missing `seek()` / `pause()`** — Will update `__mocks__/howler.ts` (in-scope because the mock is test infrastructure, not production code).

---

## Approach Alternatives

### Approach A — Conservative (CHOSEN)

**Description**: Follow exactly the patterns of ListenAndFind and MatchingPairs. Page loads data from IndexedDB, passes arrays as props to a top-level component (`SongTime.tsx`). Split into focused sub-components (SongPicker, SongPlayer, WordChip) that stay under 150 lines each. Reuse existing hooks (`useDB`, `useAudio`). Minimal type change: add `playCount?: number` to `Song`.

- **Effort**: M
- **Risk**: Low
- **Trade-off**: Slightly more prop-drilling (vocabulary passed from page → SongTime → SongPlayer), but completely consistent with existing codebase patterns.

### Approach B — Ideal (NOT CHOSEN)

**Description**: Introduce a `useSong()` custom hook that encapsulates Howler lifecycle, RAF sync, play-count updates, and vocabulary lookup. The page and SongTime become very thin. Vocabulary is fetched lazily inside the hook when a song is selected.

- **Effort**: L
- **Risk**: Med (new hook pattern not established in codebase; harder to test in isolation)
- **Trade-off**: Cleaner component API but introduces a new abstraction pattern inconsistent with existing hooks that wrap only the AudioManager singleton.

## Approach Decision

**Chosen: Approach A (Conservative)**

The codebase has a clear, working pattern: page loads data → passes to component → component manages game state. All three existing activities follow it. Introducing a new hook pattern would be scope creep (Iron Law #5) and adds risk for marginal benefit. Approach A produces all required features with maximum confidence.

---

## Production-Readiness Checklist

### 1. Persistence
Song play counts stored in `song.playCount` field on the `Song` record in the IndexedDB `songs` object store. Updated via `putSong(db, {...song, playCount: (song.playCount ?? 0) + 1})` on song completion. Survives page refresh; reads back on next visit to the song picker.

### 2. Error Handling
- **DB load failure** (page.tsx): `try/catch` around `getAllSongs` / `getAllWords`; sets `error=true`; renders bilingual "Could not load songs / 无法加载歌曲" with Go Home button.
- **Audio load failure** (SongPlayer.tsx): Howl `onloaderror` callback sets `audioError=true`; renders `🎵 Song unavailable / 歌曲暂时无法播放` with Retry button. Component does NOT crash.
- **Word audio failure**: `audioManager.playWord()` already swallows errors silently; no additional handling needed.

### 3. Input Validation
N/A — no user text input. Song selection is from a fixed list of DB records. Word chip taps are guarded with `isWordPlaying` flag to prevent concurrent playback.

### 4. Loading States
- Page.tsx shows animated 🐼 panda while `isLoading=true` (same as listen-find pattern).
- SongPlayer shows a brief spinner/loading text until Howler fires `load` or `loaderror`.

### 5. Empty States
- If `songs.length === 0` (should not happen with seed): SongPicker shows "No songs available / 暂无歌曲" message.
- If vocabulary lookup for a `highlightWordId` returns undefined: WordChip falls back gracefully (skips rendering that chip).

### 6. Security
N/A — no API keys, no user-generated input, no LLM. Audio paths come from DB (seeded from SONGS_SEED constant, not user input).

### 7. Component Size
All files planned under 150 lines:
- `WordChip.tsx` ~40 lines
- `SongPicker.tsx` ~80 lines
- `SongTime.tsx` ~80 lines
- `SongPlayer.tsx` ~145 lines
- `song-time/page.tsx` ~85 lines

### 8. Test Coverage
`src/__tests__/SongTime.test.tsx` covers:
- Happy path: renders, picks a song, sees player
- Audio error path: Howl emits `loaderror` → friendly error UI renders, no crash
- Play/pause button exists (`data-testid=song-play-btn`)
- Back button navigates from player to picker
- Song completion banner with "Listen Again" and "Choose Another" buttons
- Word chip renders with `data-testid=word-chip`
- Word chip tap triggers `active` visual state

---

## Detailed Step-by-Step Plan

### Step 1 — Update `src/types/index.ts`
Add `playCount?: number` to `Song` interface. No other changes.

```typescript
export interface Song {
  id: string;
  title: string;
  titleZh: string;
  audioPath: string;
  coverImagePath: string;
  lyrics: LyricLine[];
  playCount?: number;   // <-- NEW: persisted to IndexedDB songs store
}
```

### Step 2 — Replace `src/lib/songs-seed.ts`
Replace the single "Animal Friends" placeholder with 3 nursery rhymes:

**Song 1 — Twinkle Twinkle Little Star / 小星星**
- `audioPath`: `/audio/songs/twinkle.mp3` (file not yet generated — see comment)
- `coverImagePath`: `/images/vocabulary/star.png`
- 6 lyric lines (0–24 000 ms), highlighting `object-star` and `object-moon`

**Song 2 — Old MacDonald Had a Farm / 老麦克唐纳有个农场**
- `audioPath`: `/audio/songs/old-macdonald.mp3`
- `coverImagePath`: `/images/vocabulary/cow.png`
- 12 lyric lines (0–44 500 ms), highlighting `animal-cow` and `animal-duck`

**Song 3 — Head Shoulders Knees and Toes / 头肩膀膝盖脚趾**
- `audioPath`: `/audio/songs/head-shoulders.mp3`
- `coverImagePath`: `/images/vocabulary/head.png`
- 7 lyric lines (0–22 000 ms), highlighting `body-head`, `body-eyes`, `body-ears`, `body-nose`

Top comment: `// NOTE: Audio files at /audio/songs/*.mp3 are not yet generated. Lyric sync will work once files are added. Components handle missing audio gracefully via Howler's loaderror event.`

### Step 3 — Update `src/lib/db.ts`
Add two functions after existing helpers:
```typescript
export async function getAllSongs(db): Promise<Song[]>  { return db.getAll('songs'); }
export async function putSong(db, song: Song): Promise<void> { await db.put('songs', song); }
```

### Step 4 — Update `src/__mocks__/howler.ts`
Add to `Howl` class:
- `pause(): void {}`
- `seek(pos?: number): number { return pos ?? 0; }`
- `duration(): number { return 0; }`
- `volume(v?: number): number | this { return typeof v === 'number' ? this : 1; }`

### Step 5 — Create `src/components/activities/WordChip.tsx`
Tappable pill showing `word.englishWord / word.mandarinWord`. Props: `word: VocabularyWord`, `active: boolean`, `onTap: () => void`. Visual: `scale-110` + `border-[#C7B8EA]` when active.

### Step 6 — Create `src/components/activities/SongPicker.tsx`
Grid of 3 song tiles. Each tile:
- `min-h-[120px]` container
- `next/image` with `onError` fallback to emoji placeholder `🎵`
- Fredoka One title (EN) + Nunito subtitle (ZH)
- Play-count badge: coral pill `{playCount} 🎵`
- `onClick` → `onSelect(song)`

Back button top-left.

### Step 7 — Create `src/components/activities/SongPlayer.tsx`
```
State: playing, audioError, currentLineIndex, activatedWordId, songEnded, audioReady
Ref: howlRef, rafRef, currentLineRef (for scrollIntoView)

Mount effect:
  - new Howl({ src: [song.audioPath], html5: true })
  - howl.on('load', () => setAudioReady(true))
  - howl.on('loaderror', () => setAudioError(true))
  - howl.on('end', handleSongEnd)
  - return () => { howlRef.current?.unload(); cancelAnimationFrame(rafRef.current); }

RAF loop (while playing && !audioError):
  const pos = howlRef.current.seek() * 1000;
  const idx = song.lyrics.findIndex(l => pos >= l.startMs && pos < l.endMs);
  setCurrentLineIndex(idx);
  rafRef.current = requestAnimationFrame(syncLoop);

handlePlayPause():
  if playing → howl.pause(); cancelRaf()
  else → howl.play(); startRaf()

handleWordTap(word):
  howl.pause(); setActivatedWordId(word.id)
  audioManager.playWord(word.audioEnPath, word.audioZhPath).then(() => {
    setTimeout(() => { howl.play(); startRaf(); setActivatedWordId(null); }, 2000)
  })

handleSongEnd():
  setPlaying(false); setSongEnded(true); onSongEnd();

Render:
  if audioError → error UI with Retry
  song title, cover art (128px)
  Play/Pause button (88px coral circle)
  scrollable lyric container:
    song.lyrics.map((line, i) => (
      <div ref={i === currentLineIndex ? currentLineRef : null}>
        <p style={i===currentLineIndex ? coral+xl : slate-400+sm}>{line.text}</p>
        <p>{line.textZh}</p>
        if (i === currentLineIndex) line.highlightWordIds.map(id => <WordChip .../>)
      </div>
    ))
  if songEnded → completion banner + Listen Again + Choose Another buttons
  Back button
```

### Step 8 — Create `src/components/activities/SongTime.tsx`
```
Props: songs: Song[], vocabulary: VocabularyWord[]
State: selectedSong: Song | null, playCountMap: Record<string, number>

Init playCountMap from songs: { [s.id]: s.playCount ?? 0 }

handleSongEnd(song):
  const newCount = (playCountMap[song.id] ?? 0) + 1
  setPlayCountMap(prev => ({...prev, [song.id]: newCount}))
  putSong(db, {...song, playCount: newCount}).catch(() => {})

selectedSong ?
  <SongPlayer song={selectedSong} vocabulary={vocabulary}
    onBack={() => setSelectedSong(null)}
    onSongEnd={() => handleSongEnd(selectedSong)} />
: <SongPicker songs={songs} playCountMap={playCountMap}
    onSelect={setSelectedSong}
    onBack={() => router.push('/')} />
```

### Step 9 — Rewrite `src/app/activities/song-time/page.tsx`
Client component. Uses `useDB()`. Loads songs + vocabulary in parallel. Shows 🐼 loading, error state, or `<SongTime>`. Wraps in `<ChildLayout>`.

### Step 10 — Write `src/__tests__/SongTime.test.tsx`
Mock: `howler`, `next/image`, `next/navigation`, `useDB`, `audioManager.playWord`. Set up mock Howl factory that captures instances so tests can `emit('loaderror')`, `emit('end')` etc.

Tests:
1. `renders data-testid=song-time`
2. `shows data-testid=song-picker by default`
3. `song-picker shows 3 song tiles`
4. `tapping song tile shows data-testid=song-player`
5. `song-player shows data-testid=song-play-btn`
6. `audio error: emitting loaderror on Howl shows error message`
7. `retry button on audio error re-mounts player`
8. `back button in player returns to picker`
9. `song end: emit end event → shows completion banner`
10. `word chip renders with data-testid=word-chip and EN+ZH text`
11. `word chip tap → active state applied`

### Step 11 — Run tests
`npm test` — verify all tests pass including existing ones.

---

## File Change Summary

| File | Action | Reason |
|------|--------|--------|
| `src/types/index.ts` | Modify | Add `playCount?: number` to `Song` |
| `src/lib/songs-seed.ts` | Modify (full replace) | 3 nursery rhymes replacing placeholder |
| `src/lib/db.ts` | Modify | Add `getAllSongs`, `putSong` |
| `src/__mocks__/howler.ts` | Modify | Add `seek`, `pause`, `duration`, `volume` methods |
| `src/app/activities/song-time/page.tsx` | Modify (full replace) | Replace "coming soon" with real page |
| `src/components/activities/WordChip.tsx` | Create | Vocabulary word chip |
| `src/components/activities/SongPicker.tsx` | Create | Song tile grid |
| `src/components/activities/SongPlayer.tsx` | Create | Player with Howler + lyric sync |
| `src/components/activities/SongTime.tsx` | Create | Orchestrator component |
| `src/__tests__/SongTime.test.tsx` | Create | Tests |
| `.af/tasks/178/plan.json` | Create | Machine-readable plan |
| `.af/tasks/178/plan.md` | Create | This document |
