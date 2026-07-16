# Architecture

## Tech stack

| Layer | Technology |
|-------|------------|
| Ejecución de agentes | Claude Code — slash commands apuntan a un role file en `lib/agents/*/*.md` |
| Coordinación | Agente Orquestador (`lib/agents/orchestrator/`) |
| Almacenamiento de artefactos | Filesystem local (`vistas/`, `src/`) |
| Base de datos de aplicación | PostgreSQL 16, real y viva — `DATABASE_URL` pendiente de configurar |
| Cliente Postgres | `Bun.SQL` nativo — sin `pg`/node-postgres ni ORM |
| Backend | Bun + Express 5 + TypeScript |
| Validación de artefactos del pipeline | Zod (`lib/schemas/`) |
| Frontend | Web Components nativos + lit-html + Tailwind CSS 3.x + TypeScript |
| Build frontend | `bun build` |
| Tests unitarios | `bun test` |
| Tests e2e | Cypress |
| Calidad de código | SOLID (auditoría del agente `reviewer`) + SonarCloud (cobertura 100 %) |
| CI/CD | GitHub Actions |
| Docs | MkDocs + Material for MkDocs → GitHub Pages |

Detalle completo por capa en `tecnologias/` (raíz del repo):
[`tecnologia_bbdd.md`](https://github.com/dbetancorfp/PYTO_RAG_BASE_GENERA_PROYECTOS/blob/main/tecnologias/tecnologia_bbdd.md),
[`tecnologia_code.md`](https://github.com/dbetancorfp/PYTO_RAG_BASE_GENERA_PROYECTOS/blob/main/tecnologias/tecnologia_code.md),
[`tecnologia_front.md`](https://github.com/dbetancorfp/PYTO_RAG_BASE_GENERA_PROYECTOS/blob/main/tecnologias/tecnologia_front.md),
[`tecnologia_qa.md`](https://github.com/dbetancorfp/PYTO_RAG_BASE_GENERA_PROYECTOS/blob/main/tecnologias/tecnologia_qa.md),
[`tecnologia_ux.md`](https://github.com/dbetancorfp/PYTO_RAG_BASE_GENERA_PROYECTOS/blob/main/tecnologias/tecnologia_ux.md).

## Repository structure

```
vistas/
  <nombre-vista>/
    descripcion_vista_<nombre>.md   # input del usuario
    ui-spec.json                    # salida view-designer
    functional-spec.json            # salida view-designer
    use-cases.md                    # salida requirement-architect
    api-contracts.md                # salida requirement-architect
    schema-changes.sql              # salida requirement-architect (si aplica)
    review-report.md                # salida reviewer

src/
  backend/
    src/                            # salida implementer
    tests/                          # salida tdd-engineer
  frontend/
    src/                            # salida implementer (Web Components)
    dist/                           # salida de bun build
    tests/                          # salida tdd-engineer
    cypress/e2e/                    # salida e2e-engineer

lib/
  agents/          # un subdirectorio por agente — solo .md
  schemas/         # ui-spec.schema.js, functional-spec.schema.js (Zod)

.claude/commands/  # punteros de una línea a lib/agents/*/*.md
tecnologias/       # decisiones de stack detalladas por capa
docs/              # esta documentación (MkDocs)
```

## Frontend: Web Components

Un fichero por componente. Shadow DOM siempre abierto. Render solo con lit-html — nunca
`innerHTML`. La restricción dura es **sin Shadow DOM anidado**: `data-element-id` debe
estar en el elemento nativo para que funcionen los selectores de Cypress y de los tests
unitarios, y un segundo shadow root anidado rompe ambos.

Ver la sección "Frontend: Web Components" de
[`CLAUDE.md`](https://github.com/dbetancorfp/PYTO_RAG_BASE_GENERA_PROYECTOS/blob/main/CLAUDE.md)
para el esqueleto de componente completo y las convenciones de naming.
