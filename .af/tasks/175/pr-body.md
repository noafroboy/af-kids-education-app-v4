## Summary

- Bootstraps the complete LittleBridge app from scratch: Next.js 15 + TypeScript + Tailwind CSS v4 with a full data layer, onboarding wizard, home screen, and the Explore Cards activity as an end-to-end working slice.
- Parents can complete the 5-step onboarding flow (name → age → PIN → handoff), then the child can launch Explore Cards, hear English + Mandarin audio for each vocabulary word, and see a celebration screen with confetti on completion.
- All settings (child name, age, PIN hash, onboarding status) are persisted to IndexedDB so a page refresh correctly restores the home screen without repeating onboarding.

## Changes

### Config & Scaffold
- `package.json` — declares all deps: Next 15, idb, howler, framer-motion, canvas-confetti, clsx, tailwind-merge, sharp; dev deps include jest, @testing-library/*, ts-jest, ts-node
- `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs` — standard config; Tailwind palette (coral, teal, lavender, bg-warm, parent-indigo); custom keyframes (float, blink, pulse-ring)
- `jest.config.ts` + `jest.setup.ts` — jest configured with `next/jest`, jsdom environment, module aliases, howler + canvas-confetti mocks

### Types & Data Layer
- `src/types/index.ts` — VocabularyWord, WordProgress, Setting, Session, Song, LyricLine, Category, ActivityType, MasteryLevel, MoodType
- `src/lib/vocabulary-seed.ts` — 20 words across 4 categories (animals, food, colors, body parts)
- `src/lib/songs-seed.ts` — stub songs seed
- `src/lib/db.ts` — idb openDB with 5 object stores; typed CRUD helpers
- `src/lib/progress.ts` — updateWordProgress (mastery leveling), getWeeklyStats, recordSession
- `src/lib/crypto.ts` — hashPIN / verifyPIN using Web Crypto SHA-256 + salt
- `src/lib/utils.ts` — cn(), shuffleArray, formatDate, slugify
- `src/lib/audio.ts` — Howler.js AudioManager (iOS unlock, playWord EN→ZH sequence, playEffect, preload, singleton)

### Hooks
- `src/hooks/useDB.ts` — singleton hook, opens DB once, swallows errors with console.warn
- `src/hooks/useProgress.ts` — updateWord, getAllProgress, getWeeklyStats, saveSession
- `src/hooks/useAudio.ts` — playWord, playEffect, isPlaying, audioError; iOS AudioContext unlock on mount

### App Shell
- `src/app/globals.css` — Tailwind v4 imports, CSS custom properties, tap-highlight-color reset, keyframe animations
- `src/app/layout.tsx` — Nunito + Fredoka fonts, lang="zh-CN", viewport no-scale
- `src/app/error.tsx` — bilingual friendly error screen with reset + Go Home
- `src/app/not-found.tsx` — 404 bilingual page

### UI Components
- `src/components/ui/ProgressBar.tsx` — Framer Motion animated bar
- `src/components/ui/PinPad.tsx` — 3×4 grid, 88×88px keys, 4-dot display, backspace, auto-submit after 4 digits, shake on error
- `src/components/ui/AudioButton.tsx` — 88×88px circular lavender, pulse-ring while playing, muted speaker on error
- `src/components/ui/VocabularyCard.tsx` — Next/Image with blurDataURL + onError fallback, Fredoka/Nunito typography, Framer Motion tap animation
- `src/components/ui/CelebrationOverlay.tsx` — fixed full-screen overlay, canvas-confetti on mount, star stagger animation
- `src/components/layouts/ChildLayout.tsx` — max-w-428px, fixed coral home button

### Screens & Flows
- `src/app/page.tsx` — reads onboardingComplete from DB; shows loading spinner → HomeScreen or redirects to /onboarding
- `src/components/HomeScreen.tsx` — greeting, 2×2 activity grid, start session CTA, daily word count
- `src/app/onboarding/page.tsx` — 5-step AnimatePresence wizard
- `src/components/onboarding/` — StepWelcome, StepName, StepAge, StepPin, StepHandoff
- `src/components/activities/ExploreCards.tsx` — card-by-card exploration, progress dots, audio on tap, session recording, CelebrationOverlay on completion
- `src/app/activities/explore-cards/page.tsx` — page wrapper
- Stub pages: listen-find, matching-pairs, song-time, session, parent

### Assets
- 20 DALL-E 3 vocabulary illustrations (`public/images/vocabulary/`)
- 20 English TTS audio files (`public/audio/en/`)
- 20 Mandarin TTS audio files (`public/audio/zh/`)
- 6 SFX audio files (`public/audio/sfx/`)
- `public/images/placeholder.png` — minimal PNG fallback

### Tests
- `src/__tests__/utils.test.ts` — cn, shuffleArray, formatDate, slugify (9 tests)
- `src/__tests__/crypto.test.ts` — hashPIN, verifyPIN with Web Crypto mock (4 tests)
- `src/__tests__/PinPad.test.tsx` — digit buttons, 4-digit submit, backspace (3 tests)
- `src/__tests__/VocabularyCard.test.tsx` — render, tap, audio button, image fallback (7 tests)
- `src/__tests__/CelebrationOverlay.test.tsx` — overlay render, confetti, navigation (5 tests)
- `src/__tests__/ExploreCards.test.tsx` — card progression, Done button, celebration, audio (7 tests)

## Testing

- `npm test` — 35 tests across 6 suites, all pass
- `npm run type-check` — TypeScript reports zero errors
- `npm run build` — production build compiles successfully (11 static routes)
