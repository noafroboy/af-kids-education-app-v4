# Plan — Task 175: Initialize LittleBridge from Scratch

## Status
Phase: PLANNING — no source files written yet.

---

## Assumption Audit

| Assumption | Task says | Default chosen |
|---|---|---|
| Tailwind version | "v4" but describes `tailwind.config.ts` + `@tailwind base/components/utilities` (v3 patterns) | Use Tailwind v4 CSS-first (`@import "tailwindcss"` + `@theme` blocks in globals.css) AND create `tailwind.config.ts` referenced via `@config` directive for tooling compat. If Tailwind v4 proves incompatible, fall back to v3.7 (identical API, same config shape). |
| output:export vs standalone | "output: 'export' or 'standalone'" | `output: 'export'` — entire app is client-side; no server features needed. Requires `images: { unoptimized: true }` for Next/Image to work. |
| Audio/image files not yet present | Task says "graceful fallback if files don't exist" | All audio failures are silent (console.warn); AudioButton shows muted/error state. Image 404s trigger onError handler → placeholder.png. |
| songs-seed.ts | Referenced by db.ts but no content specified | Export empty `SONGS_SEED: Song[] = []` stub. DB seeds it at first open. |
| Testing framework | Not specified | Jest + @testing-library/react + @testing-library/user-event (standard Next.js setup). |
| PIN storage | hashPIN result stored in IndexedDB settings | Store as setting key 'pinHash'. |
| Session duration | 'duration' field in Session | Computed as elapsed ms from when ExploreCards mounts to when CelebrationOverlay fires. |
| Other activity routes (/activities/listen-find, etc.) | HomeScreen has links but task only implements explore-cards | Create pages that render ChildLayout with "Coming soon" placeholder — but still working links (no 404). Actually: task says "All links must work" — create stub page files for the 3 unimplemented activities. |
| /parent route | HomeScreen links to /parent via parent-icon | Create stub /parent page so link doesn't 404. |
| /session route | start-session-btn links to /session | Create stub /session page. |
| Panda SVG in onboarding Step 5 | "Panda SVG" | Inline SVG panda (simple smiley face) to avoid external asset dependency. |
| MascotIdle component | HomeScreen has "MascotIdle small stub" | Animated div with panda emoji + float keyframe (not a separate file, inlined in HomeScreen). |

### Risks & Open Questions
1. **Tailwind v4 compatibility**: The v4 PostCSS plugin API changed. If `@tailwindcss/postcss` is unavailable, fall back to `tailwindcss` v3 with identical config.
2. **Howler.js ESM/CJS in Next.js 15**: May need `transpilePackages: ['howler']` in next.config.ts.
3. **idb SSR**: Pure ESM package; Next.js 15 handles ESM well but needs `'use client'` guard.
4. **Framer Motion v11 + Next.js 15**: `AnimatePresence` works fine in client components; no known issues.
5. **canvas-confetti types**: `@types/canvas-confetti` covers the API; dynamic import avoids SSR crash.

---

## Approach Alternatives

### Approach A — Conservative (CHOSEN)
**Strategy**: `output: 'export'` (fully static), Tailwind v4 with CSS-first config, idb for IndexedDB, Howler.js with SSR guard, all UI as 'use client' components.
**Effort**: L (many files but clear spec)
**Risk**: Low
**Trade-off**: Fully client-side; no server-side features possible without changing output mode, but that's fine for this app.

### Approach B — Ideal (not chosen)
**Strategy**: `output: 'standalone'`, add Next.js API routes for future server features (e.g. sync, auth), use React Server Components where possible.
**Effort**: L
**Risk**: Med (RSC + IndexedDB mixing is tricky; over-engineering for an offline-first kids app)
**Trade-off**: More extensible for future server features but adds unnecessary complexity and violates YAGNI for a client-only app.

### Approach Decision
**Chosen: Approach A.**
The entire LittleBridge spec is offline-first (IndexedDB, no backend). `output: 'export'` is the correct output mode. SSR adds zero value and creates multiple hazards (IndexedDB/Howler/canvas-confetti all need window). Static export with client-side routing is safer, simpler, and easier to test.

---

## Production-Readiness Checklist

### 1. Persistence
IndexedDB via `idb` library. `openDB('littlebridge', 1)` with 5 stores: `vocabulary`, `progress`, `settings`, `sessions`, `songs`. Singleton hook `useDB` opens once per app session. All user data (child name, age, PIN hash, word progress, sessions) persisted to IndexedDB. Settings (including `onboardingComplete`) survive page refresh. No module-scope Map/Set/Array used as primary storage.

### 2. Error Handling
- DB operations: try/catch in all helper functions; errors propagated to hooks; hooks expose `error` state used to render error UI.
- Audio: Howler `onloaderror`/`onplayerror` → `console.warn` + `audioError` flag; AudioButton renders muted/error state.
- Image 404: Next/Image `onError` → sets `imgSrc` state to `/images/placeholder.png`.
- Route errors: `src/app/error.tsx` renders bilingual error screen with 'Try Again' + 'Go Home'.
- 404: `src/app/not-found.tsx` renders bilingual 404 screen.
- Crypto: `hashPIN`/`verifyPIN` wrapped in try/catch; if Web Crypto unavailable (very old browser), throws with user-visible message.

### 3. Input Validation
- Onboarding Step 2 (Name): client-side validation — non-empty after trim; 'Next' button disabled if empty.
- Onboarding Step 3 (Age): 'Next' disabled until age tile selected.
- Onboarding Step 4 (PIN): PinPad enforces exactly 4 digits before calling onSubmit. No server-side validation needed (client-only app).
- PIN pad: only digits 0–9 accepted (other keys ignored); backspace only active when buffer non-empty.

### 4. Loading States
- Root page: while checking `onboardingComplete` from IndexedDB, shows centered panda emoji + 'Loading... / 加载中...' spinner.
- ExploreCards: while loading words from DB, shows skeleton/loading state.
- HomeScreen: while loading childName and daily word count, shows placeholder text.
- Audio: AudioButton shows pulse-ring animation while playback is active.

### 5. Empty States
- ExploreCards with no words in DB: falls back to showing VOCABULARY_SEED directly (DB seeded on first open so this shouldn't occur, but defensive check included).
- HomeScreen with no childName: shows '你好! / Hello!' (empty string fallback).
- CelebrationOverlay with 0 words: hides word count line if wordCount === 0.
- Sessions with no history: getWeeklyStats returns `{wordsThisWeek: 0, streak: 0, totalLearned: 0}`.

### 6. Security
- No API keys. No external API calls.
- PIN stored as SHA-256 hex hash (with salt 'littlebridge-2026'), never plain text.
- No `dangerouslySetInnerHTML` anywhere.
- No user input rendered as HTML.
- Child name sanitized via `trim()` before storage and display.
- `NEXT_TELEMETRY_DISABLED=1` in next.config.ts.

### 7. Component Size
All files planned under 150 lines. Key extractions:
- `src/app/onboarding/page.tsx` → wizard controller only (~80 lines); each step extracted to `src/components/onboarding/Step*.tsx`.
- `src/components/HomeScreen.tsx` → imports ActivityGrid inline (small enough to stay in file given 2×2 grid).
- `src/components/activities/ExploreCards.tsx` → uses VocabularyCard, AudioButton, CelebrationOverlay as sub-components.
- `src/lib/db.ts` → split if needed: db-open.ts (openDB) + db-helpers.ts. Will evaluate at implementation time.

### 8. Test Coverage
| Area | Happy Path | Error Path | Edge Case |
|---|---|---|---|
| utils.ts | cn(), shuffleArray, formatDate, slugify | — | Empty input |
| crypto.ts | hashPIN, verifyPIN correct | verifyPIN wrong PIN | — |
| PinPad | Auto-submit at 4 digits | — | Backspace, no overflow past 4 |
| VocabularyCard | Renders all fields | Image onError fallback | — |
| CelebrationOverlay | Renders with props, buttons present | — | wordCount=0 |
| ExploreCards | Full flow, completion overlay | — | Single word list |

---

## File Map

### Configuration (5 files)
```
package.json                    — deps, scripts (dev, build, test, lint)
tsconfig.json                   — strict: true, paths alias @/→src/
next.config.ts                  — output:'export', images.unoptimized, telemetry off
tailwind.config.ts              — colors, fonts, keyframes, spacing
postcss.config.mjs              — tailwindcss + autoprefixer plugins
```

### Test Infrastructure (2 files)
```
jest.config.ts                  — Next.js jest preset, moduleNameMapper
jest.setup.ts                   — @testing-library/jest-dom, mock matchMedia/IntersectionObserver
```

### Types (1 file)
```
src/types/index.ts              — All shared TypeScript types and enums
```

### Libraries (6 files)
```
src/lib/utils.ts                — cn, shuffleArray, formatDate, slugify
src/lib/crypto.ts               — hashPIN, verifyPIN (Web Crypto)
src/lib/vocabulary-seed.ts      — VOCABULARY_SEED: 20 VocabularyWord objects
src/lib/songs-seed.ts           — SONGS_SEED: [] stub
src/lib/db.ts                   — openDB, 5 stores, typed helpers
src/lib/progress.ts             — updateWordProgress, getWeeklyStats, recordSession
src/lib/audio.ts                — AudioManager class + singleton audioManager
```

### Hooks (3 files)
```
src/hooks/useDB.ts              — singleton IDBDatabase hook
src/hooks/useProgress.ts        — progress operations hook
src/hooks/useAudio.ts           — audio playback hook with iOS unlock
```

### App Shell (4 files)
```
src/app/globals.css             — @import tailwindcss, @theme, CSS vars, touch rules
src/app/layout.tsx              — Fonts, html lang, viewport meta, metadata
src/app/error.tsx               — Client ErrorBoundary: bilingual + reset + home
src/app/not-found.tsx           — Bilingual 404 + home button
```

### Pages (4 + 4 stub pages)
```
src/app/page.tsx                                     — Root: DB check → HomeScreen or /onboarding
src/app/onboarding/page.tsx                          — 5-step AnimatePresence wizard
src/app/activities/explore-cards/page.tsx            — ExploreCards wrapped in ChildLayout
src/app/activities/listen-find/page.tsx              — Stub (coming in later task)
src/app/activities/matching-pairs/page.tsx           — Stub
src/app/activities/song-time/page.tsx                — Stub
src/app/parent/page.tsx                              — Stub parent dashboard
src/app/session/page.tsx                             — Stub guided session
```

### UI Components (5 files)
```
src/components/ui/ProgressBar.tsx       — Framer Motion animated bar
src/components/ui/PinPad.tsx            — 3×4 grid, 4-circle display, auto-submit
src/components/ui/AudioButton.tsx       — 88px circular, pulse-ring, error state
src/components/ui/VocabularyCard.tsx    — Image+text card, tap-to-play, placeholder fallback
src/components/ui/CelebrationOverlay.tsx — confetti, stars, bilingual, two actions
```

### Layout (1 file)
```
src/components/layouts/ChildLayout.tsx  — max-w-428px, fixed home button
```

### Onboarding Step Components (5 files)
```
src/components/onboarding/StepWelcome.tsx   — logo, tagline, CTA
src/components/onboarding/StepName.tsx      — name input
src/components/onboarding/StepAge.tsx       — 4 age tiles
src/components/onboarding/StepPin.tsx       — PinPad wrapper
src/components/onboarding/StepHandoff.tsx   — panda SVG, let's play button
```

### Feature Components (2 files)
```
src/components/HomeScreen.tsx           — greeting, activity grid, stats
src/components/activities/ExploreCards.tsx — card carousel, progress tracking
```

### Public Assets (1 file + directories)
```
public/images/placeholder.png           — coral placeholder image (1-color PNG)
public/images/vocabulary/               — (empty dir, assets seeded by Task 1)
public/audio/en/                        — (empty dir)
public/audio/zh/                        — (empty dir)
public/audio/sfx/                       — (empty dir)
```

### Tests (6 files)
```
src/__tests__/utils.test.ts
src/__tests__/crypto.test.ts
src/__tests__/PinPad.test.tsx
src/__tests__/VocabularyCard.test.tsx
src/__tests__/CelebrationOverlay.test.tsx
src/__tests__/ExploreCards.test.tsx
```

### Plan Artifacts
```
.af/tasks/175/plan.json
.af/tasks/175/plan.md
```

---

## Implementation Order

1. `package.json` + `tsconfig.json` + `npm install`
2. `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
3. `src/types/index.ts`
4. `src/lib/utils.ts`, `src/lib/crypto.ts`
5. `src/lib/vocabulary-seed.ts`, `src/lib/songs-seed.ts`, `src/lib/db.ts`
6. `src/lib/progress.ts`, `src/lib/audio.ts`
7. `src/hooks/useDB.ts`, `src/hooks/useProgress.ts`, `src/hooks/useAudio.ts`
8. `src/app/globals.css`, `src/app/layout.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`
9. UI primitives: ProgressBar → PinPad → AudioButton → VocabularyCard → CelebrationOverlay
10. `src/components/layouts/ChildLayout.tsx`
11. Onboarding step components (5 files)
12. `src/app/onboarding/page.tsx`
13. `src/components/HomeScreen.tsx`, `src/app/page.tsx`
14. `src/components/activities/ExploreCards.tsx`, `src/app/activities/explore-cards/page.tsx`
15. Stub pages (listen-find, matching-pairs, song-time, parent, session)
16. `public/images/placeholder.png`
17. `jest.config.ts`, `jest.setup.ts`, all `src/__tests__/*.test.{ts,tsx}`
18. `npm test` → fix failures → commit → push

---

## Key Design Decisions

### D1: Tailwind v4 CSS-First Config
Use `@import "tailwindcss"` in globals.css with `@theme { --color-coral: #FF6B35; ... }` blocks. Create `tailwind.config.ts` for IDE tooling and keyframe definitions, referenced via `@config "../../tailwind.config.ts"` directive. If v4 PostCSS package unavailable, use Tailwind v3.7 (identical tailwind.config.ts shape).

### D2: IndexedDB as single source of truth
All user state lives in IndexedDB. Components read via useDB hook and write through typed helpers. The `onboardingComplete` setting key is the feature flag for routing. No localStorage fallback — idb is more reliable for larger data.

### D3: Howler.js dynamic import with SSR guard
```typescript
// In AudioManager constructor:
if (typeof window === 'undefined') return;
const { Howl, Howler } = await import('howler');
```
This prevents the build crash when Next.js processes audio.ts during static generation.

### D4: Onboarding as local state machine
`onboarding/page.tsx` holds all wizard state (step, childName, childAge, pinHash) in useState. Each step component receives props + onNext callback. No global state needed — data written to IndexedDB only at final step.

### D5: ExploreCards session tracking
ExploreCards records `startedAt` on mount. On completion calls `recordSession(db, {activityType:'explore', wordIds, correctCount: wordIds.length, duration: Date.now()-startedAt, ...})`. Uses `updateWordProgress(db, wordId, true)` for each seen word.

### D6: Stub pages for unimplemented activities
Rather than broken links, create minimal stub pages (`src/app/activities/listen-find/page.tsx` etc.) that render a friendly bilingual "Coming soon / 敬请期待" message inside ChildLayout. This satisfies "all links must work" requirement.

---

## Critical Implementation Notes

### next.config.ts
```typescript
const config = {
  output: 'export',
  images: { unoptimized: true },  // required for output:export
  env: { NEXT_TELEMETRY_DISABLED: '1' },
};
```

### Vocabulary Seed — 20 words across 4 categories
```
Animals (5):  cat/猫/māo, dog/狗/gǒu, rabbit/兔子/tùzi, fish/鱼/yú, bird/鸟/niǎo
Food (5):     apple/苹果/píngguǒ, banana/香蕉/xiāngjiāo, milk/牛奶/niúnǎi, egg/鸡蛋/jīdàn, rice/米饭/mǐfàn
Colors (5):   red/红色/hóngsè, blue/蓝色/lánsè, yellow/黄色/huángsè, green/绿色/lǜsè, pink/粉色/fěnsè
Body Parts(5): eyes/眼睛/yǎnjing, nose/鼻子/bízi, mouth/嘴/zuǐ, hand/手/shǒu, foot/脚/jiǎo
```

### PinPad auto-submit logic
```
digits: string[] (max 4)
onDigit(d) → if digits.length < 4: add digit; if digits.length+1 === 4: call onSubmit(newValue)
onBack() → remove last digit
onClear() → reset to []
```

### CelebrationOverlay confetti
```typescript
useEffect(() => {
  import('canvas-confetti').then(({default: confetti}) => {
    confetti({ angle: 60, spread: 70, particleCount: 100, origin: {x: 0.2, y: 0.5}, colors: ['#FF6B35','#4ECDC4','#C7B8EA'] });
    confetti({ angle: 120, spread: 70, particleCount: 100, origin: {x: 0.8, y: 0.5}, colors: ['#FF6B35','#4ECDC4','#C7B8EA'] });
  });
}, []);
```

### iOS AudioContext unlock (useAudio hook)
```typescript
useEffect(() => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    const unlock = () => { audioManager.unlockAudioContext(); window.removeEventListener('click', unlock); };
    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);
  }
}, []);
```
