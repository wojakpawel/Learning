# Core Beliefs

Non-negotiable project beliefs that should shape architecture, implementation, review, and agent decisions in this repo.

Read this before making architectural choices. Violations are design issues, not style disagreements.

## 1. The server enforces authorization

Access rules live in Express route handlers and are checked on every mutating and sensitive read operation. UI hints such as `canComplete` or `showCreator` are convenience only.

Why this exists:
- A tampered client must not be able to complete someone else's task, kick a member, or read another user's data.

What this means in practice:
- Add or update checks in `server/routes/` when behavior is restricted.
- Return `403` for forbidden actions and `404` when a resource must not be visible to the caller.

What to avoid:
- Relying on hidden buttons or frontend-only guards as the only protection.

## 2. PostgreSQL is the source of truth for persisted state

Tasks, teams, memberships, and invitations are stored in PostgreSQL. The frontend reflects API responses; it does not own durable state.

Why this exists:
- Refresh, logout/login, and multi-user collaboration must see the same data.

What this means in practice:
- Schema changes go through `server/db/schema.sql` and `npm run db:migrate`.
- Use foreign keys and `ON DELETE CASCADE` where orphan rows would be a bug.

What to avoid:
- Client-side caches treated as authoritative across sessions or users.

## 3. All SQL is parameterized

Every query uses `$1`, `$2`, … placeholders. User input never reaches SQL as string concatenation.

Why this exists:
- SQL injection is a known class of failure; this repo treats prevention as non-optional.

What this means in practice:
- Pass values in query parameter arrays, including UUIDs and usernames from requests.

What to avoid:
- Template literals or string building around `pool.query()`.

## 4. Keep the learning scope small and legible

Prefer the smallest change that satisfies the requirement. Reuse existing patterns before adding libraries, abstractions, or doc trees.

Why this exists:
- The project is for learning and iteration; complexity should earn its place.

What this means in practice:
- Match naming and file layout in `src/` and `server/`.
- Use Node's built-in test runner for smoke tests instead of a heavy test stack until more coverage is needed.
- One npm toolchain; no alternate package managers.

What to avoid:
- Framework churn, premature microservices, or docs that duplicate what code already shows.

## 5. Docs change with behavior in the same commit

When user-facing behavior, setup, API contracts, or agent entry points change, update the matching canonical doc in the same change.

Why this exists:
- Drift between code and docs wastes the next contributor's time, human or agent.

What this means in practice:
- See the doc maintenance rule in `AGENTS.md` for which file to touch.
- Canonical docs do not link to execution plans; plans may link to docs.

What to avoid:
- "I'll update the README later" follow-ups that never land.
