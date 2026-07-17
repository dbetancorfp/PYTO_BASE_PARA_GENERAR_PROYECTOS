# QA technologies (testing and quality)

Source: `package.json`, `.github/workflows/`, `sonar-project.properties`,
`lib/agents/reviewer/`, `lib/agents/tdd-engineer/`.

## Unit tests

- **`bun test`** (Bun's native runner, Jest-compatible API: `describe`/`it`/`expect`). Run
  with `--max-workers=1` (avoids race conditions between tests that share state/port on the
  backend).
- Every `describe()` references an `elementId` (mandatory `CLAUDE.md` convention) to trace
  each test back to the view element it verifies.
- **`@happy-dom/global-registrator`** — simulated DOM to test Web Components (Shadow DOM,
  `customElements`) inside `bun test`, without a real browser.
- Backend: Postgres repositories are tested with a custom `Bun.SQL` double
  (`tests/helpers/fake-sql.ts`), not against a real database in unit tests.
- Coverage: `bun test --coverage --coverage-reporter=lcov` → `coverage/lcov.info`,
  consumed by SonarCloud. **Gate: 100% coverage** (see `lib/agents/reviewer/`).

## End-to-end tests

- **Cypress** — specs per use case in `src/frontend/cypress/e2e/uc-XX-*.cy.ts`, main flow +
  critical alternative flow per use case.
- `includeShadowDom: true` (required because of each component's Shadow DOM).
- **`start-server-and-test`** orchestrates starting the Express server in `DATA_BACKEND=
  postgres` mode + `cypress run` in a single command.
- Deterministic data seeded before each suite against real Postgres — no network mocking in
  e2e.
- No CI workflow for Cypress (explicit in `CLAUDE.md`): e2e only runs locally, unlike unit
  tests, which do run in GitHub Actions.

## Static analysis / code quality

- **Strict TypeScript** via `tsc --noEmit` (`type-check` script in `package.json`) — a type
  gate with no JS emitted (the real JS comes from `bun build`).
- **SonarCloud** (`sonarsource/sonarcloud-github-action`) — bugs, vulnerabilities, code
  smells, code duplication, and **100% coverage**, on every push to `main` and every PR.
  Configured via `sonar-project.properties` (excludes pipeline-generated artifacts,
  `docs/`, `dist/`, `site/`, non-code files) — **this file doesn't exist in the repo yet**;
  it gets created once SonarCloud is actually wired up (via `/ci-setup` or by hand).
  Complements (doesn't replace) `reviewer`'s SOLID review — SonarCloud doesn't detect
  object-oriented design violations.
- **SOLID** principles reviewed as an explicit checklist, audited by `reviewer`, which
  rejects the code and makes the Orchestrator re-invoke `implementer` until it complies.

## CI/CD

- **GitHub Actions**:
  - `.github/workflows/ci.yml` — on-demand output of `/ci-setup`, **not generated yet**.
    Once generated: on push/PR, spins up a `postgres:16` service container, installs with
    `bun install --frozen-lockfile`, runs `bun test` with coverage, publishes to
    SonarCloud.
  - `.github/workflows/deploy-docs.yml` — **already exists and is active**: on changes to
    `docs/**`/`mkdocs.yml`, runs `mkdocs build --strict` (Python) →
    `actions/upload-pages-artifact` → `actions/deploy-pages` (GitHub Pages).
- There is no deployment pipeline for the application itself (only for the documentation).

## Agent-driven QA process (methodology, not a tool)

- **TDD is mandatory** (`CLAUDE.md`): tests red before implementation — `tdd-engineer`
  generates the tests from `functional-spec.json`'s acceptance criteria; `implementer`
  writes the minimal code to turn them green.
- **Explicit human review** during the design phase (view-designer → requirement-architect
  → tdd-engineer): the Orchestrator doesn't move from one agent to the next without user
  approval.
- **Autonomous loop** during the build phase: `implementer` → tests → `reviewer` (SOLID +
  SonarCloud, 100% coverage) → `e2e-engineer`, with an automatic cycle restart on any
  failure (up to 10 cycles) — see `lib/agents/orchestrator/orchestrator.md`.
