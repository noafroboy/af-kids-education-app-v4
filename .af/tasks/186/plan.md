# Task 186 Plan: SongPlayer Retry Fix & Sub-component Extraction, GreetingStep Greeting Audio

## Assumption Audit

### Assumptions Made
1. **`public/audio/en/hello.mp3` exists** — Confirmed via filesystem check. Using exact path `/audio/en/hello.mp3`.
2. **Retry mechanism replaces entire Howl** — The bug is that resetting `audioError`/`audioReady` state without creating a new Howl does not re-trigger loading. `retryCount` as a useEffect dep forces a fresh `new Howl(...)` call.
3. **Error UI moves inline (not a separate route/screen)** — The task says to remove the early return and handle error inside `SongPlayerControls`, keeping the outer `song-player` container visible at all times.
4. **`imgError` state is fully removed from SongPlayer** — It moves into `SongCoverArt`'s internal state.
5. **Existing test for retry** (`retry button on audio error clears error state`) — still passes because: retryCount increments → useEffect runs → new Howl → `audioError` resets to `false` → "Song unavailable" text disappears.
6. **Tests go in existing SongTime.test.tsx** — This is where all SongPlayer-related tests live. New tests follow the same `lastHowlInstance` / `createMockHowl` pattern.

### What the Task Does NOT Specify (Defaults Chosen)
- **Where GreetingStep tests live** — No existing GreetingStep test file. Will add to `SongTime.test.tsx` or create a dedicated `GreetingStep.test.tsx`. Chose: dedicated `GreetingStep.test.tsx` to keep concerns separate.
- **SongCoverArt/SongPlayerControls test location** — Will add unit tests to a new `SongPlayer.test.tsx` file focused on the sub-components.
- **Default size for SongCoverArt** — Spec says `size = 128`; SongPlayer will use the default (128×128).

### Risks & Open Questions
1. **React 19 Strict Mode** — In dev, effects run twice. `audioManager.playWordEn` will be called twice, potentially replaying audio. Acceptable for a UI enhancement; the `audioManager` cache means the same Howl instance is reused.
2. **Howl useEffect firing on every retryCount change** — The cleanup `howl.unload()` correctly prevents memory leaks. The new instance starts fresh.
3. **Back button duplication** — SongPlayerControls includes its own `← Back` button when in error state, and SongPlayer renders a second `← Back` at the bottom. This is unchanged behavior from the original early-return error screen.

---

## Approach Alternatives

### APPROACH A: Conservative ✅ CHOSEN
Implement exactly the spec changes with minimal scope. Follow the existing code patterns (useCallback, same state variable names, same test file structure). Add tests to the existing `SongTime.test.tsx` plus a minimal `GreetingStep.test.tsx`.

- **Effort:** S
- **Risk:** Low
- **Trade-off:** Some test file size growth in `SongTime.test.tsx`, but we avoid splitting existing tests or reorganizing the test suite.

### APPROACH B: Ideal
Refactor tests into per-component test files (`SongPlayer.test.tsx`, `SongCoverArt.test.tsx`, `SongPlayerControls.test.tsx`, `GreetingStep.test.tsx`), and remove the orchestration-level tests from `SongTime.test.tsx` that duplicate per-component concerns. Also consider abstracting `retryCount` into a `useAudioPlayer` custom hook.

- **Effort:** M
- **Risk:** Medium (risk of breaking existing test assertions, scope creep into hook refactoring)
- **Trade-off:** Better long-term test isolation but out of scope for this task.

## Approach Decision

**Chosen: APPROACH A** — The task is tightly scoped. Approach B introduces out-of-scope refactoring (hook extraction, test reorganization) that could break CI and distract from the P1 fixes. The conservative approach delivers all three requirements (retry fix, sub-component extraction, greeting audio) with minimal blast radius.

---

## Production-Readiness Checklist

1. **Persistence** — N/A — These are pure UI/audio components with no new data. SongTime's existing IndexedDB persistence (`putSong`) is not modified.

2. **Error handling** — `SongPlayerControls` renders an inline error UI with a Retry button whenever `hasError=true`. If the second load attempt also fails, `loaderror` fires again, `audioError` returns to `true`, and the error UI re-appears — no silent failures. `audioManager.playWordEn` has a `try/catch` that logs a warning instead of crashing.

3. **Input validation** — N/A — No user-facing input forms. Props are TypeScript-typed interfaces.

4. **Loading states** — `SongPlayerControls` renders "Loading audio... / 加载中..." (animated pulse) while `isReady=false`. After clicking Retry, the useEffect resets `audioReady=false` *before* the new Howl is created, so the loading text reappears immediately.

5. **Empty states** — N/A — `SongPlayer` always receives a valid `song` prop (guaranteed by `SongPicker`). `SongCoverArt` handles the image-load-fail case with a `🎵` emoji fallback.

6. **Security** — N/A — No API keys, no external network calls, no LLM involved. Audio paths are static strings from seed data.

7. **Component size** — Current `SongPlayer.tsx` is ~139 lines. After changes: removing early-return block (−15), removing imgError state (−1), replacing cover art section (−8 lines, +1 import usage), replacing controls section (−8 lines, +5 import usage), adding retryCount + handleRetry (+5), adding imports (+2). Estimated result: ~119 lines ≤ 200 ✓. New `SongCoverArt.tsx` ~35 lines. New `SongPlayerControls.tsx` ~55 lines.

8. **Test coverage** — Adding tests for: (a) retry increments `retryCount` and creates a new Howl instance, (b) play button is disabled immediately after retry (`audioReady=false`), (c) `SongCoverArt` shows emoji on image error, (d) `SongPlayerControls` renders correct play/pause icon, (e) `GreetingStep` calls `audioManager.playWordEn` on mount.

---

## Specific File Changes

### `src/components/activities/SongCoverArt.tsx` (NEW)
- `'use client'` directive
- `useState` for `imgError`
- `Image` from `next/image` with `fill` + `onError`
- Shows `🎵` text when `imgError=true`
- Props: `src`, `alt`, `size` (default 128)

### `src/components/activities/SongPlayerControls.tsx` (NEW)
- `'use client'` directive
- No local state (all state is props-driven)
- When `hasError=true`: renders emoji, bilingual error text, `data-testid="retry-btn"` button, back button
- When `hasError=false`: renders loading text (conditionally shown when `!isReady`), `data-testid="song-play-btn"` button

### `src/components/activities/SongPlayer.tsx` (MODIFY)
- **Add**: `const [retryCount, setRetryCount] = useState(0);`
- **Modify Howl useEffect**: add `setAudioReady(false); setAudioError(false);` at top; add `retryCount` to dep array
- **Add**: `const handleRetry = useCallback(() => { setRetryCount((c) => c + 1); }, []);`
- **Remove**: `const [imgError, setImgError] = useState(false);`
- **Remove**: entire `if (audioError) { return (...) }` block (15 lines)
- **Replace**: cover art `<div>` with `<SongCoverArt src={song.coverImagePath} alt={song.title} />`
- **Replace**: loading `<p>` + play `<button>` with `<SongPlayerControls ...>`
- **Add imports**: `SongCoverArt`, `SongPlayerControls`

### `src/components/session/GreetingStep.tsx` (MODIFY)
- **Add import**: `import { audioManager } from '@/lib/audio';`
- **Add useEffect**: calls `audioManager.playWordEn('/audio/en/hello.mp3')` on mount (empty deps array)

### `src/__tests__/SongTime.test.tsx` (MODIFY)
- Update existing `retry button on audio error clears error state` test to also assert `Howl` constructor was called a second time
- Add test: after retry, `song-play-btn` exists and is disabled (isReady=false)

### New test files
- `src/__tests__/GreetingStep.test.tsx` — mount test, verify `audioManager.playWordEn` called with `/audio/en/hello.mp3`
- `src/__tests__/SongPlayerControls.test.tsx` — render `hasError=false`: shows play ▶ btn; `isPlaying=true`: shows ⏸; `hasError=true`: shows retry-btn; `SongCoverArt` image error shows emoji

---

## Testing Plan

| Test | File | Type |
|------|------|------|
| Retry creates new Howl instance | SongTime.test.tsx | Unit |
| After retry, play-btn is disabled | SongTime.test.tsx | Unit |
| GreetingStep calls audioManager.playWordEn on mount | GreetingStep.test.tsx | Unit |
| SongPlayerControls shows ▶ when not playing | SongPlayerControls.test.tsx | Unit |
| SongPlayerControls shows ⏸ when playing | SongPlayerControls.test.tsx | Unit |
| SongPlayerControls shows retry-btn on error | SongPlayerControls.test.tsx | Unit |
| SongCoverArt shows 🎵 on image error | SongPlayerControls.test.tsx | Unit |
| All existing SongTime tests continue passing | SongTime.test.tsx | Regression |
