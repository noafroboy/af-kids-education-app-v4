# Task #191 Plan — Fix Webpack Runtime Error

## Assumption Audit

### Assumptions Made
1. **Task #182 context**: The task brief references "task orchestrator #182 merged changes that broke the app at runtime." Task #182 does not appear in the git commit history (commits jump from #181 to #183). I assume the breaking change was introduced by the worktree initialization process that created the stub `node_modules`, not a specific code commit.
2. **Port 3042**: The task specifies port 3042, but `package.json` has `"dev": "next dev"` with no port. I assume port 3042 must be specified via CLI flag: `npm run dev -- -p 3042`.
3. **Worktree 190**: The task says to run `npm run build` in `/worktrees/190`, but that directory does not exist. I assume this is irrelevant — the focus is on worktree 191.
4. **Node.js module resolution**: I assume webpack/Next.js uses standard Node.js module resolution (traversing parent directories), allowing the parent workspace's `node_modules` to be found after removing the worktree's stubs.

### What the Task Does NOT Specify
- Which version of npm to use for reinstall (using whatever's in the environment)
- Whether to symlink node_modules vs fresh install (I choose fresh install as fallback, stub removal as primary)
- Whether to run E2E (Playwright) tests (I will verify manually via curl + UI flow description)

### Risks & Open Questions
- **Q**: Will Next.js webpack resolve parent `node_modules` after stub removal? **A**: Likely yes, but `npm install` is the safe fallback.
- **Q**: Are there other stubs in the worktree that could cause issues? **A**: Worktree `node_modules` only has `next` and `styled-jsx` — both confirmed stubs.
- **Q**: Could any source files have bugs that weren't caught? **A**: Code review shows all components have correct `'use client'` directives, error handling, and no server-only imports in client components. Task #189 verified 15/15 checks passing.

---

## Root Cause Analysis

### Discovered Root Cause
The webpack runtime error (and build failure) is caused by **a stub/incomplete `node_modules` directory** inside the worktree that **shadows the full Next.js installation** in the parent workspace.

**Evidence**:
```
/worktrees/191/node_modules/          ← STUB (248K, 2 packages)
  next/
    dist/
      compiled/
      pages/        ← contains _app.js, _document.js (source of errors)
      server/
      # MISSING: shared/, lib/, client/, build/, esm/, etc.
  styled-jsx/
    index.js
    style.js        ← stub only

/kids-education-app-v4/node_modules/  ← FULL (516MB, 546 packages)
  next/
    dist/
      api/, bin/, build/, bundles/, cli/
      client/, compiled/, diagnostics/
      esm/, experimental/, export/
      lib/, pages/, server/
      shared/        ← this is what's MISSING in the stub!
      styled-jsx/, telemetry/, trace/
```

**Why the Build Fails**:
`node_modules/next/dist/pages/_app.js` imports `'../shared/lib/utils'`. This resolves to `dist/shared/lib/utils` which doesn't exist in the stub. Same for `dist/pages/_document.js` importing `../shared/lib/constants`, `../server/get-page-files`, `../server/htmlescape`, `../lib/is-error`.

**Build Errors**:
```
./node_modules/next/dist/pages/_app.js
Module not found: Can't resolve '../shared/lib/utils'

./node_modules/next/dist/pages/_document.js
Module not found: Can't resolve '../shared/lib/constants'
Module not found: Can't resolve '../server/get-page-files'
Module not found: Can't resolve '../server/htmlescape'
Module not found: Can't resolve '../lib/is-error'

> Build failed because of webpack errors
```

**Why This Happened**: The stub `node_modules` was placed in the worktree directory (likely by the worktree initialization script) containing only a minimal `next` dist with just the core server files — enough to indicate "next is installed" but not enough for an actual build. Since Node.js module resolution checks the closest `node_modules` first, the stub takes precedence over the parent workspace's full 516MB installation.

---

## Approach Alternatives

### APPROACH A: Conservative — Remove stubs, use parent node_modules
**Description**: Delete the stub `node_modules` in the worktree. Node.js module resolution traverses up the directory tree and finds the full Next.js installation at `kids-education-app-v4/node_modules/`.

- **Effort**: S (minutes)
- **Risk**: Low (standard Node.js module resolution behavior)
- **Trade-off**: Relies on directory tree traversal working correctly; no local `node_modules` means the worktree is coupled to the parent workspace's installation.

### APPROACH B: Ideal — Run `npm install` in worktree
**Description**: Run `npm install` in the worktree to create a complete, self-contained `node_modules` that contains all 546+ packages correctly.

- **Effort**: M (5-15 minutes for npm install)
- **Risk**: Low (standard npm behavior)
- **Trade-off**: Uses extra disk space (~500MB), but worktree becomes fully self-contained and independent.

## Approach Decision

**Chosen: APPROACH A (Conservative) with APPROACH B as fallback.**

**Rationale**:
- Approach A is faster and involves less disk usage
- The parent workspace has 546 packages matching the same `package.json` (same git repo, same versions)
- Git worktrees are designed to share the parent repository's workspace, so sharing `node_modules` through directory traversal is a natural fit
- If Approach A fails (e.g., Next.js restricts `resolve.modules` to project-local paths), we immediately fall back to `npm install`
- No source code changes needed in either approach — the fix is purely at the infrastructure level

---

## Production-Readiness Checklist

1. **Persistence** — Data is stored in IndexedDB (browser-local storage via the `idb` library). All 5 stores (vocabulary, progress, settings, sessions, songs) survive page refresh. ✓ Already in place, no changes needed.

2. **Error handling** — Code review confirms: every async operation in every page has try/catch with user-facing error messages. `ExploreCards` shows "No words found." on empty. `ListenFindPage` shows an error screen with "Could not load words." + "Go Home" button. `ParentPage` shows PIN error messages. ✓ Already in place.

3. **Input validation** — Onboarding PIN requires exactly 4 digits (enforced by `PinPad` component). Child name is text input. Parent PIN verification uses crypto hash comparison. ✓ Already in place.

4. **Loading states** — All async operations show `🐼` spinner (animate-float class) during loading. ✓ Already in place.

5. **Empty states** — `ExploreCards` shows "No words found. / 没有找到词语." when word list is empty. `ListenFindPage` shows similar. `HomeScreen` shows "你好! / Hello!" when no child name is set. ✓ Already in place.

6. **Security** — No hardcoded API keys found in source files. Parent PIN is stored as a hash (using crypto module). Parent area requires sessionStorage auth flag. No API keys in env files (no .env.local exists). ✓ Already in place.

7. **Component size** — Task #189 verified all components are under 200 lines. Code review confirms `ExploreCards` (159 lines), `HomeScreen` (156 lines), `ChildLayout` (56 lines), `ParentPage` (143 lines), all within limits. ✓ Already in place.

8. **Test coverage** — 207 unit tests cover happy paths, error scenarios, and edge cases across all components. Tests already pass on the main branch. The fix (removing stub node_modules) does not change any source files, so tests should continue to pass. ✓ Already in place.

**N/A items**: None — all checklist items are directly relevant.

---

## Specific Files to Modify

**Source code changes: NONE**

The root cause is entirely in the untracked `node_modules` directory. No source files need modification. The fix is:
1. Remove `/worktrees/191/node_modules/` (untracked, in `.gitignore`)
2. Run `npm install` as fallback if needed

---

## Implementation Steps

### Step 1: Remove stub node_modules
```bash
rm -rf /Users/kevinliu/.appfactory/workspaces/kids-education-app-v4/worktrees/191/node_modules
```

### Step 2: Verify build
```bash
cd /Users/kevinliu/.appfactory/workspaces/kids-education-app-v4/worktrees/191
npm run build
```
Expected: `✓ Compiled successfully` with exit code 0.

If build fails with module resolution errors → proceed to fallback.

### Fallback: npm install
```bash
cd /Users/kevinliu/.appfactory/workspaces/kids-education-app-v4/worktrees/191
npm install
npm run build
```

### Step 3: Verify dev server
```bash
npm run dev -- -p 3042
```
Then check:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3042/
curl -s -o /dev/null -w "%{http_code}" http://localhost:3042/activities/explore-cards
curl -s -o /dev/null -w "%{http_code}" http://localhost:3042/activities/listen-find
curl -s -o /dev/null -w "%{http_code}" http://localhost:3042/parent
```
Expected: All return 200.

### Step 4: Verify onboarding flow
Open browser to http://localhost:3042 with empty IndexedDB:
1. Should redirect to /onboarding
2. Enter child name
3. Select age group
4. Enter 4-digit PIN
5. Confirm PIN
6. Reach home screen with child's name + activity buttons

### Step 5: Run unit tests
```bash
npm test
```
Expected: 207 tests pass.

### Step 6: Write PR documentation
Write `.af/tasks/191/pr-body.md` and commit.

---

## Expected Test Results

| Test | Expected Outcome |
|------|-----------------|
| `npm run build` | Exit code 0, zero errors, 2 ESLint warnings (ref cleanup) |
| `npm test` | 207 tests pass |
| `GET /` | HTTP 200, shows loading spinner then home/onboarding |
| `GET /activities/explore-cards` | HTTP 200, shows vocabulary cards |
| `GET /activities/listen-find` | HTTP 200, shows game UI |
| `GET /parent` | HTTP 200, shows PIN pad |
| Onboarding flow | Completes end-to-end: name → age → PIN → home screen |
| Home screen | Shows child's name, 4 activity buttons |

---

## What Will NOT Change

- All source files remain unchanged
- All TypeScript types remain unchanged
- All test files remain unchanged
- All component behavior remains unchanged
- Database schema remains unchanged
- All 207 existing tests continue to pass
