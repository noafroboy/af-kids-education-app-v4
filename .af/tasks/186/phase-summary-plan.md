## Plan Summary
Files to modify: src/components/session/GreetingStep.tsx, src/components/activities/SongPlayer.tsx, src/__tests__/SongTime.test.tsx
Files to create: src/components/activities/SongCoverArt.tsx, src/components/activities/SongPlayerControls.tsx
Approach: APPROACH A — Conservative: implement exactly the spec with minimal scope, following existing patterns
Steps:
- 1. Verify public/audio/en/hello.mp3 exists (confirmed: it does)
- 2. Create src/components/activities/SongCoverArt.tsx — image with 🎵 fallback on error
- 3. Create src/components/activities/SongPlayerControls.tsx — play/pause button + inline error UI with retry
- 4. Modify src/components/activities/SongPlayer.tsx — add retryCount state, update Howl useEffect deps, add handleRetry, remove imgError, remove early-return error block, replace cover art inline JSX with <SongCoverArt>, replace loading+play inline JSX with <SongPlayerControls>, add new imports
- 5. Modify src/components/session/GreetingStep.tsx — import audioManager, add second useEffect that calls audioManager.playWordEn('/audio/en/hello.mp3') on mount
- 6. Update src/__tests__/SongTime.test.tsx — add tests: retry creates new Howl instance (Howl constructor called twice), play button briefly disabled after retry (audioReady=false), GreetingStep audio call on mount
- 7. Run npm test to verify all tests pass
- 8. Confirm SongPlayer.tsx line count is ≤200
- 9. Commit and push