# Plan: Task 176 — Write & Execute Asset-Generation Scripts

## Assumption Audit

### Assumptions Made
1. **Audio ZH path naming**: The task specifies `/audio/zh/{slug}.mp3` using the English slug (not pinyin). This differs from the existing 20 ZH audio files that use pinyin-based names (`mao.mp3`, `gou.mp3`). The new files will use slug-based names; old pinyin-named files become orphaned but harmless.
2. **englishWord capitalisation**: Following existing pattern (e.g., 'Cat', 'Dog'), action/greeting words will be title-cased ('Hello', 'Thank You').
3. **`orange-color` slug**: `englishWord` will be 'Orange' (matching display), but the slug and paths use 'orange-color' to avoid collision with food-orange.
4. **vocabulary-list.ts vs vocabulary-seed.ts independence**: To avoid the Next.js bundle accidentally including Node.js API imports from scripts/, `vocabulary-seed.ts` (app) and `vocabulary-list.ts` (scripts) are **separate independent files** with the same 100-word data. They do NOT import each other.
5. **tsx is available via npx**: The task says `npx tsx scripts/generate-all-assets.ts`. We add `tsx` to devDependencies so it's deterministically available.
6. **Existing SFX files are skipped**: `public/audio/sfx/` already contains all 6 SFX files from Task 0. The generate-audio-en.ts script will skip them (idempotent check). Under `--force` mode, they'd be regenerated.
7. **Placeholder image exists**: `public/images/placeholder.png` already exists. The image generation script will still include logic to generate it (skipped if present).
8. **API key availability during CI**: Scripts require `OPENAI_API_KEY` and `GOOGLE_APPLICATION_CREDENTIALS`. In environments without these keys, scripts exit with code 1 and a clear error message. The plan documents how to run manually with real keys.
9. **`yes/是的` pinyin**: `shì de` (two syllables). Stored as-is in the data.
10. **`tummy/肚子` category**: Tagged as 'bodyParts' consistent with `ears`, `head`, `fingers`, `hair`.
11. **`family` word (家人)**: The English display word is 'Family'. The id is `family-family`, which is slightly awkward but consistent with the pattern.

### What the Task Does NOT Specify
- **How to run scripts with API keys in CI**: Defaulting to "run manually with env vars set; commit generated files".
- **The `tone` npm package for SFX**: Task says "use `tone` or manual Buffer approach". Since SFX files already exist, this code path will only run under `--force`. Defaulting to `tone` npm package for simple sine-wave generation as it produces ≤2s audio.
- **Whether to add `@types/p-limit`**: `p-limit` ships its own TypeScript types, so no separate `@types/p-limit` is needed.
- **Sharp version**: `sharp@0.33.0` is already a devDependency — no upgrade needed.

### Risks & Open Questions
- **API rate limits**: DALL-E 3 enforces 5 req/min for standard tier; p-limit(5) + 12s delay handles this. If the account has higher limits, progress will still be correct but slower than necessary.
- **Google Cloud auth**: `GOOGLE_APPLICATION_CREDENTIALS` requires a service account JSON path. Scripts validate and error-exit clearly.
- **`tsconfig.json` includes scripts/**: `"include": ["**/*.ts"]` means `tsc --noEmit` will also type-check scripts/. The openai and @google-cloud/text-to-speech packages must be installed (devDependencies) for this to pass.
- **`moduleResolution: "bundler"` and Node builtins**: Using bare `'fs'` and `'path'` imports (not `'node:fs'`) for maximum compatibility with the existing tsconfig.
- **Pinyin for `shì de`** (yes/是的): The pinyin string is `'shì de'` with a space — this is fine as display text, not used as a slug.

---

## Approach Alternatives

### APPROACH A — Conservative (Chosen)
Keep scripts completely separate from the app source. `src/lib/vocabulary-seed.ts` is a standalone file. `scripts/vocabulary-list.ts` is a standalone file. Both contain the same 100-word data independently.

- **Effort**: M
- **Risk**: Low
- **Trade-off**: Data is duplicated across two files (vocabulary-list.ts and vocabulary-seed.ts), but this is a one-time static dataset; the independence prevents Next.js bundling scripts/ Node.js dependencies into the client bundle.

### APPROACH B — Ideal (Not Chosen)
Make `vocabulary-list.ts` the single source of truth; `vocabulary-seed.ts` imports from `../../scripts/vocabulary-list`. One file to update.

- **Effort**: M
- **Risk**: Medium — Next.js Webpack/Turbopack would follow the import chain from `src/lib/vocabulary-seed.ts` → `scripts/vocabulary-list.ts` → potentially any Node.js imports in the same file. Even if vocabulary-list.ts has no Node.js imports itself, the tsconfig `@/` alias won't resolve the `../../scripts` path cleanly in all toolchains.
- **Trade-off**: Single source of truth is architecturally cleaner, but risks polluting the app bundle and breaking the build.

### Approach Decision
**Chosen: Approach A.** The 100-word static dataset is a one-time definition. The independence between `scripts/` and `src/` is more important than avoiding data duplication, since scripts/ may eventually add Node.js imports that must never enter the browser bundle. The vocabulary data is easily kept in sync via code review.

---

## Production-Readiness Checklist

1. **Persistence** — Scripts output binary files to `public/`. These are committed to git, making the app statically served without any runtime API calls. The app reads these files as static assets — no database needed. IndexedDB continues to store user progress as before.

2. **Error handling** — Every script has per-word try/catch with log-and-continue semantics. The orchestrator catches errors from sub-scripts. If all 3 retries fail for an image, error is logged and script continues. Scripts exit(1) if API keys are missing. Each API call is wrapped in retry logic with exponential backoff.

3. **Input validation** — Scripts validate: (a) OPENAI_API_KEY present and non-empty; (b) GOOGLE_APPLICATION_CREDENTIALS present, non-empty, and points to a readable file; (c) `--word {slug}` argument exists in FULL_VOCABULARY before making any API call. N/A for client-side validation (scripts are build-time tools, not user-facing forms).

4. **Loading states** — N/A for scripts (CLI tools). The app's loading states for vocabulary cards already exist in ExploreCards.tsx (skeleton/loading pattern). Scripts provide console progress: `[{done}/{total}] Generated {word}` / `Skipped {word} (exists)`.

5. **Empty states** — N/A for scripts. The app already has a placeholder image (`/images/placeholder.png`) shown when a vocabulary image hasn't loaded. The `VocabularyCard` component already handles `img` fallback to placeholder.

6. **Security** — API keys are read ONLY from `process.env`; never hardcoded, never logged. The scripts do not write to any path outside `public/`. Path traversal is prevented by constructing output paths from a whitelist of known slugs.

7. **Component size** — Scripts are CLI tools, not React components; the 150-line rule is not strictly applicable. However, each script is designed to be focused: vocabulary-list.ts (~120 lines of data), generate-images.ts (~120 lines), generate-audio-en.ts (~100 lines), generate-audio-zh.ts (~100 lines), generate-all-assets.ts (~100 lines). `src/lib/vocabulary-seed.ts` expands to ~350 lines of pure data — this exceeds the 150-line guideline but is unavoidable for 100 vocabulary entries; it contains no logic.

8. **Test coverage** — A new test `src/__tests__/vocabulary.test.ts` will verify: (a) VOCABULARY_SEED has exactly 100 entries; (b) all 7 categories are represented; (c) each word has required fields (id, englishWord, mandarinWord, pinyin, category, imagePath, audioEnPath, audioZhPath, tags); (d) no duplicate slugs; (e) imagePath/audioEnPath/audioZhPath follow expected patterns. This covers the happy path (correct data structure) and guards against data corruption during editing.

---

## Detailed Implementation Steps

### Step 1: Branch
Already exists: `af/176-write-and-execute-all-asset-generation-s/1` (created in previous setup).

### Step 2: Install New Dependencies
Add to `package.json` devDependencies:
- `openai` — DALL-E 3 + OpenAI TTS
- `@google-cloud/text-to-speech` — Google Cloud TTS for Mandarin
- `p-limit` — Concurrency limiting
- `tsx` — TypeScript script execution (for `npx tsx`)
- `tone` — Sine-wave audio generation for SFX (under --force)
- `@types/tone` (if needed)

Run `npm install`.

### Step 3: Create `scripts/vocabulary-list.ts`
Export `FULL_VOCABULARY: VocabularyWord[]` array of 100 words.
- Import `VocabularyWord` from `../src/types/index`
- All 7 categories, all fields filled in
- Slugs: lowercase ASCII, hyphenated (e.g., `thank-you`, `orange-color`)

### Step 4: Update `src/lib/vocabulary-seed.ts`
Replace the 25-word stub with all 100 words (same data as vocabulary-list.ts).
- Export stays as `VOCABULARY_SEED`
- Import uses `@/types`
- Audio ZH paths use slug-based naming (`/audio/zh/{slug}.mp3`)

### Step 5: Create `scripts/generate-images.ts`
- OpenAI DALL-E 3 via `openai` package
- Consistent kawaii style prompt for all 100 words
- Download → sharp resize to 512×512 → save as PNG
- Skip if exists; retry 3× with backoff; p-limit(5) concurrency; 12s batch delay
- Also generate placeholder.png (solid #C7B8EA color via sharp)

### Step 6: Create `scripts/generate-audio-en.ts`
- OpenAI TTS, model `tts-1`, voice `nova`, speed 0.85
- Input: `word.englishWord` string
- Output: `public/audio/en/{slug}.mp3`
- Also generate 6 SFX files (skip if exist)
- p-limit(8) concurrency; log and continue on error

### Step 7: Create `scripts/generate-audio-zh.ts`
- Google Cloud TTS, `cmn-CN-Wavenet-A`, speakingRate 0.85
- Input: `word.mandarinWord` Chinese characters
- Output: `public/audio/zh/{slug}.mp3`
- p-limit(10) concurrency; log and continue on error
- Validate GOOGLE_APPLICATION_CREDENTIALS on startup

### Step 8: Create `scripts/generate-all-assets.ts`
- Parse CLI args: `--images-only`, `--audio-only`, `--word {slug}`, `--force`
- Run images → EN audio → ZH audio in sequence
- Print final summary: generated / skipped / failed counts

### Step 9: Update `package.json` scripts
Add: `"generate-assets": "tsx scripts/generate-all-assets.ts"`

### Step 10: Write Tests
Create `src/__tests__/vocabulary.test.ts`:
- Tests for VOCABULARY_SEED count, categories, field presence, path patterns, uniqueness

### Step 11: Run Tests & Type-Check
```bash
npm test
npm run type-check
```

### Step 12: Run Asset Generation (with API keys)
```bash
OPENAI_API_KEY=... GOOGLE_APPLICATION_CREDENTIALS=... npm run generate-assets
```

### Step 13: Commit Everything
Commit scripts, updated vocabulary-seed.ts, package.json changes, generated assets, and test.

---

## File Summary

### Files to Create
| File | Purpose |
|------|---------|
| `scripts/vocabulary-list.ts` | 100-word vocabulary data for scripts |
| `scripts/generate-images.ts` | DALL-E 3 image generation |
| `scripts/generate-audio-en.ts` | OpenAI TTS English audio |
| `scripts/generate-audio-zh.ts` | Google Cloud TTS Mandarin audio |
| `scripts/generate-all-assets.ts` | Orchestrator script |
| `src/__tests__/vocabulary.test.ts` | Vocabulary data structure tests |

### Files to Modify
| File | Change |
|------|--------|
| `src/lib/vocabulary-seed.ts` | Replace 25-word stub with 100 words |
| `package.json` | Add `generate-assets` script; add 4 devDependencies |

### Files NOT Modified
- `src/types/index.ts` — already has all 7 Category values
- All React components — no changes needed
- `tsconfig.json` — already works for scripts via tsx
- Any existing tests — not weakened or removed

---

## Expected Test Output
```
PASS src/__tests__/vocabulary.test.ts
  VOCABULARY_SEED
    ✓ has exactly 100 words
    ✓ has all 7 categories
    ✓ every word has required fields
    ✓ no duplicate IDs
    ✓ no duplicate slugs in imagePath
    ✓ imagePath follows /images/vocabulary/{slug}.png pattern
    ✓ audioEnPath follows /audio/en/{slug}.mp3 pattern
    ✓ audioZhPath follows /audio/zh/{slug}.mp3 pattern
    ✓ animals category has 15 words
    ✓ food category has 15 words
    ✓ colors category has 10 words
    ✓ bodyParts category has 10 words
    ✓ family category has 10 words
    ✓ objects category has 20 words
    ✓ actions category has 20 words
```

---

## Risk Areas
1. **DALL-E 3 rate limits**: 5 req/min on standard accounts. With 100 words, generation takes ~20 minutes minimum. Plan accounts for this with p-limit and 12s delay.
2. **Google Cloud billing**: TTS API is billed per character. 100 Mandarin words × ~3 chars avg = ~300 chars. Very low cost but billing must be enabled.
3. **sharp version compatibility**: sharp@0.33.0 in devDependencies — ensure it works with Node.js version in use.
4. **tsconfig type-checking scripts**: `tsc --noEmit` now type-checks scripts/ which import `openai` and `@google-cloud/text-to-speech`. These must be installed for type-check to pass.
5. **`tone` npm package for SFX**: The `tone` package is primarily browser-oriented. Alternative: use Node.js Buffer to generate WAV data manually, then convert to MP3 via ffmpeg (if available) or just generate a simple WAV file. Since SFX files already exist, this is only needed under `--force`.
