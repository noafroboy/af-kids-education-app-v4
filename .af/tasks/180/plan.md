# Task 180 Plan: Parent Area — PIN Gate, Dashboard, Settings

## Assumption Audit

### Assumptions Made
1. **`playWordZh` not in `useAudio`** — Only `playWordEn(path)` exists for single-file playback. `audioManager.playWordEn` is actually generic (plays any audio path). WordDetailSheet's Mandarin button will call `playWordEn(word.audioZhPath)`. No new method needed.
2. **Child name in header** — The requirement says "child's name visible in ParentLayout header area". The ParentLayout spec fixes the title as 'Parent Area / 家长区域'. We'll show the child's name in the dashboard body's stats section (e.g., "{childName}'s Progress"), not in the indigo header bar itself.
3. **Toast message** — No existing toast library in the project. We'll implement "toast-style" as an inline Framer Motion animated notification (opacity + y translate) that appears for 3 seconds. This is consistent with existing inline feedback patterns.
4. **Category tab "7 days ending today"** — StreakCalendar: task says "Mon–Sun, or 7 days ending today." We'll use the simpler "7 days ending today" (today = rightmost) to avoid locale complexity.
5. **`db.clear(storeName)` shorthand** — idb v8 does support `db.clear(storeName)` as a one-shot shorthand per the idb docs. We'll use it; if the TypeScript types don't expose it cleanly, we'll use a transaction approach instead.
6. **Stage 1 label** — Dashboard stats show "Stage 1 / 第一阶段" as a static string (no dynamic stage calculation specified).
7. **Wrong PIN shake** — PinPad already has a shake animation when `error={true}` is passed. We pass `error` as a boolean state, reset it after each submission.
8. **Category ZH labels** — mapped: animals→动物, food→食物, colors→颜色, bodyParts→身体部位, family→家庭, objects→物品, actions→动作.
9. **Dashboard Settings right slot** — "Settings / 设置" button in ParentLayout right slot links to `/parent/settings`. This is a plain Link element, not a back-navigation.
10. **Child Profile Save in Settings** — "Save" button calls `putSetting` for childName and childAge. We show a success toast-style message.

### What the Task Does NOT Specify (and our defaults)
- **Loading skeleton design** — We use `animate-pulse` gray rounded boxes, matching no existing skeleton pattern (app has none). We'll make 3 rows of different widths.
- **Word thumbnail fallback** — Use `/images/placeholder.png` (same as VocabularyCard) on `onError`.
- **PinPad disabled state** — When `wrongAttempts >= 3`, we render a disabled overlay div over PinPad (pointer-events-none + opacity-50), plus show the Forgot PIN button.
- **Confirmation modal animation** — Task says "Framer Motion scale animation" for reset modal. We'll use `scale: 0.9 → 1.0` + `opacity: 0 → 1`.
- **Settings Change PIN success** — After saving new PIN hash, show a brief inline success message "PIN updated! / 密码已更新！" and reset the PinPad steps back to step 0.
- **Settings ChildAge current selection** — Pre-filled from `getSetting(db, 'childAge')`. Default shown in age tiles.

---

## Risks & Open Questions

1. **idb `db.clear()` TypeScript type** — The LittleBridgeDB interface types each store specifically. The typed `IDBPDatabase<LittleBridgeDB>.clear()` may require explicit type casting. If needed: `await (db as IDBPDatabase).clear('progress')`.
2. **singletonDb persists across navigation** — After clearing IndexedDB stores and navigating to `/onboarding`, the singleton DB instance in `useDB` is still valid (pointing to the same open DB). The stores are just empty. This is correct behavior.
3. **PinPad `disabled` state not in current props** — PinPad doesn't accept a `disabled` prop. We'll wrap it in a `pointer-events-none opacity-50` div when locked (3 wrong attempts), rather than modifying PinPad (out of scope).

---

## Approach Alternatives

### APPROACH A: Conservative
Minimize code changes. Use existing hooks/utilities directly (`useDB`, `useAudio`, DB functions). Extract sub-components only where files would exceed 150 lines. No new custom hooks.

- **Effort**: M
- **Risk**: Low
- **Trade-off**: Some inline state management in pages; no shared parent data hook for reuse.

### APPROACH B: Ideal
Create a `useParentData` custom hook that encapsulates all DB loading for the parent area. Add proper React.memo on list rows. Extract every sub-component proactively (DashboardStats, CategoryTabs, PinGate, etc.).

- **Effort**: L
- **Risk**: Medium (more files, more chances for test coverage gaps)
- **Trade-off**: Cleaner architecture but adds ~3 extra files beyond what the task requires.

---

## Approach Decision: **Approach A**

The task has well-defined, bounded scope. Approach A is appropriate because:
1. The parent area is accessed infrequently (not the critical path).
2. All DB utilities already exist and are proven.
3. 150-line enforcement already forces extraction of `ChangePinSection` — that's the only extraction genuinely needed.
4. Approach B's custom hook adds complexity with no immediate benefit for a planning phase.

---

## Component Architecture

```
src/
  components/
    layouts/
      ParentLayout.tsx          (NEW — ~50 lines)
    ui/
      StreakCalendar.tsx         (NEW — ~80 lines)
      WordDetailSheet.tsx        (NEW — ~140 lines)
      WordListRow.tsx            (NEW — ~55 lines)
    parent/
      ChangePinSection.tsx       (NEW — ~95 lines, extracted from settings)
  app/
    parent/
      page.tsx                   (MODIFY — full replacement ~130 lines)
      dashboard/
        page.tsx                 (NEW — ~150 lines)
      settings/
        page.tsx                 (NEW — ~150 lines)
  __tests__/
    ParentLayout.test.tsx        (NEW)
    ParentPin.test.tsx           (NEW)
    ParentDashboard.test.tsx     (NEW)
    WordDetailSheet.test.tsx     (NEW)
    StreakCalendar.test.tsx      (NEW)
    ParentSettings.test.tsx      (NEW)
```

---

## Detailed Component Specs

### `ParentLayout.tsx`
```tsx
interface ParentLayoutProps {
  children: React.ReactNode
  rightSlot?: React.ReactNode
}
```
- `data-testid="parent-layout"`
- Indigo (`#4F46E5`) header: `← 首页` Link (44px min tap target) | `Parent Area / 家长区域` (Fredoka One, white, centered) | optional rightSlot div
- `bg-slate-50` body, `max-w-lg mx-auto`
- NO child navigation overlay, NO idle timeout

### `StreakCalendar.tsx`
```tsx
interface StreakCalendarProps {
  sessionDates: Set<string>  // YYYY-MM-DD strings
}
```
- `data-testid="streak-calendar"`
- Compute array of 7 dates: `[today-6, today-5, ..., today]`
- Each day: short label ('Mon'/'Tue'...) + 40×40 circle
  - Filled coral (`#FF6B35`) = sessionDates has this date
  - Outline only = no session
  - Today = coral ring border regardless
- `formatDate` utility used for YYYY-MM-DD

### `WordListRow.tsx`
```tsx
interface WordListRowProps {
  word: VocabularyWord
  progress: WordProgress | undefined
  onClick: () => void
}
```
- `data-testid="word-row"`
- 48×48 next/image thumbnail, rounded-lg, with onError fallback
- English word (Nunito Bold, slate-700)
- Mandarin word (Nunito, slate-500)
- Mastery badge pill (right side):
  - 0: gray bg, text "Unseen/未见"
  - 1: yellow bg, text "Intro/初识"
  - 2: blue bg, text "Known/认识"
  - 3: green bg, text "Mastered/掌握"

### `WordDetailSheet.tsx`
```tsx
interface WordDetailSheetProps {
  word: VocabularyWord
  progress: WordProgress | null
  onClose: () => void
}
```
- `data-testid="word-detail-sheet"`
- AnimatePresence wraps `motion.div`: `fixed bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-3xl shadow-2xl z-50`
  - `initial={{ y: 300, opacity: 0 }}` → `animate={{ y: 0, opacity: 1 }}` → `exit={{ y: 300, opacity: 0 }}`
- Backdrop: `fixed inset-0 bg-black/40 z-40` onClick calls onClose
- Close button: `absolute top-4 right-4 w-11 h-11` with ✕
- Image: 192×192 next/image rounded-2xl
- English (Fredoka One 32px coral), Mandarin (Nunito Bold 24px), pinyin (italic 18px slate-400)
- Audio row: two buttons
  - `🇺🇸 English` → `useAudio().playWordEn(word.audioEnPath)`
  - `🇨🇳 Mandarin` → `useAudio().playWordEn(word.audioZhPath)` (playWordEn is generic)
- Stats: seen count, correct count, mastery label (bilingual)

### `parent/page.tsx` (PIN Gate)
- `data-testid="parent-pin-page"`
- State: `{ pinHash, loading, wrongAttempts, error, showForgotModal }`
- On mount: load pinHash from DB; if not set, redirect to /parent/dashboard (no PIN set yet — defensive)
- PinPad `onSubmit`: call `verifyPIN(entered, pinHash)`:
  - True → `router.replace('/parent/dashboard')`
  - False → increment wrongAttempts, set error=true (triggers PinPad shake), show inline "密码错误 / Wrong PIN ({n}/3)"
- After 3 wrong: disable PinPad (pointer-events-none overlay), show `忘记密码? / Forgot PIN?` text button
- Forgot PIN modal (Framer Motion scale): bilingual warning, Cancel + Confirm Reset buttons
- Confirm Reset:
  ```js
  await db.clear('progress')
  await db.clear('sessions')
  await db.clear('settings')
  router.replace('/onboarding')
  ```

### `parent/dashboard/page.tsx`
- `data-testid="parent-dashboard"`
- State: `{ loading, error, words, allProgress, sessions, weeklyStats, selectedWord, activeCategory }`
- On mount: parallel load via `Promise.all([getAllWords, getAllProgress, getAllSessions, getWeeklyStats, getSetting(childName)])`
- Loading: skeleton (3 animate-pulse rows)
- Error: inline error message
- Empty state: if sessions.length === 0 → panda icon + bilingual message
- Stats header: "本周: {N}个词 / This week: {N} words" | "🔥 {streak}天连续 / {streak} day streak" | "Stage 1 / 第一阶段"
- StreakCalendar: derive Set<string> from sessions.map(s => formatDate(new Date(s.completedAt)))
- Category tabs: 'All' + 7 categories; overflow-x-auto
- Word list (`data-testid="word-list"`): words filtered by activeCategory, each WordListRow
- On row click: set selectedWord → render WordDetailSheet
- Right slot: Link to `/parent/settings` with gear icon "⚙️ 设置"
- Child name shown in stats area: "{childName}的进度 / {childName}'s Progress"

### `parent/settings/page.tsx`
- `data-testid="parent-settings"`
- Section 1 — Child Profile:
  - Name text input (pre-filled from DB)
  - Age tiles (2,3,4,5) same style as StepAge
  - "Save / 保存" button → putSetting(childName) + putSetting(childAge), show success message
- Section 2 — Change PIN:
  - Renders `<ChangePinSection db={db} />`
- Section 3 — Reset Progress:
  - Red "🗑️ Reset All Progress / 重置所有进度" button
  - Framer Motion scale confirm dialog: bilingual warning text, Cancel (gray) + Confirm (red)
  - On confirm: `await db.clear('progress'); await db.clear('sessions'); router.push('/')`

### `ChangePinSection.tsx`
- Step 0: "Current PIN" — PinPad → verify against stored hash
  - Wrong: error state + message
- Step 1: "New PIN" — PinPad → capture new pin
- Step 2: Confirm new PIN — PinPad → if matches, hash + putSetting('pinHash', hash), show success, reset to step 0

---

## Production-Readiness Checklist

1. **Persistence** — All data is IndexedDB via existing `getDB()` singleton and db utility functions. `putSetting` stores child name and new PIN hash. `db.clear()` handles resets. Nothing in memory-only (state is derived from DB on mount).

2. **Error handling** — Every DB operation is in a try/catch block. `parent/page.tsx`: DB load error → inline "Failed to load PIN / 加载失败" + disabled PinPad. Dashboard: load error → "Failed to load data / 加载失败" with retry hint. Settings: save error → inline red error below the save button. PIN verify error (crypto failure) → show generic error, don't increment attempts.

3. **Input validation** — Child name: `trim()` before save, min 1 char / max 30 chars enforced. PIN: 4 digits enforced by PinPad component (auto-submit at exactly 4 digits). Age: constrained to tiles {2,3,4,5}. No free-text PIN entry possible.

4. **Loading states** — Parent PIN page: PinPad hidden (replaced by "Loading..." skeleton) until pinHash loaded from DB. Dashboard: `animate-pulse` skeleton for stats header + 3 word rows. Settings: inputs disabled until DB data loaded.

5. **Empty states** — Dashboard: "还没有记录！快去玩吧！/ No activity yet — start playing!" with panda icon when `sessions.length === 0`. WordDetailSheet progress section: shows "—" for stats when `progress === null`. Category filter: if a category has no words, shows "No words in this category / 此分类暂无词汇".

6. **Security** — PIN stored as SHA-256+salt hash via existing `crypto.ts`. No plain-text PIN ever stored or logged. No API keys in this feature (no server-side calls). Input sanitization: child name text input limited to 30 chars via `maxLength` attribute.

7. **Component size** — Files planned: ParentLayout ~50, StreakCalendar ~80, WordListRow ~55, WordDetailSheet ~140, ChangePinSection ~95, parent/page ~130, dashboard/page ~150, settings/page ~150. All at or under 150 lines.

8. **Test coverage** — 6 test files covering: happy-path PIN verification, wrong PIN lockout, reset flow, dashboard loading/empty/data states, category filter, word detail sheet render + close, streak calendar 7-day render + today highlight, settings save + reset. Tests follow existing pattern: mock framer-motion, mock next/navigation, mock useDB, mock DB functions.

---

## Data Flow Diagram

```
IndexedDB (idb v8)
  └── settings: { childName, childAge, pinHash, onboardingComplete }
  └── progress: [{ wordId, seenCount, correctCount, masteryLevel, lastSeenAt }]
  └── sessions: [{ startedAt, completedAt, activityType, wordIds, ... }]
  └── vocabulary: [VocabularyWord]

/parent (PIN Gate)
  reads → settings.pinHash
  on reset → clears all stores → navigate /onboarding

/parent/dashboard
  reads → vocabulary (all words)
           progress (all)
           sessions (all, to derive streak calendar dates)
           getWeeklyStats (wordsThisWeek, streak)
           settings.childName

/parent/settings
  reads → settings.childName, settings.childAge
  writes → settings.childName, settings.childAge, settings.pinHash
  on reset → clears progress + sessions stores
```

---

## Test Strategy

Each test file follows the established pattern from existing tests:

```tsx
// Standard boilerplate for all parent area tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, whileTap: _wt, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/parent',
}));

jest.mock('next/image', () =>
  function MockImage({ src, alt }) { return <img src={src} alt={alt} />; }
);

jest.mock('@/hooks/useDB', () => ({ useDB: () => mockDb }));
```

DB mock pattern for parent pages:
```tsx
const mockDb = {
  get: jest.fn(),
  getAll: jest.fn(),
  put: jest.fn(),
  clear: jest.fn(),
  transaction: jest.fn(),
};
jest.mock('@/lib/db', () => ({
  getSetting: jest.fn(),
  putSetting: jest.fn(),
  getAllWords: jest.fn(),
  getAllProgress: jest.fn(),
  getAllSessions: jest.fn(),
}));
jest.mock('@/lib/progress', () => ({
  getWeeklyStats: jest.fn(),
}));
```

---

## Implementation Order

1. `ParentLayout.tsx` — needed by all pages
2. `StreakCalendar.tsx` — standalone, no deps on other new files
3. `WordListRow.tsx` — standalone
4. `WordDetailSheet.tsx` — depends only on useAudio + types
5. `ChangePinSection.tsx` — depends on PinPad, useDB, crypto
6. `parent/page.tsx` — depends on ParentLayout, PinPad, crypto, getDB
7. `parent/dashboard/page.tsx` — depends on all new UI components
8. `parent/settings/page.tsx` — depends on ParentLayout, ChangePinSection, StepAge pattern
9. All test files (can be written alongside each component)
