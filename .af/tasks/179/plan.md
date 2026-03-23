# Task 179 Plan: Guided Session Flow, MascotIdle, MoodCheck, CategorySelector, Idle Timeout

## Assumption Audit

Before planning, I analyzed the codebase and identified these assumptions and clarifications:

### What the codebase already provides (no changes needed):
- `Category`, `MoodType`, `ActivityType`, `Session` types all exist in `src/types/index.ts`
- `ExploreCards` already accepts `wordList?: VocabularyWord[]` prop (was built for this use case)
- `CelebrationOverlay` accepts `childName`, `wordCount`, `onPlayMore?` and handles "Go Home" via internal `router.push('/')` — no `onGoHome` prop needed
- `useProgress.saveSession()` calls `recordSession()` → `addSession()` which uses the existing `sessions` IndexedDB store
- `getAllProgress()` exported from `src/lib/db` — can filter for unmastered words

### What DOES need changing:
- `ExploreCards` lacks an `onComplete?: () => void` callback — task explicitly requires it. Adding it is a minimal 3-line change that won't break existing tests.
- `ChildLayout` is a thin wrapper — needs idle timeout + MascotIdle wired in.
- `session/page.tsx` is a placeholder — must be replaced entirely.

### Task does NOT specify:
- Where CategorySelector is actually used (no route/page listed) — it's a standalone deliverable; I'll build it as a prop-driven pure component (parent supplies category data + counts).
- Exact word counts per category — CategorySelector accepts `categories` as a prop so the parent can supply real DB-fetched counts. This avoids coupling CategorySelector to DB access.
- Whether "All Categories" passes `null` or `'all'` to onSelect — I'll use `'all'` string for type clarity (`Category | 'all'`).
- Whether GreetingStep must be a separate file — extracted to keep GuidedSession under 150 lines (Iron Law 3).

### Risks & Open Questions
1. **`whoosh` SFX existence**: Task says `audioManager.playEffect('whoosh')`. The `playEffect` method exists; `'whoosh'` is assumed to be a valid sound name based on task spec. If the file doesn't exist, Howler's error handling swallows it gracefully.
2. **Auto-advance + tap race**: Step 0 auto-advances at 3s. If user taps the button before 3s, the `clearTimeout` in the step effect cleanup handles it.
3. **DB not ready when mood selected**: User could tap a mood emoji before `db` is initialized. `fetchWords` guards with `if (!db) return` and the loading spinner on step 2 covers the rare case.
4. **`repeatDelay` in Framer Motion blink**: Using `repeatDelay: 2.8, duration: 0.2` for 3s blink period. This is Framer Motion v11 compatible.

---

## Approach Alternatives

### Approach A: Conservative — Minimal files, use existing patterns
Build each component as specified; extract only one sub-component (GreetingStep) to stay under 150 lines; add `onComplete` to ExploreCards with minimal diff; use existing hooks (useDB, useProgress, useAudio).
- **Effort:** M
- **Risk:** Low
- **Trade-off:** Slightly more logic in GuidedSession.tsx but predictable structure that mirrors existing activity components.

### Approach B: Ideal — Full extraction per step
Create a `src/components/session/` directory with separate files for each of the 4 steps (GreetingStep, MoodCheckStep, ExploreStep, CelebrationStep), plus a step-router component.
- **Effort:** L
- **Risk:** Med (more files = more tests to write; the 4 steps are simple enough that extraction adds overhead without clear benefit yet)
- **Trade-off:** Better long-term extensibility (easy to add step 5) but over-engineered for 4 simple steps.

## Approach Decision

**Chosen: Approach A (Conservative)**, with one targeted extraction:
- Extract `GreetingStep` into `src/components/session/GreetingStep.tsx` because it's the most self-contained step with its own auto-timer logic and animation.
- The other three steps (MoodCheck, ExploreCards, CelebrationOverlay) are already standalone components — GuidedSession just renders them inline.
- This keeps GuidedSession.tsx under 145 lines while staying legible.

---

## Production-Readiness Checklist

### 1. Persistence
Session data is written to IndexedDB via `addSession()` (existing `sessions` store in `littlebridge` DB, key `id` auto-increment). Guided sessions use `activityType: 'guidedSession'` and include `mood`, `wordIds`, `startedAt`, `completedAt`, `duration`. Data survives page refresh and browser restart (IndexedDB is persistent).

### 2. Error Handling
- `fetchWords` in GuidedSession: `try/catch` — on failure, `words` stays empty and step 2 renders a loading/error state (no crash).
- `saveSession` in `handleExploreComplete`: `.catch(() => {})` — session save failure is non-blocking; celebration still shows (child experience uninterrupted).
- `getSetting` for `childName`: `.catch(() => {})` — name stays empty string, CelebrationOverlay renders without a name.
- `useIdleTimeout`: No external calls; pure timer/event logic — no error surface.
- All DB guard: `if (!db) return` pattern consistent with existing codebase.

### 3. Input Validation
- `MoodType` values are selected via button click only (no free text) — no validation needed beyond type narrowing.
- `Category` selections in CategorySelector are from a fixed enum — no free input.
- No server-side component; this is all client-side state machine — N/A for server validation.

### 4. Loading States
- GuidedSession step 2: when `words.length === 0` (DB still fetching), renders a centered panda spinner before ExploreCards appears.
- Step 0 auto-advance requires no loading state (no async).
- ChildLayout renders MascotIdle unconditionally (it's always present, no loading needed).

### 5. Empty States
- `fetchWords` fallback: if no unmastered words exist AND all-words list is empty (edge case: empty DB), GuidedSession shows an error message "No words found / 没有找到词语" with a Go Home button.
- CategorySelector with zero categories: renders only the "All Categories" tile — grid is valid.
- MoodCheck: always renders 3 options — no empty state needed.

### 6. Security
- No API keys involved. No user-generated text submitted anywhere in this task.
- IndexedDB access is same-origin only — no cross-origin exposure.
- N/A for prompt injection (no LLM).

### 7. Component Size
Planned line counts (enforced under 150 lines each):
| File | Est. Lines |
|------|-----------|
| `useIdleTimeout.ts` | ~55 |
| `MascotIdle.tsx` | ~135 |
| `MoodCheck.tsx` | ~65 |
| `CategorySelector.tsx` | ~85 |
| `session/GreetingStep.tsx` | ~55 |
| `GuidedSession.tsx` | ~145 |
| `ChildLayout.tsx` (modified) | ~55 |
| `session/page.tsx` (modified) | ~15 |

ExploreCards.tsx will grow slightly (~165 lines) due to the `onComplete` addition — still under 200 lines (iron law limit).

### 8. Test Coverage
Tests written for all new components:

| Test File | Coverage |
|-----------|---------|
| `useIdleTimeout.test.ts` | enabled=false no-op; 30s callback; 60s callback; event resets timers; cleanup on unmount |
| `MascotIdle.test.tsx` | renders; speech bubble show/hide; onClick fires |
| `MoodCheck.test.tsx` | renders 3 buttons; each calls onMoodSelected with correct MoodType |
| `CategorySelector.test.tsx` | renders all tiles; All tile present; onSelect called correctly |
| `GuidedSession.test.tsx` | greeting step initial render; proceed btn; mood selection → step 2; explore complete → step 3 |

Existing tests are not modified. ExploreCards tests remain green (onComplete is optional, not passed in tests).

---

## Detailed Implementation Plan

### Step 1: `src/hooks/useIdleTimeout.ts`

```
Params: { enabled: boolean, onIdle30: () => void, onIdle60: () => void }
Returns: { resetTimers: () => void }

Internals:
- useRef for idle30Timer, idle60Timer (timeout IDs)
- useRef for onIdle30Ref, onIdle60Ref (stable callback refs, updated every render)
- useEffect [enabled]:
    if !enabled: clear any existing timers, return
    define reset() fn: clear both timers, set new 30s + 60s timeouts
    call reset() immediately (start timers on mount)
    add window listeners: 'pointerdown', 'pointermove', 'keydown' → reset
    cleanup: remove listeners, clear timers
- Return { resetTimers: wrapper around current reset fn via ref }
```

### Step 2: `src/components/ui/MascotIdle.tsx`

```
Props: { size?: 'sm'|'md'|'lg', showBubble?: boolean, onClick?: () => void, className?: string }
Size map: sm=56, md=96, lg=140

Inline SVG panda face (viewBox 0 0 100 100):
- White oval head (ellipse cx=50 cy=52 rx=40 ry=38, fill white, stroke black)
- Black ear circles (two circles at top-left/top-right of head)
- Black eye patches (two rounded rects, animated height via Framer Motion for blink)
- White eye whites (small circles inside patches)
- Black pupils (tiny circles inside whites)
- Black nose (small oval cx=50 cy=60)
- Mouth (path or arc, cheerful curve)

Float animation: <motion.div animate={{y:[0,-8,0]}} transition={{repeat:Infinity,duration:2.2,ease:'easeInOut'}}>

Blink animation: on the eye-patch <motion.rect>:
  animate={{ height: 12 }} (normal) → every 3s triggers blink
  Use useEffect + setInterval to toggle blink state, Framer Motion animates height.
  Implementation: useState(false) isBlinking
  setInterval 3000ms → setIsBlinking(true) → setTimeout 200ms → setIsBlinking(false)
  animate={{ height: isBlinking ? 2 : 12 }} transition={{ duration: 0.15 }}

Speech bubble: AnimatePresence → when showBubble:
  <motion.div initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0,opacity:0}}
    className="absolute bottom-full mb-2 bg-[#FF6B35] text-white rounded-2xl px-3 py-2 text-sm"
    style={{fontFamily:'var(--font-fredoka)'}}
  >
    Tap me! / 点我玩！
    (triangle arrow pointing down: ::after pseudo or inline div)
  </motion.div>
```

### Step 3: `src/components/activities/ExploreCards.tsx` — minimal edit

Add `onComplete?: () => void` to `ExploreCardsProps`.
In `handleNext`, when `currentIndex >= words.length - 1`:
```
if (onComplete) {
  onComplete();
  return;
}
// existing: await saveSession(...); setComplete(true);
```

### Step 4: `src/components/layouts/ChildLayout.tsx` — update

```
Add imports: useState, useRouter, useIdleTimeout, MascotIdle
Add state: showMascotBubble (boolean)
Add router = useRouter()
Wire useIdleTimeout({ enabled: !isHome, onIdle30: ()=>setShowMascotBubble(true), onIdle60: ()=>router.push('/') })
Add onPointerDown={() => setShowMascotBubble(false)} to root div
Add <MascotIdle size="sm" showBubble={showMascotBubble} onClick={()=>setShowMascotBubble(false)}
  className="fixed bottom-20 z-40" style={{left:'max(1rem,calc(50vw - 214px + 1rem))'}} />
  (positioned symmetrically to home button on opposite side)
```

### Step 5: `src/components/MoodCheck.tsx`

```
data-testid='mood-check'
Heading: '今天怎么样? / How are you feeling?' (Fredoka One 28px)
3 emoji buttons, each 96×96px min:
  😊 data-testid='mood-happy' → onMoodSelected('happy')
  😐 data-testid='mood-okay'  → onMoodSelected('okay')
  😴 data-testid='mood-tired' → onMoodSelected('tired')
Each: <motion.button whileTap={{scale:0.85}}>
  <span className="text-5xl">{emoji}</span>
  <span style={{fontFamily:'var(--font-nunito)'}} className="text-base">{enLabel}</span>
  <span style={{fontFamily:'var(--font-nunito)'}} className="text-sm text-slate-400">{zhLabel}</span>
</motion.button>
```

### Step 6: `src/components/CategorySelector.tsx`

```
Props:
  interface CategoryItem { category: Category; label: string; labelZh: string; emoji: string; wordCount: number }
  { categories: CategoryItem[], onSelect: (cat: Category | 'all') => void }

data-testid='category-selector'
Grid: grid-cols-2, auto-rows
First tile: "All / 全部" tile (special) → onSelect('all')
Then: map categories → tile with emoji, EN label (Fredoka One), ZH label (Nunito), '{N} words' badge
Each tile: min-h-[88px], rounded-2xl, shadow-sm, bg-white, tap border highlight
```

### Step 7: `src/components/session/GreetingStep.tsx`

```
Props: { onProceed: () => void }
- MascotIdle size='lg' centered
- motion.h2 with '我们来学习吧! / Let\'s learn!' (Fredoka One 32px)
  optional letter stagger with AnimatePresence
- useEffect: setTimeout 3000ms → onProceed(); clearTimeout on unmount
- <button data-testid='session-proceed-btn' onClick={onProceed} min-h-[88px]>
    Let's Go! / 出发！
  </button>
```

### Step 8: `src/components/GuidedSession.tsx`

```
State: step(0-3), mood(MoodType|null), words(VocabularyWord[]), childName, loadingWords(bool)
Refs: startedAt(string)

useEffect [db]: fetch childName from settings

useEffect [db, step]: when step===0, play 'whoosh' effect (guards for !db)

async fetchWords():
  loadingWords=true
  const [all, allProgress] = await Promise.all([getAllWords, getAllProgress])
  build progressMap → filter unmastered (masteryLevel < 2)
  pool = unmastered.length >= 3 ? unmastered : all
  selected = shuffleArray(pool).slice(0, 3)
  setWords(selected)
  loadingWords=false

async handleMoodSelected(m: MoodType):
  setMood(m)
  await fetchWords()
  setStep(2)

async handleExploreComplete():
  await saveSession({ activityType:'guidedSession', mood, wordIds, ... }).catch(()=>{})
  setStep(3)

async handlePlayMore():
  await fetchWords()
  startedAt.current = new Date().toISOString()
  setStep(2)

render:
  AnimatePresence mode='wait' with variants {enter:{x:300,opacity:0}, center:{x:0,opacity:1}, exit:{x:-300,opacity:0}}
  step 0: <GreetingStep onProceed={()=>setStep(1)} />
  step 1: <MoodCheck onMoodSelected={handleMoodSelected} /> (wrapped in data-testid div)
  step 2: loadingWords → spinner; else <ExploreCards wordList={words} onComplete={handleExploreComplete} />
  step 3: <CelebrationOverlay childName={childName} wordCount={words.length} onPlayMore={handlePlayMore} />
```

### Step 9: `src/app/session/page.tsx`

```tsx
'use client';
import { ChildLayout } from '@/components/layouts/ChildLayout';
import { GuidedSession } from '@/components/GuidedSession';

export default function SessionPage() {
  return (
    <ChildLayout showHomeButton={true}>
      <GuidedSession />
    </ChildLayout>
  );
}
```

---

## File Dependency Graph

```
useIdleTimeout.ts
    └── ChildLayout.tsx

MascotIdle.tsx
    ├── ChildLayout.tsx
    └── GuidedSession.tsx (via GreetingStep)

GreetingStep.tsx
    ├── MascotIdle.tsx
    └── GuidedSession.tsx

MoodCheck.tsx
    └── GuidedSession.tsx

CategorySelector.tsx
    └── (standalone, not wired into session flow)

GuidedSession.tsx
    ├── GreetingStep.tsx
    ├── MoodCheck.tsx
    ├── ExploreCards.tsx (+ onComplete prop)
    ├── CelebrationOverlay.tsx
    ├── useDB, useProgress, useAudio
    └── db (getAllWords, getAllProgress, getSetting)

session/page.tsx
    ├── ChildLayout.tsx
    └── GuidedSession.tsx
```

---

## Test Mocking Strategy

All test files will mock:
- `framer-motion`: standard mock (motion.div → plain div, AnimatePresence → fragment)
- `next/navigation`: `{ useRouter: () => ({ push: mockPush }), usePathname: () => '/session' }`
- `@/hooks/useDB`: returns `null` (components guard with `if (!db)`)
- `@/hooks/useProgress`: mock `saveSession`, `updateWord`
- `@/hooks/useAudio`: mock `playEffect`, `playWord`
- `canvas-confetti`: already mocked in `src/__mocks__/canvas-confetti.ts`
- `next/image`: already mocked in existing tests

For `useIdleTimeout` tests: use `jest.useFakeTimers()` to control setTimeout behavior.
