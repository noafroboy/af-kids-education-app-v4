## Summary
- Expands the vocabulary data from 20 words to the full 100-word list across all 7 categories (animals, food, colors, bodyParts, family, objects, actions), updating both `src/lib/vocabulary-seed.ts` (app) and introducing `scripts/vocabulary-list.ts` (scripts) as independent parallel sources of truth
- Adds four idempotent, rate-limited asset-generation scripts (`generate-images.ts`, `generate-audio-en.ts`, `generate-audio-zh.ts`, `generate-all-assets.ts`) with an orchestrator CLI (`npm run generate-assets`) that skips existing files, retries on transient errors, and reports progress
- Generates and commits all 100 vocabulary PNG images (DALL-E 3 kawaii style), 100 EN TTS MP3s (OpenAI nova), and 100 ZH TTS MP3s so the app works fully offline

## Changes

### New Scripts
- `scripts/vocabulary-list.ts` — 100-word vocabulary data for script use, independent of `src/lib/` to prevent Next.js from bundling Node.js dependencies
- `scripts/generate-images.ts` — DALL-E 3 (1024×1024 → sharp resize to 512×512), p-limit(5) concurrency, 12s inter-batch delay, 3× exponential-backoff retry, generates `placeholder.png` solid lavender
- `scripts/generate-audio-en.ts` — OpenAI TTS `tts-1` nova voice at 0.85× speed for all 100 vocabulary words + 6 SFX files; skips existing
- `scripts/generate-audio-zh.ts` — Google Cloud `cmn-CN-Wavenet-A` at 0.85× speed for all 100 vocabulary words; validates `GOOGLE_APPLICATION_CREDENTIALS` and exits clearly if missing
- `scripts/generate-audio-zh-openai-fallback.ts` — Temporary OpenAI TTS fallback used to generate ZH audio files in this run (since `GOOGLE_APPLICATION_CREDENTIALS` is unavailable in this environment); should be replaced by running `generate-audio-zh.ts` with real Google Cloud credentials
- `scripts/generate-all-assets.ts` — Orchestrator with `--images-only`, `--audio-only`, `--word {slug}`, `--force` flags; runs image → EN audio → ZH audio in sequence; prints final `Generated/Skipped/Failed` summary

### Updated Files
- `src/lib/vocabulary-seed.ts` — Expanded from 25-word stub to all 100 words with slug-based `audioZhPath` (e.g. `/audio/zh/cat.mp3` not `/audio/zh/mao.mp3`)
- `package.json` — Added `generate-assets` script; added `openai`, `@google-cloud/text-to-speech`, `p-limit`, `tsx` to devDependencies

### Generated Assets (committed)
- `public/images/vocabulary/` — 100 PNG files (512×512 kawaii style, 80 new + 20 previously existing)
- `public/images/placeholder.png` — Regenerated as 512×512 solid #C7B8EA lavender
- `public/audio/en/` — 100 MP3 files (80 new + 20 previously existing)
- `public/audio/zh/` — 100 slug-based MP3 files (20 copied from existing pinyin-named files + 80 new; old pinyin-named files left for backwards compatibility)

### New Tests
- `src/__tests__/vocabulary.test.ts` — 18 tests verifying count (100), category distribution (7 categories with correct counts), required field presence, no duplicate IDs/slugs, correct path patterns, and orange-color/thank-you slug uniqueness

## Testing
- `npm test -- --testPathPattern=vocabulary` → 18/18 tests pass
- `npm run type-check` → zero errors introduced by this PR (4 pre-existing `@testing-library/react` type errors in unmodified test files remain unchanged)
- Scripts are idempotent: re-running with all files present logs all "Skipped (exists)" lines and makes no API calls
- Missing `OPENAI_API_KEY` → script exits with code 1 and clear error message
- Missing `GOOGLE_APPLICATION_CREDENTIALS` → `generate-audio-zh.ts` exits with code 1 and shows setup instructions

## Notes
- ZH audio files were generated with OpenAI TTS nova voice (Chinese text input) as a fallback because `GOOGLE_APPLICATION_CREDENTIALS` is not available in this environment. To upgrade to Google Cloud `cmn-CN-Wavenet-A` quality, run: `GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json npx tsx scripts/generate-audio-zh.ts --force`
- Old pinyin-named ZH files (e.g. `mao.mp3`, `gou.mp3`) remain in `public/audio/zh/` as orphaned files for backwards compatibility
