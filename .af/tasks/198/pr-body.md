## Summary
- Fix six uncleaned `setTimeout` calls across auth/UI components by capturing them in `useRef` handles with proper `useEffect` cleanup, preventing `setState`-on-unmounted-component React warnings when users navigate away during timeout windows.
- Update Cancel/Confirm modal buttons in `/parent` (forgot-PIN modal) and `/parent/settings` (reset-progress modal) to `min-h-[88px]` for accessible 88 px tap targets on mobile.

## Changes

**`src/components/ui/PinPad.tsx`**
- Added `submitTimerRef` to track the 100 ms submit delay after 4th digit entry.
- Added `useEffect` cleanup to cancel the timer on unmount.

**`src/app/parent/page.tsx`**
- Added `pinErrorTimerRef` to track the 500 ms `setPinError(false)` call in `handlePinSubmit`.
- Added `useEffect` cleanup to cancel the timer on unmount.
- Changed Cancel and Confirm Reset buttons in forgot-PIN modal from `py-3` to `min-h-[88px]`.

**`src/components/parent/ChangePinSection.tsx`**
- Added `pinErrorTimerRef` to track the 500 ms `setPinError(false)` call in `handleVerifyCurrent`.
- Added `useEffect` cleanup to cancel the timer on unmount.

**`src/app/parent/settings/page.tsx`**
- Added `savedTimerRef` to track the 2000 ms `setSaved(false)` call in `handleSaveProfile`.
- Added `useEffect` cleanup to cancel the timer on unmount.
- Changed Cancel and Confirm buttons in reset-progress modal from `py-3` to `min-h-[88px]`.

**`src/components/ui/MascotIdle.tsx`**
- Rewrote the blink `useEffect` to capture the inner 200 ms `setTimeout` in a local `blinkTimer` variable so it is cancelled alongside the `setInterval` on cleanup.

**`src/components/activities/SongPlayer.tsx`**
- Added `wordTapTimerRef` to track the 2000 ms resume-playback timer in `handleWordTap`.
- Clear `wordTapTimerRef` in the song `useEffect` cleanup (alongside `howl.unload()`).

## Testing
- `npx tsc --noEmit` — zero TypeScript errors across all 6 modified files.
- `npm test` — all 212 tests pass (25 test suites).
