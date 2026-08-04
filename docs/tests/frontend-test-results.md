# Frontend Test Results — Angular MVP

**Date:** 2026-08-03
**Branch:** `feat/frontend-mvp` (PR #2)
**Scope:** the Angular frontend of the scan + catalog MVP (`docs/design/frontend-mvp.md`), plus the two backend endpoints added on this branch (`GET /platforms`, `GET /fs/directories`)

## Environment

| Component | Version |
|-----------|---------|
| Node.js | 24.15.0 |
| Angular | 21.2.18 (standalone, signals, zoneless) |
| Test runner | Vitest 4 via `@angular/build:unit-test` |

How to reproduce, from `frontend/`:

```bash
npm ci
npm test          # unit suite (runs once in non-TTY; do not pass -- --run)
npm run lint      # angular-eslint
npm run build     # type-check + bundle
```

Backend additions, from `backend/` (Docker Postgres up first):

```bash
npm test && npm run test:int
```

## Summary

| Suite | Files | Tests | Result |
|-------|-------|-------|--------|
| Frontend unit (Vitest) | 17 | 41 | ✅ pass |
| Backend unit (Jest) | 5 | 29 | ✅ pass |
| Backend integration | 4 | 29 | ✅ pass |
| **Automated total** | **26** | **99** | **✅ pass** |
| angular-eslint | — | — | ✅ pass (exit 0) |
| Build (`ng build`) | — | — | ✅ pass (exit 0) |

## Frontend unit tests

Presentational components are tested with no HTTP and no router; services with
`provideHttpClientTesting`; smart pages and the store through real routing.

| File | Tests | Covers |
|------|-------|--------|
| `core/api/games-api.service.spec.ts` | 2 | Query-string building; absent params omitted |
| `core/api/platforms-api.service.spec.ts` | 1 | `GET /platforms` |
| `core/api/scan-api.service.spec.ts` | 3 | `POST /scans` body shapes, status by id |
| `core/api/fs-api.service.spec.ts` | 2 | `GET /fs/directories` with/without path param |
| `core/notification/notification.service.spec.ts` | 3 | Toast queue: push severities, dismiss by id |
| `core/error/http-error.interceptor.spec.ts` | 6 | Spec §6 table: 0/409/400-with-message/5xx/fallback → translated toast keys; error rethrown |
| `features/library/library.store.spec.ts` | 3 | URL-as-state: platform from route, search from query, refetch on change — locks in the `firstChild.snapshot` regression fix (mutation-checked) |
| `features/library/game-card.spec.ts` | 2 | Title-as-cover placeholder, region, `data-missing` badge, translated labels |
| `features/library/console-rail.spec.ts` | 2 | Only platforms with games; "All" entry first with total count |
| `features/library/library-page.spec.ts` | 1 | Toolbar renders the Scan action |
| `features/scan/scan-page.spec.ts` | 4 | Start → poll → COMPLETED; button re-enabled on start failure; warning toast on issues; error toast on FAILED |
| `features/scan/scan-progress.spec.ts` | 1 | Bar width from processed/found |
| `features/scan/scan-issues.spec.ts` | 3 | Renders `message` (+ dimmed path), severity colors, empty renders nothing |
| `features/scan/folder-picker.spec.ts` | 3 | Default listing on init, navigate on click, selection reported via the service |
| `features/scan/folder-picker.service.spec.ts` | 3 | `pick()` promise contract: resolve path, cancel → null, re-pick cancels previous |
| `layout/sidebar.spec.ts` | 1 | One link per section |
| `app.spec.ts` | 1 | Root renders the shell |

## Backend additions on this branch

| File | Tests | Covers |
|------|-------|--------|
| `test/library.int-spec.ts` (extended) | +1 | `GET /platforms` with per-user game counts |
| `test/fs.int-spec.ts` (new) | 3 | Directory listing sorted/dirs-only with parent; 400 on nonexistent path; 400 on file path |

## Static checks

- **angular-eslint** → exit 0.
- **Build** `ng build` → exit 0, lazy chunks emitted per feature.
- **Backend** `npx eslint src test` → exit 0 (pre-existing supertest warnings only); `nest build` → exit 0.

## Manual / browser-driven end-to-end verification

Driven with Playwright (Chromium) against the full stack (Docker Postgres +
NestJS dev server + `ng serve` with proxy), plus a manual pass by the user
(plan Task 10). Real collection at `C:/roms` (26 games: 25 `ds`, 1 `gba`).

| Check | Expected | Result |
|-------|----------|--------|
| `/` redirect | lands on `/library`, "All" pre-selected | ✅ "Todos (26)" active, 26 cards |
| Console rail filter | only non-empty consoles; click filters | ✅ ds → 25 cards, gba → 1 |
| Library toolbar | Scan action navigates to `/scan` | ✅ |
| Folder picker | Browse opens at `ROMS_ROOT_PATH`; descend/up; select fills the field and closes | ✅ picked `C:\roms\gba` |
| Scan from the UI | progress bar advances to COMPLETED, library populated | ✅ |
| Language toggle | EN/PT-BR live switch, persists across reload | ✅ (both toggle instances stay in sync) |
| URL as state | `/library/ds?search=...` restores the filtered view | ✅ |
| Error feedback | bad scan path → error toast, button re-enabled | ✅ |
| Console hygiene | zero browser console errors on all six screens + toggles | ✅ |

## Notes

- The browser-driven pass caught three runtime bugs the unit suite could not
  (unactivated child-route snapshot, re-entrant language init, CSS-order loss
  of the active nav state) — all fixed and regression-covered where testable.
- Code review (PR #2) findings were all addressed: scan issue messages
  surfaced, scan button unstuck on start failure, §6 scan toasts added,
  remaining hardcoded strings translated, `LibraryStore` and the error
  interceptor gained specs.
