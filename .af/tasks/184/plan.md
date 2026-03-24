# Task 184 — Audio & Visual Assets Plan

## Overview

This task produces content assets required for the LittleBridge bilingual education app to function correctly. It involves:
- Deleting 7 stale/orphaned pinyin-named ZH audio files
- Resizing 100 vocabulary PNG images from 1024×1024 → 512×512 (faster mobile load)
- Creating `scripts/generate-audio-zh-fix.ts` to force-regenerate 13 broken Mandarin TTS files
- Creating `scripts/generate-audio-songs.ts` to generate 3 song audio files for Song Time
- Updating `scripts/generate-audio-zh-openai-fallback.ts` with quality and validation improvements
- Running both new scripts to produce the actual MP3 binary assets

---

## Assumption Audit

### What the task specifies clearly:
- Exact list of 7 files to delete
- Image resize command (`sips -z 512 512`)
- 13 target words for ZH audio fix
- 3 songs with exact lyrics text
- OpenAI TTS parameters: model, voice, speed, concurrency

### Assumptions made about ambiguous requirements:

| Assumption | Task Statement | Actual Finding | Decision |
|---|---|---|---|
| Export name | `import VOCABULARY` | File exports `FULL_VOCABULARY` | Use `FULL_VOCABULARY` |
| Missing words | "look up from VOCABULARY" | `lion`, `bear`, `grape` not in vocabulary-list.ts | Add hardcoded Mandarin fallback map |
| "20 vocabulary images" | "Resize 20 vocabulary images" | 100 PNGs in directory; `sips *.png` covers all | Resize all with wildcard as instructed |
| .env.local presence | "attempt to read from .env.local" | No .env.local currently exists | Script handles missing file gracefully |
| sips availability | macOS sips command | macOS-only tool | Acceptable; dev machine is macOS |

### What the task does NOT specify, and chosen defaults:
- **What to do when lion/bear/grape not in vocabulary**: Default = inline fallback map with known Mandarin translations
- **Concurrency for generate-audio-songs.ts**: Not specified; chosen = run sequentially (only 3 files, no need for p-limit)
- **Error behavior when a word fails in zh-fix**: Default = log error, continue with remaining words; throw only on total API failure

### Risks & Open Questions
1. **lion/bear/grape missing from FULL_VOCABULARY** — These words appear in the 13-word target list but are not defined in `scripts/vocabulary-list.ts`. The script cannot look them up. Resolution: embed a `MANDARIN_FALLBACK` constant in the fix script mapping these words to their Mandarin text (狮子, 熊, 葡萄).
2. **OPENAI_API_KEY unavailability** — No `.env.local` exists in the repo. If the API key isn't in the shell environment, scripts will log a clear error and exit with code 1.
3. **Corrupt existing files** — The task says some files "contain JSON error responses instead of valid MP3 data." The force-overwrite approach ensures fresh generation regardless.

---

## Approach Alternatives

### APPROACH A — Conservative (Chosen)
**Strategy:** Follow task spec line-by-line. Add an inline `MANDARIN_FALLBACK` map for the 3 missing vocabulary words rather than modifying vocabulary-list.ts. Minimal changes to existing scripts.

- **Effort:** S
- **Risk:** Low
- **Trade-off:** The fallback map for lion/bear/grape is duplicated logic (not in vocabulary-list.ts), but avoids adding vocabulary entries that could affect other parts of the app.

### APPROACH B — Ideal
**Strategy:** Add lion, bear, and grape as new vocabulary entries in `vocabulary-list.ts` (with full metadata: id, englishWord, mandarinWord, pinyin, category, paths). Then the fix script can simply look up FULL_VOCABULARY for all 13 words uniformly.

- **Effort:** M
- **Risk:** Medium (adds 3 new vocabulary words, potentially affecting UI, session logic, image asset requirements)
- **Trade-off:** More consistent and extensible, but introduces scope creep — adding vocabulary is a feature change beyond the asset-generation task.

## Approach Decision

**Chose Approach A.** The task is scoped to asset generation and script improvements. Adding vocabulary entries would expand scope into the data model, potentially requiring new images, session logic changes, and tests across the app. The inline fallback map is a targeted, localized solution that satisfies the requirement without side effects.

---

## Files Changed

### New Files
| File | Purpose |
|---|---|
| `scripts/generate-audio-zh-fix.ts` | Force-regenerate 13 broken Mandarin TTS files, ~120 lines |
| `scripts/generate-audio-songs.ts` | Generate 3 song MP3s for Song Time activity, ~90 lines |

### Modified Files
| File | Change |
|---|---|
| `scripts/generate-audio-zh-openai-fallback.ts` | Upgrade model tts-1→tts-1-hd, add MP3 validation, add top comment |

### Binary Operations (not tracked as code changes)
| Operation | Command |
|---|---|
| Delete 7 orphaned ZH files | `rm -f public/audio/zh/bizi.mp3 ...` |
| Resize vocabulary images | `sips -z 512 512 public/images/vocabulary/*.png` |
| Generate 13 ZH TTS fixes | `npx tsx scripts/generate-audio-zh-fix.ts` |
| Generate 3 song files | `npx tsx scripts/generate-audio-songs.ts` |

---

## Implementation Steps

1. **Create branch** — `git checkout -b af/184-task-audio-visual-assets-regenerate-brok/1`

2. **Delete orphaned files**
   ```bash
   rm -f public/audio/zh/bizi.mp3 public/audio/zh/fense.mp3 \
     public/audio/zh/gou.mp3 public/audio/zh/hongse.mp3 \
     public/audio/zh/huangse.mp3 public/audio/zh/jiao.mp3 \
     public/audio/zh/xiangjiao.mp3
   ```

3. **Resize images**
   ```bash
   sips -z 512 512 public/images/vocabulary/*.png
   ```
   Verify: `sips -g pixelHeight public/images/vocabulary/apple.png` → `pixelHeight: 512`

4. **Create `scripts/generate-audio-zh-fix.ts`**
   - Import `FULL_VOCABULARY` from `./vocabulary-list`
   - Define `MANDARIN_FALLBACK` for missing words: `{ lion: '狮子', bear: '熊', grape: '葡萄' }`
   - Read API key: `process.env.OPENAI_API_KEY || readEnvLocal('OPENAI_API_KEY')`
   - TARGET_WORDS array: 13 words as specified
   - `generateZhAudio(word)` function:
     - Looks up word in FULL_VOCABULARY (case-insensitive)
     - Falls back to MANDARIN_FALLBACK if not found
     - Throws if word not in either
     - Calls OpenAI TTS: model `tts-1-hd`, voice `nova`, speed `0.85`
     - Writes to `public/audio/zh/{word}.mp3`
     - Validates MP3 header (ID3 or 0xFF sync bytes)
     - Logs progress: `"Generating ZH audio for: apple (苹果)..."` and `"✅ apple.mp3 (12345 bytes, valid MP3)"`
   - `main()` function uses `p-limit(3)` for concurrency
   - Exit 1 on fatal error

5. **Create `scripts/generate-audio-songs.ts`**
   - Define `SONGS` array with 3 entries (id, filename, lyrics)
   - Read API key same way as zh-fix
   - `generateSong(song)` function:
     - Checks if file exists AND passes MP3 validation → skips
     - Calls OpenAI TTS: model `tts-1-hd`, voice `nova`, speed `0.9`
     - Creates `public/audio/songs/` directory if needed
     - Writes file, validates MP3 header
     - Logs progress
   - Run 3 songs sequentially (simple for-loop, no p-limit needed)
   - Exit 1 on error

6. **Modify `scripts/generate-audio-zh-openai-fallback.ts`**
   - Add top comment: `// For targeted regeneration of specific broken files, use generate-audio-zh-fix.ts instead`
   - Change `model: 'tts-1'` → `model: 'tts-1-hd'`
   - `speed: 0.85` is already set — confirm and leave
   - Add MP3 magic byte validation after `fs.writeFileSync()`

7. **Run scripts** (requires OPENAI_API_KEY):
   ```bash
   if [ -f .env.local ]; then
     export $(grep OPENAI_API_KEY .env.local | xargs)
   fi
   npx tsx scripts/generate-audio-zh-fix.ts
   npx tsx scripts/generate-audio-songs.ts
   ```

8. **Commit and push**

---

## Production-Readiness Checklist

1. **Persistence** — Assets are written as static binary files to `public/audio/zh/`, `public/audio/songs/`, and `public/images/vocabulary/`. These are filesystem-persisted files served by Next.js as static assets. They survive page refresh. ✅

2. **Error handling** — Every OpenAI TTS call is wrapped in try/catch. MP3 validation throws a descriptive error if the written file lacks a valid header. Scripts exit with code 1 on fatal errors (missing API key, all words failed). Per-word failures log the error and continue. ✅

3. **Input validation** — Scripts are not user-facing; they take no runtime user input. The word lookup validates that each word exists in FULL_VOCABULARY or MANDARIN_FALLBACK before calling the API. N/A for server-side validation (no HTTP endpoints). ✅

4. **Loading states** — N/A — these are one-time offline asset generation scripts, not UI components. The app itself already has loading states for audio playback (task is not touching UI). N/A ✅

5. **Empty states** — N/A — these scripts either produce files or exit with an error. The Song Time activity UI (not modified by this task) already handles missing songs. N/A ✅

6. **Security** — API key loaded from `process.env.OPENAI_API_KEY` first, then from `.env.local` (never hardcoded). The `.env.local` file is in `.gitignore`. ✅

7. **Component size** — `generate-audio-zh-fix.ts` estimated ~120 lines. `generate-audio-songs.ts` estimated ~90 lines. Both well under 150-line limit. Modified fallback script will stay under 80 lines. ✅

8. **Test coverage** — These are asset generation scripts (not application features), so no Jest/Playwright tests are appropriate. The built-in MP3 header validation inside each script serves as immediate correctness verification. Post-run verification uses `sips -g pixelHeight` and `ls public/audio/songs/`. The existing app tests (Jest unit tests, Playwright E2E) cover the audio playback UI which consumes these files. N/A for new tests ✅

---

## Mandarin Reference (for MANDARIN_FALLBACK)

Words missing from FULL_VOCABULARY that need fallback entries in generate-audio-zh-fix.ts:

| English | Mandarin | Pinyin |
|---|---|---|
| lion | 狮子 | shīzi |
| bear | 熊 | xióng |
| grape | 葡萄 | pútáo |

Words found in FULL_VOCABULARY (confirmed):

| English | Mandarin | In vocabulary-list.ts |
|---|---|---|
| apple | 苹果 | ✅ food-apple |
| cat | 猫 | ✅ animal-cat |
| dog | 狗 | ✅ animal-dog |
| rabbit | 兔子 | ✅ animal-rabbit |
| fish | 鱼 | ✅ animal-fish |
| bird | 鸟 | ✅ animal-bird |
| milk | 牛奶 | ✅ food-milk |
| rice | 米饭 | ✅ food-rice |
| egg | 鸡蛋 | ✅ food-egg |
| banana | 香蕉 | ✅ food-banana |
