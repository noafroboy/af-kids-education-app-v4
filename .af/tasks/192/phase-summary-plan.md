## Plan Summary
Files to modify: src/components/activities/ListenAndFind.tsx, src/components/activities/MatchingPairs.tsx, src/lib/audio.ts, src/__tests__/ListenAndFind.test.tsx, src/__tests__/MatchingPairs.test.tsx, src/__tests__/audio.test.ts
Files to create: 
Approach: Conservative (Approach A): Make the minimum changes required — snapshot the ref value at the top of each cleanup function, and add pendingTimeoutId + cancelPending() to AudioManager. Touch only the three source files and their corresponding test files.
Steps:
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]
- [object Object]