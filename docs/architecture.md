# Architecture

## Tech stack

| Layer | Technology |
|-------|------------|
| Agent execution | Claude Code — slash commands point to a role file in `lib/agents/*/*.md` |
| Coordination | Orchestrator agent (`lib/agents/orchestrator/`) |
| Artifact storage | Local filesystem (`views/`, `src/`) |
| Application database | PostgreSQL 16, real and live — `DATABASE_URL` pending configuration |
| Postgres client | `Bun.SQL` native driver — no `pg`/node-postgres, no ORM |
| Backend | Bun + Express 5 + TypeScript |
| Pipeline artifact validation | Zod (`lib/schemas/`) |
| Frontend | Native Web Components + lit-html + Tailwind CSS 3.x + TypeScript |
| Frontend build | `bun build` |
| Unit tests | `bun test` |
| E2E tests | Cypress |
| Code quality | SOLID (audited by the `reviewer` agent) + SonarCloud (100% coverage) |
| CI/CD | GitHub Actions |
| Docs | MkDocs + Material for MkDocs → GitHub Pages |

Full detail per layer in `tecnologias/` (repo root):
[`tecnologia_bbdd.md`](https://github.com/dbetancorfp/PYTO_BASE_PARA_GENERAR_PROYECTOS/blob/main/tecnologias/tecnologia_bbdd.md),
[`tecnologia_code.md`](https://github.com/dbetancorfp/PYTO_BASE_PARA_GENERAR_PROYECTOS/blob/main/tecnologias/tecnologia_code.md),
[`tecnologia_front.md`](https://github.com/dbetancorfp/PYTO_BASE_PARA_GENERAR_PROYECTOS/blob/main/tecnologias/tecnologia_front.md),
[`tecnologia_qa.md`](https://github.com/dbetancorfp/PYTO_BASE_PARA_GENERAR_PROYECTOS/blob/main/tecnologias/tecnologia_qa.md),
[`tecnologia_ux.md`](https://github.com/dbetancorfp/PYTO_BASE_PARA_GENERAR_PROYECTOS/blob/main/tecnologias/tecnologia_ux.md).

(These five files keep their Spanish `tecnologia_*` filenames as an established repo
convention; their content is in English like the rest of the documentation.)

## Repository structure

```
views/
  <view-name>/
    description_<view-name>.md      # user input
    ui-spec.json                    # view-designer output
    functional-spec.json            # view-designer output
    use-cases.md                    # requirement-architect output
    api-contracts.md                # requirement-architect output
    schema-changes.sql              # requirement-architect output (if needed)
    review-report.md                # reviewer output

src/
  backend/
    src/                            # implementer output
    tests/                          # tdd-engineer output
  frontend/
    src/                            # implementer output (Web Components)
    dist/                           # bun build output
    tests/                          # tdd-engineer output
    cypress/e2e/                    # e2e-engineer output

lib/
  agents/          # one subdirectory per agent — .md only
  schemas/         # ui-spec.schema.js, functional-spec.schema.js (Zod)
  patterns/        # reusable structural templates (see "Pattern library")

.claude/commands/  # one-line pointers to lib/agents/*/*.md
tecnologias/       # detailed stack decisions per layer
docs/              # this documentation (MkDocs)
```

## Pattern library

`lib/patterns/` holds structural templates — not runnable code — for shapes that repeat
across different views: backend CRUD (repository + service + route), cascading select,
reactive filter, inline-edit CRUD table. `implementer` checks them before writing a service
or component that fits one of those shapes.

This was chosen over RAG/few-shot from prior views because, for this project, views are
meant to be very different from each other in content — what repeats is structural *shape*,
not the view itself. See [Pipeline](pipeline.md#rag-planned-not-built) for the reasoning
behind why RAG itself remains unbuilt.

## Frontend: Web Components

One file per component. Shadow DOM always open. Render with lit-html only — never
`innerHTML`. The hard constraint is **no nested Shadow DOM**: `data-element-id` must sit on
the native element for Cypress's and the unit tests' selectors to work, and a second nested
shadow root breaks both.

See the "Frontend: Web Components" section of
[`CLAUDE.md`](https://github.com/dbetancorfp/PYTO_BASE_PARA_GENERAR_PROYECTOS/blob/main/CLAUDE.md)
for the full component skeleton and naming conventions.
