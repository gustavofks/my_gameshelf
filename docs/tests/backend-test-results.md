# Backend Test Results — ROM Scanner MVP

**Date:** 2026-07-27
**Branch:** `feat/rom-scanner-backend`
**Scope:** the backend of the scan + catalog MVP (`docs/design/scanner-mvp.md`)

## Environment

| Component | Version |
|-----------|---------|
| Node.js | 24.15.0 |
| PostgreSQL (Docker) | 17.10 |
| Test runner | Jest (ts-jest) |

How to reproduce, from `backend/`:

```bash
docker compose up -d          # from the repo root — starts Postgres
npm ci
npm run db:migrate:test       # applies migrations to gameshelf_test
npm test                      # unit suite
npm run test:int              # integration suite (needs Postgres)
npx eslint src test           # lint, including the domain/ import boundary
npm run build                 # type-check + compile
```

## Summary

| Suite | Files | Tests | Result |
|-------|-------|-------|--------|
| Unit | 4 | 28 | ✅ pass |
| Integration | 3 | 20 | ✅ pass |
| **Automated total** | **7** | **48** | **✅ pass** |
| ESLint (`src test`) | — | — | ✅ pass (exit 0) |
| Build (`nest build`) | — | — | ✅ pass (exit 0) |

## Unit tests — no database, no filesystem where avoidable

| File | Tests | Covers |
|------|-------|--------|
| `src/scanner/domain/rom-parser.spec.ts` | 16 | Title/region/disc/revision parsing, incl. 7 real filenames from the DS collection |
| `src/scanner/domain/platform-detector.spec.ts` | 5 | Extension → platform, case-insensitive, unknown extension |
| `src/scanner/infra/crc32.spec.ts` | 3 | Streaming CRC32: known value, 8-hex padding, cross-chunk consistency |
| `src/scanner/infra/filesystem.adapter.spec.ts` | 4 | Recursive walk at any depth, path normalization, readability check |

## Integration tests — real PostgreSQL (`gameshelf_test`)

| File | Tests | Covers |
|------|-------|--------|
| `test/library.int-spec.ts` | 4 | `GET /games`: ordering, platform filter, search, `fileSize` as string |
| `test/scanner-runner.int-spec.ts` | 9 | Persistence, idempotency, rename relink, missing-file flag, classify-by-extension across folders, unknown-extension ignored, parse-fallback warning, unreadable root → FAILED |
| `test/scanner-api.int-spec.ts` | 7 | `POST /scans` (202), progress polling, body `rootPath` override, 400 on bad path, 409 while running, 404 unknown id, orphan reconciliation |

## Static checks

- **ESLint** `src test` → exit 0. Includes the `no-restricted-imports` boundary that forbids Nest/Prisma/`fs` imports under `scanner/domain/`. Remaining output is warnings only (supertest's `any`-typed request argument), configured as warnings in the repo.
- **Build** `nest build` → exit 0, no TypeScript errors.

## Manual end-to-end verification

Run against the real collection at `C:/roms` with the API live (`npm run start:dev`):

| Check | Expected | Result |
|-------|----------|--------|
| Scan `C:/roms/ds` (single platform folder) | all DS ROMs catalogued | ✅ 25 games, all platform `ds` |
| Scan `C:/roms` (collection root) | every file classified by extension | ✅ 26 games — 25 `ds` + 1 `gba` |
| Rescan | same row count, no duplicates | ✅ count unchanged |
| Move a file out, rescan | `isMissing = true`, record kept | ✅ flagged, not deleted |
| Restore the file, rescan | `isMissing = false` | ✅ cleared |
| `POST /scans` twice while running | second rejected | ✅ 202 then 409 |
| `POST /scans` with unreadable body `rootPath` | rejected | ✅ 400 |

## Notes

- The unit suite runs with no database; the integration suite requires the Docker Postgres and runs single-worker against `gameshelf_test`.
- Platform is detected from the file extension; the manual check confirms a single-platform folder and a mixed collection root both classify correctly.
