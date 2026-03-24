# Plan: Add Noto Sans SC Font & Fix Mandarin Text Size

## Assumption Audit

| Assumption | Decision |
|---|---|
| Task references "Fredoka One" but codebase imports `Fredoka` (not `Fredoka_One`) | Follow the existing code — `Fredoka` is already correct; do not rename |
| Task says mandarinWord is at `text-2xl` — actual code uses `text-[24px]` | Same visual size; change `text-[24px]` → `text-[36px]` |
| "Do not change the pinyin text" — pinyin uses `text-[16px]` with Nunito | Leave pinyin element untouched |
| mascot.tsx — file does NOT exist in the repo | Create it per task spec |
| tailwind.config.ts — task doesn't ask for new Tailwind utility | Do NOT add `noto-sans-sc` font utility to Tailwind; use inline style consistent with existing VocabularyCard pattern |

### Risks & Open Questions

- **Subset string**: `next/font/google` requires `'latin'` for Noto Sans SC, not `'chinese-simplified'`. The task explicitly calls this out; confirmed safe.
- **Card overflow at 375px**: mandarinWord renders within a `text-center` flex column inside `max-w-sm` (384px). CJK characters wrap naturally. Typical vocabulary entries are 1–4 characters wide; no horizontal overflow expected.
- **FOUT**: Next.js injects font CSS variables server-side; `display: 'swap'` is the fallback strategy and is already used for the other fonts.

---

## Approach Alternatives

### Approach A — Conservative ✅ CHOSEN
**What**: Add `Noto_Sans_SC` to `layout.tsx`, update the Mandarin `<p>` in `VocabularyCard.tsx` with size `36px` and `fontFamily: 'var(--font-noto-sans-sc)'` inline style, create `mascot.tsx`.
**No changes to** `tailwind.config.ts`.
**Effort**: S
**Risk**: Low
**Trade-off**: Consistent with existing inline-style pattern in VocabularyCard; no new Tailwind utility needed.

### Approach B — Ideal
**What**: Same as A, plus add `'noto-sans-sc': ['var(--font-noto-sans-sc)', 'sans-serif']` to `tailwind.config.ts` and use `font-noto-sans-sc` Tailwind class instead of inline style in VocabularyCard.
**Effort**: M
**Risk**: Low-Med (Tailwind config change touches global scope)
**Trade-off**: Cleaner Tailwind DX, but the VocabularyCard already uses inline styles for font-family; mixing patterns would be inconsistent with the existing code.

## Approach Decision

**Chosen: Approach A — Conservative**

The VocabularyCard component already uses `style={{ fontFamily: 'var(--font-nunito)' }}` inline for its existing text elements. Adding Noto Sans SC via the same pattern keeps the diff minimal, is immediately readable, and avoids touching the global Tailwind config for a single-use font. Iron Law 5 (No Scope Creep) favours A.

---

## Files to Modify

### `src/app/layout.tsx`
1. Add `Noto_Sans_SC` to the `next/font/google` named import.
2. Instantiate the font:
   ```ts
   const notoSansSC = Noto_Sans_SC({
     subsets: ['latin'],
     weight: ['400', '700'],
     variable: '--font-noto-sans-sc',
     display: 'swap',
   });
   ```
3. Update the `<html>` className:
   ```tsx
   className={`${fredoka.variable} ${nunito.variable} ${notoSansSC.variable}`}
   ```

### `src/components/ui/VocabularyCard.tsx`
- Change the mandarinWord `<p>` from:
  ```tsx
  <p className="text-[24px] font-bold text-slate-700" style={{ fontFamily: 'var(--font-nunito)' }}>
  ```
  to:
  ```tsx
  <p className="text-[36px] font-bold text-slate-700" style={{ fontFamily: 'var(--font-noto-sans-sc)' }}>
  ```
- Leave the pinyin `<p>` (`text-[16px]` with `--font-nunito`) and English `<p>` (`text-[36px]` with `--font-fredoka`) completely unchanged.

## Files to Create

### `src/components/ui/mascot.tsx`
Simple panda emoji component per task spec; under 40 lines.

---

## Production-Readiness Checklist

1. **Persistence** — N/A — this task is purely UI/CSS; no data storage involved.
2. **Error handling** — N/A — no external API calls, file reads, or async operations are introduced.
3. **Input validation** — N/A — no user input; font and size are static values.
4. **Loading states** — N/A — font loading is handled by Next.js font optimization (CSS variable injected server-side with `display: swap` fallback).
5. **Empty states** — N/A — VocabularyCard always receives a word prop; empty state is handled upstream.
6. **Security** — N/A — no API keys, no user input, no LLM.
7. **Component size** — `layout.tsx` is ~30 lines after changes (well under 150). `VocabularyCard.tsx` is ~50 lines (well under 150). `mascot.tsx` will be ~15 lines (under 40 as required).
8. **Test coverage** — Existing `VocabularyCard.test.tsx` suite (7 tests) covers the affected component. Tests assert text content only, not CSS styles, so all 7 will continue to pass. No new behaviour is introduced that requires new tests. A smoke test for the Mascot component could be added, but the task focuses on font changes and the component is trivially simple.

---

## Implementation Steps

| # | File | Action |
|---|---|---|
| 1 | `src/app/layout.tsx` | Add `Noto_Sans_SC` to font import |
| 2 | `src/app/layout.tsx` | Instantiate `notoSansSC` constant |
| 3 | `src/app/layout.tsx` | Append `notoSansSC.variable` to `<html>` className |
| 4 | `src/components/ui/VocabularyCard.tsx` | Update mandarinWord `<p>` size and font family |
| 5 | `src/components/ui/mascot.tsx` | Create new file |
| 6 | *(verify)* | `npm test` — confirm all 7 VocabularyCard tests pass |
| 7 | *(verify)* | `npx tsc --noEmit` — confirm no TypeScript errors |

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Wrong subset string causes build error | Low (task explicitly warns) | Use `'latin'` not `'chinese-simplified'` |
| 36px Mandarin text causes 375px overflow | Low (CJK chars are narrow, text wraps) | Text is centered in flex-col; `word-break` fallback if needed |
| TypeScript type error on `Noto_Sans_SC` | Low | `Noto_Sans_SC` is a valid export from `next/font/google` (same pattern as `Nunito`, `Fredoka`) |
| Existing tests break | Very Low | Tests assert text content only, not styles |
