# Design — ROM Scanner and Catalog (MVP)

**Date:** 2026-07-22
**Status:** Approved
**Scope:** my_gameshelf MVP — scan a ROM folder and build a persisted catalog

---

## 1. Goal and boundaries

my_gameshelf is a personal game library manager. This document covers **the MVP
only**: walk a ROM folder on disk, identify the games, and persist a catalog that
can be browsed in the UI.

The following are **deliberately out of scope** for this cycle, each getting its
own spec later:

| Phase | Content | Depends on |
|-------|---------|------------|
| 2 — Async execution | Move scan execution to BullMQ + Redis | The job contract in this MVP |
| 3 — Metadata | No-Intro DATs by CRC32, then IGDB/ScreenScraper for art and genre | `Game.crc32` from this MVP |
| 4 — Backlog | Status (playing/beaten/dropped), rating, hours played | A stable catalog |
| 5 — Multi-user | Authentication; swap the fixed `userId` for the session's | Nothing — the column already exists |
| 6 — Refinements | SSE instead of polling, deduplication, advanced search | — |

**Known limitation — single region.** The parser stores `region` as one value,
so a filename listing several regions — `Pokemon - White Version (USA, Europe)` —
keeps only the first (`USA`) and drops the rest. Accepted for the MVP: the
filename is a best-guess source that phase 3 metadata (No-Intro DATs by CRC32)
will supersede with canonical data. A later refinement can widen this to a region
list or a raw-region field; deferred rather than designed against a UI that does
not exist yet.

### MVP success criteria

1. `docker compose up` brings up dependencies with no manual steps.
2. A scan triggered from the UI walks the real folder and populates the catalog.
3. Scanning twice in a row produces the same result (idempotency).
4. Renaming or moving a file creates no duplicate record and loses no data.
5. Problem files are skipped and **reported in the UI**, without failing the scan.
6. The filename parser is covered by tests that need no database and no filesystem.

### Demo page

Before the Angular frontend exists (Plano 2), a single self-contained HTML file at
`docs/demo/backend-demo.html` verifies the backend visually. Opened via `file://`
with the API running, it triggers a real scan, shows progress and issues, and
lists the catalog. It is a verification artifact — deliberately plain HTML, not
the product frontend — kept so the working backend can be seen and screenshotted.

---

## 2. Locked decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Database | PostgreSQL | User's choice |
| ORM | Prisma | File-versioned migrations; types generated from the schema |
| Users | Single user, with `userId` columns from day 1 | Makes multi-user a cutover, not a data migration |
| Platform detection | By file **extension**, not folder name | Works for any folder layout, including mixed ones |
| Scan execution | In-process in the MVP; queue in phase 2 | See below |
| Architecture | Isolated domain core | Parser testable without mocks |
| Game identity | File CRC32 | Survives renames and moves |

### Platform detection is by extension, and it is provisional

The scanner infers a file's platform from its **extension**, mapped through the
static registry (`.nds → ds`, `.gba → gba`, `.sfc → snes`). The folder name is
irrelevant: `rootPath` can point at the collection root, at a single platform
folder, or at a messy folder mixing systems — every file is classified on its own.
`walk` therefore recurses through the whole tree and returns every file at any
depth; extensions the registry does not know (`.jpg`, `.txt`, `.sav`) are ignored.

This is the same best-guess-then-canonical pattern used for **title** and
**region**: the extension is a provisional signal that phase 3 metadata makes
authoritative. No-Intro and Redump DATs are **per-system**, so matching a file's
CRC32 against them resolves the platform for certain — including the case the
extension cannot: shared disc extensions (`.iso`, `.bin`, `.cue`, `.chd`) that
belong to several CD consoles (PS1 vs PS2). With today's cartridge-focused
registry each extension maps to exactly one platform, so the provisional guess is
already unambiguous; the DAT layer only matters once CD consoles are added.

### Why no queue in the MVP

An earlier draft put BullMQ + Redis in the MVP. That was reversed deliberately.

The current collection is a few hundred ROMs. Deferring the queue costs almost
nothing **provided two things are kept from day 1**:

- The `ScanJob` table (status and progress record)
- The API contract: `POST /scans` → `202` + id, `GET /scans/:id` → progress

With those in place, phase 2 replaces **only the executor**. The frontend, the
domain layer, the schema, and the API contract are untouched.

What the MVP gives up, and why none of it bites at this size:

| Given up | Impact |
|----------|--------|
| Durability — a restart mid-scan loses the run | Orphan reconciliation already handles the stuck record |
| Multiple workers | Not needed for hundreds of files |
| Retry with backoff | Re-running the scan is cheap and idempotent |

---

## 3. Architecture

### Topology

```
┌──────────┐     HTTP      ┌─────────────────────────┐
│ frontend │──────────────▶│ backend (NestJS)        │
│ Angular  │               │  ├─ HTTP API            │
└──────────┘               │  └─ in-process scan     │
                           └───────────┬─────────────┘
                                       │
                              ┌────────▼──┐
                              │ postgres  │
                              └───────────┘
                                       ▲
                               ┌───────┴────────┐
                               │ /roms  (bind,  │
                               │   read-only)   │
                               └────────────────┘
```

**The ROM folder is mounted read-only (`:ro`).** The application never writes to
it. The catalog lives in Postgres; the files are left untouched. This rules out,
by construction, the class of bug where a scan corrupts or renames the user's
collection. The host path is configured through an environment variable.

### Backend structure

```
backend/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  src/
    platforms/
      platform.registry.ts      static catalog: slug → extensions
    scanner/
      domain/                   ← no Nest, no Prisma, no fs
        rom-parser.ts
        rom-parser.spec.ts
        platform-detector.ts
        platform-detector.spec.ts
      infra/
        filesystem.adapter.ts   the only place that touches disk
        crc32.ts                streaming checksum
      scanner.controller.ts     POST /scans, GET /scans/:id
      scanner.service.ts        orchestrates
      scanner.runner.ts         executes the job (swappable for a queue worker)
      scanner.module.ts
    library/
      library.controller.ts     GET /games
      library.service.ts
      library.module.ts
    prisma/
      prisma.service.ts
```

**Structural rule:** nothing under `domain/` imports Nest, Prisma, or `fs`. This
is enforced by an ESLint rule (`no-restricted-imports`) and checked in CI —
guaranteed discipline, not merely documented discipline.

`scanner.runner.ts` is the seam for phase 2. It exposes a single entry point that
takes a `scanJobId` and runs the scan to completion. Today the service calls it
directly; later a BullMQ processor calls the same function. Nothing else moves.

### Frontend

Angular standalone (the version 21 default, matching how the scaffold was
generated), with two routes in the MVP: library and scan. In development,
`ng serve` proxies to the backend, avoiding CORS and keeping the API URL relative.

---

## 4. Data model

```prisma
model User {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())

  games    Game[]
  scanJobs ScanJob[]
}

model Platform {
  id   Int    @id @default(autoincrement())
  slug String @unique          // "snes", "nes", "psx"
  name String                  // "Super Nintendo"

  games Game[]
}

model Game {
  id         String   @id @default(uuid())
  userId     String
  platformId Int

  title      String              // derived from the filename
  region     String?             // "USA", "EUR", "JPN"
  filePath   String              // relative to root: "snes/Chrono Trigger (USA).sfc"
  fileSize   BigInt
  crc32      String?             // content-based identity
  discNumber Int?                // (Disc 1)
  revision   String?             // (Rev A)

  lastSeenAt DateTime
  isMissing  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id])
  platform Platform @relation(fields: [platformId], references: [id])

  @@unique([userId, filePath])
  @@index([userId, crc32])
  @@index([userId, platformId])
}

model ScanJob {
  id             String     @id @default(uuid())
  userId         String
  status         ScanStatus @default(PENDING)
  rootPath       String
  filesFound     Int        @default(0)
  filesProcessed Int        @default(0)
  errorMessage   String?
  startedAt      DateTime?
  finishedAt     DateTime?
  createdAt      DateTime   @default(now())

  user   User        @relation(fields: [userId], references: [id])
  issues ScanIssue[]
}

model ScanIssue {
  id        String        @id @default(uuid())
  scanJobId String
  severity  IssueSeverity
  code      String        // "UNREADABLE_FILE", "PARSE_FAILED"
  filePath  String?
  message   String
  createdAt DateTime      @default(now())

  scanJob ScanJob @relation(fields: [scanJobId], references: [id], onDelete: Cascade)
}

enum ScanStatus    { PENDING RUNNING COMPLETED FAILED }
enum IssueSeverity { WARNING ERROR }
```

### Model decisions

**`@@unique([userId, filePath])` guarantees one row per file on disk** and makes
rescans idempotent through upsert. Running the scan five times yields the same
result as running it once.

**`crc32` is an index, not a unique constraint.** Real collections contain the
same game duplicated across folders; a unique constraint on the checksum would
prevent the second row from existing at all. CRC32 exists for *relink lookup*,
described in section 5 — not for uniqueness.

**A missing file is flagged, never deleted.** Unplugging an external drive and
scanning must not destroy data. The scan updates `lastSeenAt` on what it finds
and sets `isMissing = true` on what it does not. Reconnect the drive and the next
scan clears the flag. This mainly protects what phases 3 and 4 will add —
hand-corrected metadata, ratings, and backlog progress.

**`Platform` is a table; extensions live in code.** The database stores what rows
reference (slug, display name); the code stores the parsing rule (`.sfc`/`.smc` →
snes). An extension is scanner logic, not user data — keeping it in the database
would force a migration for every newly supported format.

**`Game` and `GameMetadata` will be separate tables.** The second does not exist
yet (phase 3), but the split is decided now: `Game` describes the file on your
disk; `GameMetadata` describes what the game is. They have different owners and
lifecycles — metadata comes from an external source, and can be re-fetched,
switched between providers, or corrected by hand. As columns on one table,
rescanning the disk could overwrite a manual correction.

**`userId` without authentication.** Every domain table carries the column and
foreign key, pointing at a single user created by the seed. There is no login and
no auth middleware. When phase 5 arrives, the work is intercepting the request
and swapping the fixed ID for the session's — the data is already partitioned, so
no migration has to invent an owner for existing rows.

---

## 5. Scan flow

### API

| Method | Route | Response |
|--------|-------|----------|
| `POST` | `/scans` (optional body `{ rootPath }`) | `202` + `{ id, status }` |
| `GET`  | `/scans/:id` | `{ status, filesFound, filesProcessed, errorMessage, issues[] }` |
| `GET`  | `/games?platform=&search=&page=` | paginated catalog |

`POST /scans` accepts an optional `rootPath` in the body; when omitted it falls
back to the `ROMS_ROOT_PATH` environment variable. The path is user-supplied and
validated only for readability — acceptable for a local single-user tool, and
noted as a surface to revisit before any multi-user or hosted deployment.

### Happy path

```
POST /scans
   ├─ is a RUNNING job already open for this user? ──▶ 409 Conflict
   ├─ does rootPath exist and is it readable? ───────▶ 400 if not
   ├─ create ScanJob (PENDING)
   ├─ dispatch the runner without awaiting it
   └─ 202 { id }                    ◀── frontend starts polling

runner:
   phase 1  walk the tree, filter by known extensions   → filesFound
   phase 2  batches of 200: CRC32 + parse + persist     → filesProcessed++
   phase 3  flag isMissing on anything not seen in this scan
   └─ COMPLETED
```

`rootPath` is validated **before** the job is dispatched. A wrong path is the
most common error here, and a `400` on the spot beats a job that accepts and then
fails seconds later.

The scan runs in three phases so that `filesFound` is known before processing
starts — otherwise the progress bar has no denominator.

**Dispatching without awaiting requires care.** A rejected promise from
detached execution must land in `ScanJob.errorMessage` and never escape as an
unhandled rejection. The runner wraps its whole body in a try/catch that writes
`FAILED` plus the message, so no failure path can crash the process.

### Per-file persistence algorithm

```
for each file found:
   ├─ does a Game exist with (userId, filePath)?
   │     └─ YES ──▶ update fields + lastSeenAt, isMissing = false
   │
   └─ NO ──▶ does a Game exist with (userId, crc32) not seen in this scan?
             ├─ YES ──▶ RENAME/MOVE detected
             │          update filePath, lastSeenAt, isMissing = false
             │          (everything attached to the record is preserved)
             └─ NO ───▶ insert a new Game
```

If more than one candidate matches by CRC32 — possible when the collection holds
duplicate copies of the same game and one is renamed in the same interval — the
oldest `createdAt` wins. The tiebreak is arbitrary but deterministic: the
candidates are by definition identical content, so the choice does not change
what the user sees.

This is the core answer to the rename problem: **the path is an attribute, not an
identity**. A file renamed from `Chrono Trigger (U).sfc` to
`Chrono Trigger (USA).sfc` is recognized as the same game, and nothing attached
to it is lost.

CRC32 is not an arbitrary pick: it is the checksum used by No-Intro and Redump
DAT files, which makes this column the entry key for phase 3.

### Error handling

**A problem with one file never fails the scan.** Real ROM folders contain
`.txt` files, `.jpg` cover art, `.sav` files, and corrupted data.

| Situation | Behavior | Record |
|-----------|----------|--------|
| Extension the registry does not know (`.jpg`, `.txt`, `.sav`) | Ignore | None |
| Unreadable file | Skip, continue | `ScanIssue` ERROR (`UNREADABLE_FILE`) |
| Filename parse failure | Fall back to the filename as title | `ScanIssue` WARNING (`PARSE_FAILED`) |
| `rootPath` unreachable | `400` on POST, or `FAILED` if it disappears mid-run | `errorMessage` |
| Database failure during a batch | `FAILED`; rows already written stay, and the next scan resumes | `errorMessage` |

Because classification is by extension, there is no notion of a "wrong folder": a
file is either a ROM the registry recognizes (catalogued under its extension's
platform) or clutter it does not (ignored silently). The issue list stays limited
to genuine per-file problems — unreadable bytes and untitled names.

**Orphan reconciliation.** A process that dies mid-scan leaves a `ScanJob` stuck
at `RUNNING`, and the `409` guard then blocks every future scan. Because
execution is in-process in the MVP, any job still `RUNNING` at startup is by
definition orphaned, and is marked `FAILED` during bootstrap. Phase 2 refines
this check against the queue's active jobs.

### Error feedback in the UI

A recorded error the user never sees is a lost error. The adopted principle:
**toast to notify, on-screen text for what needs to be read carefully.**

| Event | Handling |
|-------|----------|
| Scan finished with issues | Warning toast — "Scan complete: 412 games, 3 files skipped" — clickable, opens the detailed list |
| Scan failed | Error toast **and** persistent text on the scan screen (toasts disappear; errors that matter must not) |
| Request error (400, 409, backend down) | Immediate toast with a handled message |

In Angular this is a central `NotificationService` plus an HTTP interceptor that
catches API errors, so no individual component has to remember to handle them.

### Polling, not WebSocket

The frontend polls `GET /scans/:id` once per second while a job runs. SSE or
WebSocket would give smoother progress at the cost of a gateway plus connection
and reconnection handling — for a bar that shows for a few seconds. Deferred to
phase 6, should scans ever get long enough for the user to navigate away.

---

## 6. Testing strategy

The project follows **TDD**: the test is written before the implementation.

### Unit — no I/O, no database

`rom-parser.spec.ts` covers real ROM naming, including the cases that break a
naive regex:

```
Chrono Trigger (USA).sfc                    → title: "Chrono Trigger", region: USA
Final Fantasy VII (USA) (Disc 1).bin        → discNumber: 1
Kirby's Fun Pak (Europe) (En,Fr,De).sfc     → apostrophe and multi-language
Legend of Zelda, The (USA) (Rev A).nes      → trailing article + revision
Super Mario Bros. 3 (USA).nes               → a dot in the title that is not an extension
```

That last one only shows up in production: careless extension handling turns
`Bros. 3` into a bug.

These tests run in milliseconds with no mocks — the direct payoff of keeping
`domain/` pure.

### Integration — temp folder + test Postgres

Three tests carry most of the module's risk:

1. **Idempotency:** scan the same folder twice; expect the same row count.
2. **Rename:** scan, rename a fixture file, scan again; expect the same
   `Game.id` with an updated `filePath`, and no new row.
3. **Missing file:** scan, delete a file, scan again; expect `isMissing = true`
   with the record preserved.

### E2E

`POST /scans` → poll until `COMPLETED` → `GET /games` returns what is expected.
The scaffolding already exists under `backend/test/`.

---

## 7. Build order

| # | Step | Done when |
|---|------|-----------|
| 1 | `docker-compose.yml` with `postgres` | `docker compose up` starts it and the connection works |
| 2 | Prisma schema, first migration, seed (user and platforms) | Tables exist and the seed is applied |
| 3 | Pure domain: `rom-parser`, `platform-detector` + tests | Naming cases pass with no database and no `fs` |
| 4 | `filesystem.adapter` + streaming CRC32 | Walks a real folder and returns paths with checksums |
| 5 | `GET /games` + persistence | The endpoint returns what the seed planted |
| 6 | `scanner.runner`, `POST /scans`, `GET /scans/:id`, orphan reconciliation | A real scan populates the database with queryable progress |
| 7 | Frontend: `NotificationService`, interceptor, library, scan screen | The full flow works on screen, with toasts |
| 8 | Containerize backend and frontend in the compose file | `docker compose up` starts everything |
| 9 | Real README and recorded decisions | Someone clones and runs it without asking questions |

Step 3 precedes 4 and 5 on purpose: it holds the business rules, it is the
cheapest place to fix mistakes, and it is the part that benefits most from being
written test-first.

Documentation is step 9, not step 1. The README only becomes honest once
`docker compose up` actually works — documenting earlier is documenting an
assumption.
