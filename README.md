# Champions League Draw — Fullstack Solution

A fullstack application for the UEFA Champions League new format draw: 36 teams, 144 matches, 8 match days.

---

## Getting Started

### Requirements

- Node.js >= 22
- npm >= 10

### Setup & Run

```bash
# Install backend dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Seed the 36 teams
npm run seed

# Start backend (port 8000) + frontend (port 3001) concurrently
npm run dev:all
```

The frontend requires its own dependencies on first run:

```bash
cd frontend
npm install
```

### Run separately

```bash
# Backend only (port 8000)
npm run dev

# Frontend only (port 3001)
npm --prefix frontend run dev -- -p 3001
```

### Run tests

```bash
# Unit tests (Vitest)
npm run test:unit

# Integration tests (Mocha + Chai HTTP)
npm test
```

---

## API Reference

### Draw

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/draw` | Run the draw. Returns 409 if one already exists. |
| `GET` | `/draw` | Get the current draw. Returns 404 if none exists. |
| `DELETE` | `/draw` | Reset the draw. Returns 404 if none exists. |

### Matches

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/matches` | Paginated match list with optional filters |

Query params for `GET /matches`:

| Param | Type | Description |
|-------|------|-------------|
| `teamId` | number | Filter by team |
| `matchDay` | number (1–8) | Filter by match day |
| `page` | number (≥ 1) | Page number (default: 1) |
| `limit` | number (1–100) | Results per page (default: 20) |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/teams` | List all 36 teams with their country |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |

---

## Architecture

The backend follows **Domain-Driven Design** with three bounded contexts:

```
src/contexts/
├── draw/          — draw creation, domain logic, draw repository
├── matches/       — match querying, pagination, filtering
└── teams/         — team listing
```

Each context is layered:

- **domain/** — entities, repository interfaces, domain services
- **application/** — use case services
- **infrastructure/** — Prisma repository implementations
- **presentation/** — Express routers, Zod DTOs

**Dependency injection** is handled by InversifyJS. All bindings are declared in `src/shared/container/`, keeping concrete implementations decoupled from the application layer.

The **frontend** is a Next.js 16 App Router application. Data fetching uses TanStack Query for caching and loading state management. All API calls are centralized in `frontend/src/services/api.ts` and shared TypeScript types live in `frontend/src/types/index.ts`.

---

## Bugs Fixed

### 1. Wrong country opponent limit
`MAX_COUNTRY_OPPONENTS` was set to `3` instead of `2`, allowing teams to face more than 2 opponents from the same country.
**Fix:** changed the constant to `2` in `draw-assigner.service.ts`.

### 2. No duplicate draw check
`CreateDrawService` would create a new draw even if one already existed, leading to duplicate data.
**Fix:** added a check via `DrawRepository.searchCurrent()` before running the draw; throws `DrawAlreadyExistsError` if one exists.

### 3. `DrawAlreadyExistsError` not handled in router
The error was thrown but not caught, falling through to a generic 500.
**Fix:** added an explicit `instanceof DrawAlreadyExistsError` catch that returns `409`.

### 4. Zod validation defined but unused in matches router
`SearchMatchesQuerySchema` was imported and declared but `safeParse` was never called — query params were passed through unvalidated.
**Fix:** wired up `safeParse` and returned 400 on failure. Also fixed `.errors` → `.issues` (Zod v4 breaking change).

### 5. Missing pagination validation in `SearchMatchesService`
No lower-bound check on `page` (could be 0 or negative) and no upper-bound cap on `limit` (could request thousands of rows).
**Fix:** added `page < 1` guard and `limit > 100` cap.

### 6. Type mismatch: `drawId` passed as string
`Match.create()` expects `drawId` as `number`, but it was being passed as `String(drawId)`.
**Fix:** removed the `String()` cast, passing the numeric value directly.

### 7. Missing `DELETE /draw` endpoint
No way to reset the draw existed.
**Fix:** implemented `DELETE /draw` with a 404 check before deletion.

### 8. Missing `GET /health` endpoint
**Fix:** added health check returning `{ status, service, timestamp }`.

---

## Design Decisions & Assumptions

### Country vs. Confederation
The original schema was created with a `Confederation` field and later renamed to `Country` via migration. The domain constraint — "no two teams from the same confederation can face each other, max 2 per team" — is enforced at the `country` level. In practice, for this dataset, each team's country uniquely determines its football association, making country a valid proxy for confederation. This is documented as an assumption since the two concepts are not strictly equivalent (e.g., England and Spain are both UEFA but different countries).

### Draw algorithm
The algorithm uses a **minimum remaining values (MRV)** heuristic: at each step it prioritizes the most constrained team (fewest valid opponents remaining). When multiple teams are equally constrained, one is selected randomly. This ensures constraint satisfaction while producing a different draw on each run. The algorithm retries up to 500 times if a dead-end is reached.

### Idempotent reset
`DELETE /draw` performs a hard delete of all draw data (matches, draw record). A fresh `POST /draw` can then be called to generate a new draw. This keeps the state machine simple: the system is either in "no draw" or "draw exists" state.

### Frontend data fetching
When a specific team is selected in the match schedule, the frontend fetches all matches for that team in a single request (up to 100) and applies home/away filtering client-side. This avoids an extra round-trip and keeps the filter UX instant after the initial load.

---

## Project Structure

```
.
├── src/
│   ├── contexts/
│   │   ├── draw/
│   │   ├── matches/
│   │   └── teams/
│   └── shared/
│       ├── container/        — InversifyJS DI bindings
│       ├── domain/           — base classes (AggregateRoot, ValueObject)
│       └── infrastructure/   — Prisma client, base repository
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── test/                     — Mocha integration tests
├── frontend/
│   └── src/
│       ├── app/              — Next.js App Router pages
│       ├── components/       — Navbar, MatchRow, Pagination
│       ├── services/         — API client
│       └── types/            — Shared TypeScript types
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 22 |
| Language | TypeScript 5 |
| Framework | Express 4 |
| ORM | Prisma 7 |
| Database | SQLite (BetterSQLite3 adapter) |
| DI | InversifyJS |
| Validation | Zod v4 |
| Unit tests | Vitest |
| Integration tests | Mocha + Chai HTTP |
| Frontend | Next.js 16 (App Router) |
| UI state | TanStack Query v5 |
| Styling | Tailwind CSS v4 |
