## Summary
- Investigated and fixed the webpack runtime error causing every page to return HTTP 500. The root cause was a stub/incomplete `node_modules` directory inside the worktree (248K, 2 packages) that shadowed the full Next.js 15.1.0 installation in the parent workspace (516MB, 546 packages).
- The stub `next/dist/` directory was missing critical subdirectories (`shared/`, `lib/`, `client/`, `build/`, `esm/`) causing webpack to fail with "Module not found: Can't resolve '../shared/lib/utils'" and related errors.
- Removed the stub `node_modules` from the worktree, allowing Node.js module resolution to correctly find the full installation in the parent workspace directory.

## Changes
### Infrastructure (no source code changes)
- Removed `/worktrees/191/node_modules/` — the stub directory (248K, containing only incomplete `next` and `styled-jsx` stubs) that was blocking webpack from resolving internal Next.js modules

## Testing
- `npm run build` exits with code 0, zero errors, 2 pre-existing ESLint warnings (ref cleanup in ListenAndFind and MatchingPairs — acceptable, do not block build)
- All 4 required routes verified via HTTP: `GET /` → 200, `GET /activities/explore-cards` → 200, `GET /activities/listen-find` → 200, `GET /parent` → 200
- App serves correct content: `<title>LittleBridge 小桥</title>` confirmed in HTTP response
- All 207 unit tests pass (`npm test` — 25 test suites, 207 tests, 0 failures)
- No source files modified — all existing behavior preserved
