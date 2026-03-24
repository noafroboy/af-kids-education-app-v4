## Summary
- Merged two duplicate `useEffect` hooks in `ExploreCards.tsx` into a single effect with a cleanup flag, eliminating duplicate IndexedDB queries and React StrictMode double-invocation warnings.
- Added `audioManager.preloadWords()` call so audio files begin buffering as soon as the component mounts, removing the delay on first speaker-button tap.
- Created `scripts/verify-assets.ts`, a new prebuild guard that checks every vocabulary word for its image, English audio, and Mandarin audio files, printing a PASS/FAIL table and exiting with code 1 if any asset is missing.

## Changes

### `src/components/activities/ExploreCards.tsx`
- Added `import { audioManager } from '@/lib/audio'`
- Replaced two `useEffect` hooks (lines 30–59) with a single merged effect:
  - Uses a `cancelled` flag to prevent `setState` on unmounted components
  - If `wordList` prop is non-empty: sets state directly, fires `audioManager.preloadWords()`, and optionally fetches `childName` from IndexedDB
  - Otherwise: runs `getAllWords` + `getSetting` in a single `Promise.all`, then sets state and fires `preloadWords()`
  - Dependency array: `[db, wordList]`

### `scripts/verify-assets.ts` (new)
- Imports `VOCABULARY_SEED` from `../src/lib/vocabulary-seed`
- For each word checks: `public{imagePath}`, `public{audioEnPath}`, `public{audioZhPath}`
- Prints a formatted table row per word with PASS/FAIL status
- Exits 1 with a descriptive error message if any assets are missing; exits 0 on full pass

### `package.json`
- Added `"verify-assets": "tsx scripts/verify-assets.ts"` script
- Added `"prebuild": "tsx scripts/verify-assets.ts"` so `npm run build` auto-verifies assets

## Testing
- Ran `npx tsx scripts/verify-assets.ts` — all 300 assets (100 words × 3 files) report PASS
- Ran `npm test` — all 212 tests pass, including `ExploreCards.test.tsx`
- Ran `npx tsc --noEmit` — zero TypeScript errors
