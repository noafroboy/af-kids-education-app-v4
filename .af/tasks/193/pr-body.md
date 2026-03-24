## Summary
- Adds Noto Sans SC via Next.js font optimization so Mandarin characters on vocabulary cards render with correct CJK strokes instead of the Latin-optimised Nunito letterforms.
- Increases the Mandarin text size in `VocabularyCard` from 24 px to 36 px, making characters immediately readable for young learners.
- Creates the missing `src/components/ui/mascot.tsx` stub component.

## Changes

### `src/app/layout.tsx`
- Added `Noto_Sans_SC` to the `next/font/google` import alongside `Nunito` and `Fredoka`.
- Configured `notoSansSC` with `subsets: ['latin']`, weights `400` and `700`, CSS variable `--font-noto-sans-sc`, and `display: 'swap'`.
- Applied `notoSansSC.variable` to the `<html>` element className so the CSS custom property is available globally at render time (prevents FOUT).

### `src/components/ui/VocabularyCard.tsx`
- Changed the Mandarin word `<p>` from `text-[24px]` / `font-family: var(--font-nunito)` to `text-[36px]` / `font-family: var(--font-noto-sans-sc)`.
- Added `leading-tight` to prevent runaway line-height at the larger size.
- Pinyin and English labels are untouched.

### `src/components/ui/mascot.tsx` (new file)
- Created a simple `<Mascot>` component (panda emoji, configurable `size` and `className` props) that was absent from the codebase.

## Testing
- `npx tsc --noEmit` — zero type errors.
- `npm test` — 212 tests across 25 suites, all passing.
- Manually verified that only the Mandarin `<p>` element receives the new font-family and size; pinyin and English word elements are unchanged.
