# Task 177 Plan: Listen & Find + Matching Pairs Activities

## Assumption Audit

### Ambiguous Requirements & Chosen Defaults

| Ambiguity | Assumption / Default |
|---|---|
| "5–6 words" for a round | Pick exactly **6** words (shuffleArray().slice(0,6)); fewer only if DB has < 6 words |
| Age setting key in IndexedDB | `'childAge'` (consistent with onboarding StepAge); fallback default = **4** so activity works before onboarding |
| "correctFirst" in onComplete stats | Number of words where the *first* tap was correct (wrongAttempts === 0 at the time of correct tap) |
| Distractors "same category preferred, fallback random" | Try to fill with same-category words first; if < N-1 same-category, pad with random from other categories |
| "Wait 1200ms, advance" for correct tap | 1200ms from the moment tap registers; the green animation plays during this wait |
| "bilingual text 2s, then advance" after reveal | 2000ms from moment reveal triggers; advance happens silently (no audio) |
| "correct word count" in CelebrationOverlay for ListenAndFind | `stats.correctFirst` — words answered correctly on first attempt (spirit of "learned") |
| "correct word count" for MatchingPairs | Total `wordIds` in session (all matched words = all words attempted, since game continues until all match) |
| CSS-only flip vs Framer Motion flip for MatchingPairs | **CSS 3D transform** (as spec says) — no Framer Motion for the flip itself; Framer Motion only for matched glow |
| `playWordEn` — just fire-and-forget or Promise? | **fire-and-forget `void`** — simpler; no downstream code needs to await the audio finishing |

### What the Task Does NOT Specify (and chosen defaults)
- Whether MatchingPairs "New Game" reshuffles same words or picks new ones → **picks new random words** (same UX as ExploreCards "Play Again")
- Whether CelebrationOverlay for MatchingPairs shows a different message → **reuse same overlay** with stars prop
- Whether ListenAndFind images should be square or can be any shape → **square 120×120px minimum**, consistent with spec
- Whether `wordCount` in CelebrationOverlay for ListenAndFind = attempted or correct → **correctFirst** (correct first-attempt count)

### Risks & Open Questions
1. **`childAge` key**: If onboarding stores age under a different key (e.g. `'age'`), the activities default to age 4. Low risk — fallback is safe.
2. **Audio auto-play blocking**: Browsers block audio on page load without user gesture. Our pages load the activity behind a tap from HomeScreen, so the first user interaction (that tap) typically unlocks audio. The iOS unlock in `useAudio` further mitigates this. Risk: acceptable.
3. **IDB transaction API typing**: The existing `progress.ts` casts `db as never` for typing mismatches. The transaction refactor may require similar casting. Will keep same pattern.

---

## Approach Alternatives

### APPROACH A: Conservative ⬅ CHOSEN
- **Description**: Mirror ExploreCards patterns exactly. Pages load data, pass `wordList` + `age` props to components. Components are pure presentational logic driven by state. Extract ChoiceCard and FlipCard only to stay under 150 lines. No new hooks, no shared state.
- **Effort**: M
- **Risk**: Low
- **Trade-off**: Small duplication of DB-loading code between pages (listen-find and matching-pairs pages both do the same `getDB → getAllWords → getSetting` dance), but this is the same pattern already in ExploreCards.

### APPROACH B: Ideal
- **Description**: Extract a shared `useActivitySetup` hook that handles DB loading + settings; create a typed `ActivityPage` wrapper component; use Framer Motion AnimatePresence for cross-component transitions.
- **Effort**: L
- **Risk**: Medium (new abstractions introduce surface area for bugs; AnimatePresence + 3D flip interaction in tests is fragile)
- **Trade-off**: Better long-term DRY, but adds complexity not required by this task.

## Approach Decision
**Choosing Approach A (Conservative).**

The existing ExploreCards implementation is the proven pattern for this codebase. The 3-4 lines of duplicated DB-loading code across pages is acceptable given the strict 150-line limit and the risk of new abstractions. Approach B's benefits (shared hook) don't outweigh the risk of introducing bugs via new shared state on the first iteration of these activities.

---

## Production-Readiness Checklist

### 1. Persistence
**IndexedDB via idb library.** Both activities call `updateWordProgress(wordId, true)` on correct answers and `recordSession(...)` on completion. All data survives page refresh — stored in the `progress` and `sessions` object stores of the `littlebridge` IndexedDB. The HomeScreen reads `sessions` to compute `todayWords`, which will increment after each completed activity.

`updateWordProgress` will be patched to use an IDB readwrite transaction (`db.transaction('progress', 'readwrite')`) to prevent interleaved reads/writes on rapid consecutive calls (e.g. MatchingPairs matching two pairs in quick succession).

### 2. Error Handling
- **Pages**: All DB calls wrapped in `try/catch`. On error, render a visible error message: *"Could not load words. / 无法加载词语。"* with a Go Home button.
- **Components**: Accept `wordList` prop; they never call DB directly. All DB errors surface at page level only.
- **Audio**: `useAudio` already swallows errors via `console.warn`. Audio failure is non-blocking — activity continues without sound.
- **Progress updates**: Wrapped in `try/catch` in components; failure logs a warning but does not crash the activity.

### 3. Input Validation
N/A — no user-typed input in these activities. User input = taps on cards, which are validated against the card state (isFlipped, isMatched, isLocked guards).

### 4. Loading States
Both pages show a loading spinner (🐼 animate-float, same as ExploreCards) while `useDB` resolves and words are fetched. The `isLoading` flag gates rendering the activity component.

### 5. Empty States
Both pages check `words.length === 0` after loading and show: *"No words found. / 没有找到词语。"* (same pattern as ExploreCards). This handles fresh installs where vocabulary hasn't seeded yet (shouldn't happen — vocabulary seeds on DB creation, but defensive).

### 6. Security
N/A — no API keys involved. No user input flows into any API or LLM. App runs entirely client-side. No authentication changes needed.

### 7. Component Size
All files planned under 150 lines via upfront extraction:
- `ChoiceCard.tsx` ~55 lines (image card with animation states)
- `ListenAndFind.tsx` ~130 lines
- `FlipCard.tsx` ~65 lines (CSS 3D flip)
- `MatchingPairs.tsx` ~130 lines
- Each page ~60 lines

### 8. Test Coverage
**Happy path**: correct tap, matching pair, completion overlay.
**Error/edge cases**: wrong tap (no credit), 2 wrong → reveal (no credit), double-tap guard, non-matching pair revert, age-based grid sizing.

---

## File Plan

### Files to Modify
| File | Change |
|---|---|
| `src/lib/progress.ts` | Wrap `updateWordProgress` in IDB readwrite transaction |
| `src/lib/audio.ts` | Add `playWordEn(path: string): void` method |
| `src/hooks/useAudio.ts` | Expose `playWordEn` |
| `src/components/ui/CelebrationOverlay.tsx` | Add optional `stars?: number` prop (default 3) |
| `src/app/activities/listen-find/page.tsx` | Replace stub with full implementation |
| `src/app/activities/matching-pairs/page.tsx` | Replace stub with full implementation |

### Files to Create
| File | Purpose |
|---|---|
| `src/components/activities/ChoiceCard.tsx` | Image-only choice card with correct/wrong/reveal animation states |
| `src/components/activities/ListenAndFind.tsx` | Core Listen & Find logic and layout |
| `src/components/activities/FlipCard.tsx` | CSS 3D flip card (front + EN back + ZH back) |
| `src/components/activities/MatchingPairs.tsx` | Core Matching Pairs logic and layout |
| `src/__tests__/ListenAndFind.test.tsx` | Unit tests for Listen & Find |
| `src/__tests__/MatchingPairs.test.tsx` | Unit tests for Matching Pairs |

---

## Implementation Detail

### ListenAndFind Internal State
```
currentWordIndex: number       // which word in the round
wrongAttempts: number          // wrong taps for current word
cardState: Map<wordId, 'idle'|'correct'|'wrong'|'reveal'>
choices: VocabularyWord[]      // current round's N choices
isAdvancing: boolean           // lock during 1200ms correct delay
isRevealing: boolean           // lock during 2000ms reveal delay
correctFirst: number           // count of words answered on first attempt
```

### Round Advance Logic
```
mount / next word:
  reset wrongAttempts = 0
  reset cardState to all 'idle'
  pick choices (1 correct + N-1 distractors)
  playWordEn(targetWord.audioEnPath)

onCorrectTap(word):
  if isAdvancing || isRevealing: return
  cardState[word.id] = 'correct'
  if wrongAttempts === 0: correctFirst++
  playEffect('correct')
  updateWord(word.id, true)
  isAdvancing = true
  setTimeout(1200, advance)

onWrongTap(word):
  if isAdvancing || isRevealing: return
  cardState[word.id] = 'wrong'
  playEffect('incorrect')
  wrongAttempts++
  setTimeout(400, () => cardState[word.id] = 'idle')  // clear shake after animation
  if wrongAttempts >= 2: triggerReveal()

triggerReveal():
  cardState[correctWord.id] = 'reveal'
  isRevealing = true
  // show bilingual text
  setTimeout(2000, advance)  // no updateWord call

advance():
  if currentWordIndex >= round.length - 1:
    onComplete({ wordsAttempted: round.length, correctFirst, duration })
    saveSession(...)
  else:
    currentWordIndex++
    isAdvancing = false
    isRevealing = false
```

### MatchingPairs Internal State
```
cards: PairCard[]    // [{id, wordId, type, word, isFlipped, isMatched}]
flippedIds: string[] // at most 2 card ids currently face-up
isFlipping: ref      // guard flag (not state — avoids re-render)
wrongFlips: number   // for star rating
```

### Flip Logic
```
handleFlip(cardId):
  if isFlipping.current: return
  const card = cards.find(c => c.id === cardId)
  if card.isMatched || card.isFlipped: return
  if flippedIds.length >= 2: return

  flip card → isFlipped = true
  flippedIds.push(cardId)

  if flippedIds.length === 2:
    isFlipping.current = true
    setTimeout(400):   // wait for CSS flip animation
      const [a, b] = flippedIds.map(id => cards.find(c => c.id === id))
      if a.wordId === b.wordId:
        // MATCH
        setCards: a.isMatched = b.isMatched = true
        playEffect('correct')
        updateWord(a.wordId, true)
        flippedIds = []
        isFlipping.current = false
        checkBoardComplete()
      else:
        // NO MATCH
        wrongFlips++
        playEffect('incorrect')
        setTimeout(800):
          setCards: a.isFlipped = b.isFlipped = false
          flippedIds = []
          isFlipping.current = false
```

### Star Rating
```
3 stars: wrongFlips <= boardSize       (boardSize = 3 or 4)
2 stars: wrongFlips <= boardSize * 2
1 star:  otherwise
```

### Session Recording
Both activities record via `saveSession`:
```typescript
{
  startedAt: startTimeRef.toISOString(),
  completedAt: new Date().toISOString(),
  activityType: 'listenFind' | 'matchingPairs',
  mood: null,
  wordIds: roundWords.map(w => w.id),
  correctCount: correctFirst | matchedCount,
  duration: seconds
}
```

---

## Test Plan

### ListenAndFind.test.tsx
```
✓ renders container with data-testid=listen-and-find
✓ shows 3 choice cards when age=3
✓ shows 4 choice cards when age=4
✓ tapping correct card calls updateWord(wordId, true)
✓ tapping wrong card does NOT call updateWord
✓ tapping wrong card twice shows bilingual reveal text
✓ reveal does NOT call updateWord
✓ progress bar has data-testid=listen-find-progress
✓ onComplete is called after all words are processed
✓ playWordEn called on mount with first word's audioEnPath
```

### MatchingPairs.test.tsx
```
✓ renders container with data-testid=matching-pairs
✓ shows 6 flip-card elements for age=3
✓ shows 8 flip-card elements for age=4
✓ matched pair gets data-testid=flip-card-matched
✓ mismatched pair: cards revert isFlipped after timeout
✓ tapping an already-flipped card is ignored
✓ tapping a matched card is ignored
✓ onComplete fires when all pairs are matched
✓ updateWord called with correct wordId on match
```

---

## Sequence Diagram

```
User lands on /activities/listen-find
  → page.tsx loads (useDB → getAllWords → getSetting('childAge','childName'))
  → loading state: 🐼 spinner
  → picks 6 random words
  → renders <ListenAndFind wordList age onComplete>
    → auto-plays target word EN audio
    → shows 3/4 image-only choice cards
    User taps correct card
      → green ring + bounce animation
      → correct.mp3
      → updateWordProgress(wordId, true) → IndexedDB
      → 1200ms → next word
    [... repeat for each word ...]
    Last word done
      → onComplete({wordsAttempted:6, correctFirst:N, duration:Xs})
      → saveSession → IndexedDB sessions store
  → page shows <CelebrationOverlay wordCount=N>
  User taps "Play Again"
    → reshuffles new 6 words, resets component
```
