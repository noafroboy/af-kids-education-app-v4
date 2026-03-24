## Summary
- Fixes four secondary/back/retry buttons across three activity components that fell below the 88px minimum tap target requirement, improving accessibility and usability on touch devices.
- Updates the npm `dev` script to bind on port 3042 so the development server is consistently reachable at `http://localhost:3042`.

## Changes

### Tap target fixes (min-h-[88px])
- `src/components/activities/SongPicker.tsx` — Back button: replaced `py-2` with `min-h-[88px] flex items-center` to guarantee at least 88px height while keeping the text-link appearance.
- `src/components/activities/SongPlayerControls.tsx` — Error state Retry button: replaced `py-3` with `min-h-[88px]`. Error state Back button: replaced `py-2` with `min-h-[88px] flex items-center`.
- `src/components/activities/ListenAndFind.tsx` — "Play Again / 再播放" button: replaced `py-2` with `min-h-[88px] flex items-center` to meet the minimum tap target.

### Dev server port
- `package.json` — Changed `"dev": "next dev"` to `"dev": "next dev --port 3042"`.

## Testing
- `npm run type-check` (`tsc --noEmit`) passes with zero errors.
- `npm test` — all 212 tests pass across 25 test suites.
- Changes are purely Tailwind className updates (no logic changes), so no new tests were required.
