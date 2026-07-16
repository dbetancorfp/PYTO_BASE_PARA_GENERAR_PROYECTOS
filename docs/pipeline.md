# Pipeline

Cada vista pasa por dos fases con reglas de control opuestas, coordinadas por el
**Orquestador** (`/orchestrator`) — en el uso normal no invocas al resto de agentes
directamente.

```
Fase A — paso a paso, revisión humana obligatoria en cada punto
  tú: "lee vistas/<vista>/descripcion_vista_X.md, tablas: [...]"
    → view-designer          → ui-spec.json + functional-spec.json → revisión humana → rehaz | sigue
    → requirement-architect   → use-cases.md + api-contracts.md (+ schema-changes.sql si aplica) → revisión humana → rehaz | sigue
    → tdd-engineer            → tests TDD (rojo) → revisión humana → rehaz | "implementa"

Fase B — autónoma, máximo 10 ciclos completos, sin parar
    → implementer escribe/corrige código → tests TDD
         fail → repite implementer (no consume ciclo)
         pass → reviewer (SOLID + SonarCloud, cobertura 100 %)
              fail → vuelve a implementer (reinicia ciclo, +1)
              pass → e2e-engineer (Cypress)
                   fail → vuelve a implementer (reinicia ciclo, +1)
                   pass → Orquestador avisa: "vista completa"
    → tras 10 ciclos sin converger → Orquestador avisa del fallo
```

No existe boceto visual ni numeración externa de elementos. Cada elemento de una vista
recibe un **`elementId`** (string, kebab-case) asignado por `view-designer` — es el
identificador que atraviesa el resto del pipeline:
`ui-spec.json → functional-spec.json → use-cases.md → tests → código`.

## Agentes

| Agente | Responsabilidad | Input | Output |
|--------|-----------------|-------|--------|
| `orchestrator` | Punto de entrada único; decide qué agente ejecutar, gestiona revisión humana (Fase A) y el bucle autónomo (Fase B, máx. 10 ciclos) | Instrucción del usuario + estado de la vista | Avisos al usuario en cada punto de control |
| `view-designer` | Diseña la UI y el comportamiento de una vista a partir de su descripción en lenguaje natural; introspecciona la BBDD real si `DATABASE_URL` está configurada | `vistas/<vista>/descripcion_vista_<vista>.md` | `vistas/<vista>/ui-spec.json` + `vistas/<vista>/functional-spec.json` |
| `requirement-architect` | Casos de uso + contratos API + cambios incrementales de schema si la vista los necesita | `ui-spec.json` + `functional-spec.json` | `vistas/<vista>/use-cases.md` + `vistas/<vista>/api-contracts.md` (+ `schema-changes.sql`) |
| `tdd-engineer` | Tests unitarios en rojo a partir de los criterios de aceptación | `use-cases.md` + `api-contracts.md` | `src/{backend,frontend}/tests/*.test.ts` |
| `implementer` | Código mínimo para que los tests pasen; también corrige código en la Fase B | Tests en rojo + specs | `src/{backend,frontend}/src/` |
| `reviewer` | Auditoría SOLID + SonarCloud (gate: cobertura 100 %) | Código + tests | `vistas/<vista>/review-report.md` |
| `e2e-engineer` | Tests Cypress por caso de uso | `use-cases.md` + specs | `src/frontend/cypress/e2e/*.cy.ts` |
| `ci-setup` *(on-demand)* | Workflows de GitHub Actions | `CLAUDE.md` + `package.json` | `.github/workflows/*.yml` |
| `doc-reviewer` *(on-demand)* | Audita coherencia de toda la documentación frente al estado real del repo | Todo lo anterior | Informe (sin escritura) |

Cada agente es un role file (`lib/agents/<agente>/<agente>.md`) que Claude Code lee y
ejecuta directamente en sesión, disparado por su slash command
(`.claude/commands/<agente>.md`) o por la herramienta `Skill`.

## RAG *(planeado, no construido)*

El Orquestador y `view-designer` deberían poder consultar una `knowledge_base`
(PostgreSQL + pgvector, embeddings) indexando las descripciones de vista ya escritas, los
artefactos generados y el schema real de Postgres — para dar contexto entre vistas sin que
el usuario tenga que repetirlo cada vez. Esto no existe todavía; se construirá como tarea
propia cuando toque.
