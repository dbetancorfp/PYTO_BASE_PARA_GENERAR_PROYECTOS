# Pipeline

Every view goes through two phases with opposite control rules, coordinated by the
**Orchestrator** (`/orchestrator`) — in normal use you don't invoke the other agents
directly.

```
Phase A — step by step, human review required at every point
  you: "read views/<view>/description_<view>.md, tables: [...]"
    → view-designer          → ui-spec.json + functional-spec.json → human review → redo | continue
    → requirement-architect   → use-cases.md + api-contracts.md (+ schema-changes.sql if needed) → human review → redo | continue
    → tdd-engineer            → TDD tests (red) → human review → redo | "implement"

Phase B — autonomous, up to 10 full cycles, no stopping
    → implementer writes/fixes code → TDD tests
         fail → re-run implementer (doesn't consume a cycle)
         pass → reviewer (SOLID + SonarCloud, 100% coverage gate)
              fail → back to implementer (restarts the cycle, +1)
              pass → e2e-engineer (Cypress)
                   fail → back to implementer (restarts the cycle, +1)
                   pass → Orchestrator announces: "view complete"
    → after 10 cycles without converging → Orchestrator reports the failure
```

There is no visual mockup and no external element numbering. Every element of a view gets
an **`elementId`** (kebab-case string) assigned by `view-designer` — this is the identifier
that runs through the rest of the pipeline:
`ui-spec.json → functional-spec.json → use-cases.md → tests → code`.

## Agents

| Agent | Responsibility | Input | Output |
|-------|-----------------|-------|--------|
| `orchestrator` | Single entry point; decides which agent to run, manages human review (Phase A) and the autonomous loop (Phase B, max. 10 cycles) | User instruction + view state | Notifications to the user at every checkpoint |
| `view-designer` | Designs the UI and behavior of a view from its natural-language description; introspects the real DB if `DATABASE_URL` is configured | `views/<view>/description_<view>.md` | `views/<view>/ui-spec.json` + `views/<view>/functional-spec.json` |
| `requirement-architect` | Use cases + API contracts + incremental schema changes if the view needs them | `ui-spec.json` + `functional-spec.json` | `views/<view>/use-cases.md` + `views/<view>/api-contracts.md` (+ `schema-changes.sql`) |
| `tdd-engineer` | Red unit tests from the acceptance criteria | `use-cases.md` + `api-contracts.md` | `src/{backend,frontend}/tests/*.test.ts` |
| `implementer` | Minimal code to make the tests pass; also fixes code during Phase B | Red tests + specs | `src/{backend,frontend}/src/` |
| `reviewer` | SOLID + SonarCloud audit (gate: 100% coverage) | Code + tests | `views/<view>/review-report.md` |
| `e2e-engineer` | Cypress tests per use case | `use-cases.md` + specs | `src/frontend/cypress/e2e/*.cy.ts` |
| `ci-setup` *(on-demand)* | GitHub Actions workflows | `CLAUDE.md` + `package.json` | `.github/workflows/*.yml` |
| `doc-reviewer` *(on-demand)* | Audits the consistency of all documentation against the repo's real state | Everything above | Report (no writes) |

Each agent is a role file (`lib/agents/<agent>/<agent>.md`) that Claude Code reads and runs
directly in-session, triggered by its slash command (`.claude/commands/<agent>.md`) or by
the `Skill` tool.

## RAG *(planned, not built)*

The Orchestrator and `view-designer` should eventually be able to query a `knowledge_base`
(PostgreSQL + pgvector, embeddings) indexing the view descriptions already written, the
generated artifacts, and the real Postgres schema — to give context across views without
the user having to repeat itself every time. This doesn't exist yet; it will be built as
its own task when it's time.
