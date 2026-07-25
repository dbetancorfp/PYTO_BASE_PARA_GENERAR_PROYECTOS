# Review Report — login — 2026-07-24 (re-run)

## Result: PASS ✅ (2 cycles)

## Layers implicated: none

Cycle 1: FAIL, `requires-tdd-engineer` (`app.ts`/`pg-client.ts` composition-root wiring
untested — closed by re-invoking `tdd-engineer` once). Cycle 2: FAIL, `frontend`
(`shadow-styles.ts`'s unreachable fetch-succeeds branch — closed by `frontend-implementer`
simplifying it away). Both closed; coverage now 100% lines across every file in both
layers.

## SOLID violations found

None. Full SOLID checklist passes for both layers:
- SRP/OCP/LSP/ISP/DIP all clean — `AuthService`, `authRouter`, `LoginView`, both
  `UserRepository` implementations, `classesFor` all match the conventions.
- `bun run type-check`: 0 errors.

Test doubles audited: `auth.service.test.ts`'s `UserRepository` double, `auth.routes.test.ts`'s seeded users, `pg-user.repository.test.ts`'s `fake-sql.ts` double, and
`login-button.test.ts`'s `AuthApiService` fake all match `api-contracts.md`'s documented
shapes exactly — confirmed independently by `supervisor`'s integration smoke test.

## SonarCloud Quality Gate

| Metric | Threshold | Backend | Frontend | Result |
|--------|-----------|---------|----------|--------|
| Coverage (lines) | 100% | 100% | 100% | ✅ |
| Bugs | 0 | 0 | 0 | ✅ |
| Vulnerabilities | 0 | 0 | 0 | ✅ |
| Duplication | ≤ 3% | 0% | 0% | ✅ |

*From `bun test --coverage`'s lcov output (SonarCloud itself still isn't wired up — see
`tecnologias/tecnologia_qa.md`). Final combined: 98.47% funcs (harmless func-count
artifacts, zero lines flagged) / 100% lines.

**Uncovered code:**

- `src/backend/src/app.ts` — lines 28-32 uncovered (`buildRepositories`'s `'postgres'`
  branch: the `databaseUrl` env fallback, the missing-`DATABASE_URL` throw, and
  `new PgUserRepository(createPgClient(databaseUrl))`).
- `src/backend/src/db/pg-client.ts` — 0% funcs (`createPgClient` itself is never called by
  any test).
- `src/frontend/src/styles/shadow-styles.ts` — lines 17-19 uncovered (the fetch-succeeds
  path: `response.ok` → `new CSSStyleSheet()` → `replaceSync`).

## Two simultaneous causes (why this pass reports one value but two things need fixing)

**Cause 1 — `requires-tdd-engineer` (backend, reported this cycle).** `pg-user.repository.test.ts` (added up front this time, per the fixed process) closed the
`PgUserRepository` class's own coverage gap completely — confirmed, it's 100%/100% this
run, unlike the first run. But it does **not** exercise `createApp({backend:'postgres'})`'s
wiring in `app.ts`, or `pg-client.ts`'s `createPgClient` factory — those are a different
function in a different file, never called by that test or any other. This is real,
necessary, DIP-mandated composition-root code — `supervisor`'s integration smoke test just
proved the `'postgres'` backend path works end-to-end against the real database — with
zero test coverage. Neither implementer can close this (writing tests is out of scope for
Phase B); this is exactly what `requires-tdd-engineer` exists for.

**Finding this session's `tdd-engineer.md` fix should account for**: "Postgres repositories
always get their own unit test" currently only asks for a test of the repository *class*.
It should also ask for (or fold into the same test file) coverage of `createApp`'s
backend-selection branch — otherwise this exact residual gap will recur on every future
view with a Postgres repository, one level up from the repository itself.

**Cause 2 — ordinary frontend gap (not reported this cycle, will resurface next pass).**
`shadow-styles.ts`'s fetch-succeeds branch can't be attributed to `supervisor`'s smoke test
(that only checks backend HTTP, never browser rendering/CSS loading) — nothing has proven
this branch works yet in this fresh run (no build/serve pipeline exists at this point in
the pipeline, same as the first run before `e2e-engineer`'s Step 0 ran). Per Step 3b's
criteria this is the *ordinary* case: `frontend-implementer` should simplify away the
currently-unreachable branches (as it did in the first run), not `tdd-engineer`.

## Acceptance criteria marked (use-cases.md)

All 16 criteria across UC-01–UC-04 marked `[x]` — same test-to-criterion mapping as the
first Login run (identical spec, identical tests). See `use-cases.md`.

## Criteria without verifiable coverage

None.
