## Plan Summary
Files to modify: [object Object], [object Object]
Files to create: [object Object]
Approach: A — Conservative: minimal, targeted changes. Keep existing component structure; only merge the two useEffects into one and wire in audioManager.preloadWords. New script follows exact patterns already established in scripts/generate-*.ts.
Steps:
- 1. Create branch af/194-fix-the-duplicate-wordlist-useeffect-in/1
- 2. Read ExploreCards.tsx; identify the two useEffects and their shared dependency surface (db, wordList).
- 3. Replace the two useEffects with a single merged useEffect using a cancelled flag. Logic: if wordList prop is provided use it directly; otherwise call getAllWords(db) (plus getSetting for childName in the same Promise.all). After resolving, call audioManager.preloadWords(words).
- 4. Verify the dependency array is [db, wordList] and the childName fetch is still covered inside the merged effect.
- 5. Create scripts/verify-assets.ts following the exact import/structure described in the task. Use existsSync from 'fs', join from 'path', VOCABULARY_SEED from '../src/lib/vocabulary-seed'. Project root = process.cwd(). Check image at {root}{word.imagePath}, audioEn at {root}/public{word.audioEnPath}, audioZh at {root}/public{word.audioZhPath}. Print table and exit codes.
- 6. Add 'verify-assets': 'tsx scripts/verify-assets.ts' and 'prebuild': 'tsx scripts/verify-assets.ts' to package.json scripts.
- 7. Run 'npx tsx scripts/verify-assets.ts' to see actual results.
- 8. If images missing, run 'npx tsx scripts/generate-images.ts'.
- 9. If English audio missing, run 'npx tsx scripts/generate-audio-en.ts'.
- 10. If Mandarin audio missing, run 'npx tsx scripts/generate-audio-zh.ts'.
- 11. Re-run verify-assets until all PASS.
- 12. Run 'npm test' — verify ExploreCards.test.tsx still passes (no new failures).
- 13. Commit all source changes + any newly generated assets.
- 14. Write .af/tasks/194/pr-body.md, commit and push.