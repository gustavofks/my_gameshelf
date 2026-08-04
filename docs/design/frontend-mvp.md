# Design — Frontend (MVP)

**Date:** 2026-07-27
**Status:** Approved
**Scope:** my_gameshelf frontend — the Angular app over the scan + catalog backend

This is Plano 2. It builds the frontend for the backend delivered in Plano 1
(`docs/design/scanner-mvp.md`): a library browsed by console and a scan screen.
The full product vision (backlog, organizer) is present in the navigation as
"work in progress" placeholders but is not implemented here.

---

## 1. Goal and boundaries

Build a functional, distinctive frontend for what the backend exposes today:
`GET /games`, `POST /scans`, `GET /scans/:id`. The app ships the whole product's
navigation skeleton so the vision is visible, but only the sections the backend
can support are functional.

### What is functional in this cycle

- **Library** — browse the catalog by console, EmulationStation-DE-style grid,
  with the game **title as a placeholder** where box art will later go.
- **Scan** — trigger a scan, watch progress, see issues; the way the library is
  populated. Reached from a **"Scan" action in the Library toolbar** and from the
  empty-state onboarding — not a sidebar section (the sidebar holds the four
  conceptual areas; scanning is an action on the library).
- **Settings** — the language toggle (EN / PT-BR) is functional.

### What is present but a placeholder (WIP)

- **Backlog** and **Organizer** appear in the sidebar and render a "work in
  progress" screen when opened. Their navigation contracts are documented below
  as forward-looking intent so the architecture anticipates them, but no
  behavior is built.

### Deferred to later phases (roadmap)

| Feature | Depends on | Phase |
|---------|-----------|-------|
| Box art, genre, synopsis on cards | metadata (No-Intro DATs / IGDB) | backend phase 3 |
| Backlog (saves, playtime, ratings) | save detection + platform extraction | backend phase 4 |
| Organizer suggestions by genre/series | genre metadata | phase 3+ |
| Organizer that **moves files** | writing to disk | future — see note |
| Desktop shell (Electron) with the native OS folder dialog | packaging a desktop build; swaps the `FolderPickerService` provider | future — own plan |
| Manual game entry | backend design: scanner is the source of truth today | future — own plan |

**Note on the file-moving organizer.** The MVP backend mounts the ROM folder
**read-only** and never writes to it, by design, to never corrupt the
collection. An organizer that physically reorganizes files inverts that safety
principle. For now the organizer stays a **virtual suggestion** only; a real
file-management feature is a deliberate future discussion, not part of this or
the next phase.

### Success criteria

1. `ng serve` proxies to the backend; the app runs with no CORS or hardcoded host.
2. A fresh library (no games) guides the user to scan (onboarding empty state).
3. Triggering a scan shows live progress and any issues, then the library fills.
4. The library browses games by console in an ESDE-style grid.
5. Language switches between EN and PT-BR live, and the choice persists.
6. Filter state lives in the URL: a link reproduces the exact view.
7. Presentational components are tested with no HTTP and no router.

---

## 2. Locked decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Framework | Angular 21 standalone + signals | The scaffold's baseline; modern Angular |
| Styling | Tailwind CSS v4 | Already installed in the scaffold |
| i18n | Transloco | Runtime language switch (EN/PT-BR); signals-friendly, actively maintained |
| State | Signals + injectable services | Backend is the source of truth; no NgRx (YAGNI) |
| Filter state | The **URL** is the single source of truth | Shareable, restorable, browser-history-friendly; no duplicated state |
| Reactive fetch | `resource()` / `rxResource()` | Idiomatic Angular 21; avoids manual `subscribe` |
| Testing | Vitest | The scaffold's default (`@angular/build:unit-test`) |
| Progress updates | Polling `GET /scans/:id` | Matches the backend's polling decision (not WebSocket) |

### Visual craft at build time

Component implementation should invoke the **`frontend-design`** skill so the UI
is distinctive and polished rather than generic, using EmulationStation DE as the
visual reference and the Tailwind design tokens. This is an implementation-time
concern; it does not change the information architecture decided here.

---

## 3. Information architecture and navigation

The library is the app's home and entry point. The primary navigation is a
sidebar; consoles are content **inside** the Library, not sidebar entries.

### Sidebar (the shell)

```
┌────────┬──────────────────────────────────┐
│ SIDEBAR│  CONTENT (<router-outlet>)        │
│        │                                   │
│ Library│  /library/snes:                   │
│ Backlog│  ┌──────┬──────┬──────┐  console  │
│Organizer│ │ game │ game │ game │  rail on  │
│ Settings│ └──────┴──────┴──────┘  the left │
└────────┴──────────────────────────────────┘
```

Sidebar: **Library, Backlog, Organizer, Settings**. Inside Library, a **console
rail** (ESDE-style) leads to a console's gamelist. Backlog and Organizer are
cross-cutting views over all consoles.

### Routes

```
/                       → redirect to /library
/library                → console rail ("All" pre-selected) + all-games grid
/library/:platformSlug  → the console's gamelist (search via ?search=)
/scan                   → scan screen (folder, progress, issues)
/backlog                → WIP placeholder (contract: ?platform=&status=)
/organizer              → WIP placeholder
/settings               → language toggle (functional)
/**                     → 404
```

`:platformSlug` matches the backend slugs (`ds`, `gba`, `snes`…). Routes are
lazy-loaded per feature to keep the initial bundle small.

**Reaching Scan.** `/scan` is not a sidebar entry. It is reached from a "Scan"
action in the Library toolbar (to rescan and pick up new ROMs) and from the
empty-state onboarding on first use. The sidebar stays limited to the four
conceptual areas.

### URL as state (cross-cutting principle)

Every filter is reflected in the URL and the URL is the single source of truth.
Changing a filter means **navigating** (updating the URL), not setting a signal
directly; signals *derive* from the URL via the Router's `queryParamMap` /
`paramMap`. This makes the back button, link sharing, and refresh work for free,
with no parallel state to desync. The Library adopts this now; Backlog and
Organizer inherit the pattern when built.

### Forward-looking navigation contracts (documented, not built)

- **Backlog** — shows all library games, grouped by status (playing / never
  played / completed), filterable by console, genre, tags. Entering it from a
  console pre-applies that console's filter. URL shape: `/backlog?platform=ds&status=playing`.
- **Organizer** — analyzes the library and suggests reorganizations by rule
  (genre, series, alphabetical). Virtual only in the current design.

---

## 4. Component and folder structure

Angular 21 standalone, organized by feature, with a smart/dumb split.

```
frontend/src/app/
  core/                        app-wide singletons (providedIn: root)
    api/
      api.types.ts             response types mirroring the backend
      games-api.service.ts     GET /games
      platforms-api.service.ts GET /platforms
      scan-api.service.ts      POST /scans, GET /scans/:id
    notification/
      notification.service.ts  central toasts
    error/
      http-error.interceptor.ts
  layout/
    shell/                     sidebar + <router-outlet> + toast container
    sidebar/                   section nav, active link
    language-toggle/           EN/PT via Transloco
  features/
    library/
      library.routes.ts
      library-page/            (smart) reads route/query, injects the store
      library.store.ts         signals derived from the URL
      console-rail/            (dumb) console list, input/output
      game-grid/               (dumb) grid of cards
      game-card/               (dumb) ESDE card, title-as-placeholder
    scan/
      scan.routes.ts
      scan-page/               (smart) starts scan, polls status
      scan-progress/           (dumb) bar + status
      scan-issues/             (dumb) issue list
      folder-picker/           (smart) server directory browser, emits a path
    backlog/  backlog-page/    (WIP placeholder)
    organizer/ organizer-page/ (WIP placeholder)
    settings/ settings-page/   (language toggle functional, rest WIP)
  shared/ui/                   dumb reusable components
    wip-placeholder/           the "work in progress" screen
    empty-state/               "no games — scan now"
    spinner/
  app.routes.ts   app.config.ts
```

### Principles

- **Smart vs dumb.** `*-page` components are smart: inject services, read the
  route, orchestrate. Presentational components (`game-card`, `console-rail`,
  `scan-progress`) are dumb: only `input()` in, `output()` out, no service
  dependency. This is what makes them testable in isolation and reusable.
- **`core` / `shared` / `features` boundary.** `core` = singleton services;
  `shared` = reusable dumb UI; `features` = each section, isolated and
  lazy-loaded. A feature imports only from `core`/`shared`, never from another
  feature — the same clear boundary as the backend's `domain/` rule.
- **One file, one responsibility.** When a component grows, it is doing too much;
  split it.

### API types — an honest debt

`api.types.ts` mirrors the backend responses by hand. Front and back types can
drift if the backend changes. Sharing types (OpenAPI generation or a monorepo)
is a future improvement — YAGNI now.

---

## 5. Data flow

### API layer

Thin services that speak HTTP and return typed values. `HttpClient` provided in
`app.config.ts` via `provideHttpClient(withInterceptors([...]))`.

```
GamesApiService.list({ platform?, search?, page? })  → GET /games
PlatformsApiService.list()                            → GET /platforms → [{ slug, name, gameCount }]
ScanApiService.start(rootPath?)                       → POST /scans → { id }
ScanApiService.status(id)                             → GET /scans/:id
FsApiService.directories(path?)                       → GET /fs/directories → { path, parent, dirs }
```

**Folder picker.** The scan screen's folder field gets a **Browse** action that
opens an inline directory browser fed by `GET /fs/directories` (see the backend
spec): it opens at the server's default ROM root, shows the current path, an
"up" action and the subdirectory list; picking a directory fills the folder
field with its absolute path. The field stays editable — typing a path remains
a first-class fallback. A browser-native folder dialog is not an option here:
web pages never receive absolute filesystem paths, and the scan runs on the
backend's filesystem. The picker is a `scan/` feature component (not
`shared/ui`) because it talks to the API through `FsApiService` — it is smart
by necessity, and its dumb parts stay inline until something else needs them.

**Picker abstraction.** The scan page does not know how a folder gets picked.
It depends on an abstract `FolderPickerService` with a single portable
contract — `pick(): Promise<string | null>` (an absolute path, or null on
cancel). The default `WebFolderPickerService` fulfils it by toggling the
inline browser described above. A future desktop shell (e.g. Electron) swaps
in an implementation that calls the native folder dialog — one provider
change in `app.config.ts`, no change to the scan page, the scanner, or the
backend, which remains the owner of all ROM reading per the scanner spec.

The console rail is fed by `GET /platforms`. Its first entry is **All** —
the default selection at `/library`, showing the whole collection — followed
by only the platforms with `gameCount > 0` (ESDE-style: you see the consoles
your collection actually has). An empty library shows the rail with just
"All" and the grid area routes into the scan onboarding.

In development, `ng serve` uses a **proxy** (`proxy.conf.json`) mapping `/games`
and `/scans` to `localhost:3000`, so the API URL stays relative — no CORS, no
hardcoded host.

### Library state — the URL drives

```
URL (/library/snes?search=metroid)
   │  Router: paramMap + queryParamMap
   ▼
LibraryStore (signals)
   ├─ platform = signal(from route)
   ├─ search   = signal(from query param)
   └─ games    = rxResource that refetches when platform/search change
   ▼
LibraryPage reads games() → passes to GameGrid via input()
```

Changing a filter navigates (updates the URL); the signal derives from it. No
duplicated state to desync.

### Scan polling

```
POST /scans → id
  ↓
timer(0, 1000) while status ∈ {PENDING, RUNNING}
  → GET /scans/:id → update progress signal
  ↓
status COMPLETED/FAILED → stop polling, show issues, reload the library
```

Polling stops on component destroy (`takeUntilDestroyed`) — no subscription leak.

### i18n (Transloco)

`provideTransloco` in `app.config`, two files: `assets/i18n/en.json`,
`assets/i18n/pt.json`, keyed by namespace (`library.empty`, `scan.progress`). The
language toggle calls `translocoService.setActiveLang()` and persists the choice
in `localStorage`. Initial language: `localStorage` → browser language → EN.

### Cross-cutting rule

No component calls `HttpClient` directly — only through `core/api` services. No
dumb component injects a service. Data flows down via `input()`, events up via
`output()`. This is what keeps components testable without HTTP mocks.

---

## 6. Error handling and UX

### Central HTTP error interceptor

One `HttpInterceptor` catches every failed request, so no component handles
errors on its own.

| Status | Handling |
|--------|----------|
| 0 / backend down | toast "API unavailable" |
| 400 (bad scan path) | toast with the backend message |
| 409 (scan already running) | toast "A scan is already running" |
| 404 | handled toast |
| 5xx | toast "Unexpected error" |

Principle, mirroring the backend: **toast to notify, on-screen text for what
needs to be read carefully.**

### NotificationService + toasts

A central service with a toast queue and auto-dismiss (errors linger longer). A
`ToastContainer` in the shell renders them. Simple API: `notify.success()`,
`notify.warning()`, `notify.error()`. All messages translated.

### Four states per data view

Every view that fetches has four states, not one:

| State | Library | Scan |
|-------|---------|------|
| Loading | grid skeleton / spinner | — |
| Empty | "No games — scan now" → /scan | empty catalog |
| Error | "Failed to load" + retry | scan FAILED, persistent text |
| Success | game grid | progress → issues |

The Library's **empty state is the onboarding**: first use has no games, so the
screen guides to the scan. It is a call-to-action, not a dead screen.

### Scan feedback (inherits the backend spec)

| Event | Handling |
|-------|----------|
| Scan finished with issues | warning toast, clickable → opens the issue list |
| Scan failed | error toast **plus** persistent text on the scan screen |
| Progress | bar `filesProcessed / filesFound` |

### Accessibility and responsiveness (a decent floor)

- Keyboard navigation on the sidebar and grid, visible focus.
- `aria-label` on icon-only controls, `alt` on placeholders.
- Responsive grid (columns by width), sidebar collapsible on narrow screens.
- AA contrast via Tailwind tokens.

Not a full WCAG audit — the floor that avoids an exclusionary UI, appropriate for
the MVP.

---

## 7. Testing

Vitest, TDD (test first), in three layers.

### Presentational (dumb) components — the bulk, cheap

Tested in isolation, no HTTP, no router. `input()` in, DOM / `output()` out.

```
game-card      → renders title/region/disc; no art → title placeholder
game-grid      → renders N cards; empty list → nothing
console-rail   → emits an output on click
scan-progress  → renders the bar at the right %
```

The frontend analogue of the backend's pure-domain tests: fast, no heavy mocks.

### Services — with HttpClient mocked

`provideHttpClientTesting()`. Assert the right URL/params and the response mapping.

```
GamesApiService → GET /games?platform=snes&search=x builds the right URL
ScanApiService  → start() POSTs, status() GETs /scans/:id
LibraryStore    → changing platform refetches
```

### Pages (smart) — behavior tests

Few, covering route + service + render. E.g. `library-page` with a `search` query
param filters; the empty state shows the scan call-to-action.

### What carries the risk (few tests, high value)

| Test | Protects |
|------|----------|
| Filter reflects in the URL and restores | the URL-as-state decision |
| Empty state → scan onboarding | first use |
| Scan polling stops on destroy | subscription leak |
| `game-card` with no art → title placeholder | the ESDE-without-art decision |

### Out of scope now

E2E (Playwright/Cypress) — nice to have, deferred to the roadmap. Component and
service tests cover the real risk without the cost of a browser.
