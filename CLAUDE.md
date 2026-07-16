alwaysApply: true

# CLAUDE.md

## Project

**PYTO_RAG_BASE_GENERA_PROYECTOS** — framework genérico, agnóstico de dominio, para generar
aplicaciones web vista a vista mediante un pipeline de agentes Claude Code coordinados por
un Orquestador conversacional, apoyado en una base de datos PostgreSQL real y (a futuro) en
un sistema RAG que da contexto entre vistas.

No genera una aplicación concreta por sí mismo: cada uso de este framework arranca un
proyecto nuevo, vista a vista, a partir de descripciones en lenguaje natural que el usuario
escribe — sin boceto visual, sin dominio predefinido.

Author: David Betancor, Profesor FP, IES Telesforo Bravo.

## Core Rules

- **Una vista a la vez.** El Orquestador nunca encadena agentes de la fase de diseño sin
  aprobación humana explícita entre ellos (ver "Pipeline" más abajo).
- **TDD.** Los tests se escriben en rojo antes que la implementación.
- **Type safety.** Todo el código completamente tipado — sin `any`, sin retornos
  implícitos, sin parámetros sin tipar.
- **Nombres claros.** Nombres descriptivos. Sin abstracción prematura. Sin código sin usar.
- **Cuestiona lo que no cuadra.** Señala patrones repetidos e inconsistencias potenciales.
- **Sin mecanismos fingidos.** Si algo se documenta como funcionando, funciona de verdad.
  Si algo está planeado pero no construido, se dice explícitamente — nunca se deja un stub
  vacío insinuando un mecanismo que no existe.

## Language

Todos los artefactos técnicos en inglés: código, comentarios, tipos e interfaces
TypeScript, mensajes de error, logs, docs, config, commits de git, nombres de tests,
nombres de schema.

Las cadenas de cara al usuario y el vocabulario de dominio pueden usar español cuando
reflejen el uso real del proyecto concreto que se esté generando — este framework no
impone un dominio ni un idioma de negocio.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Ejecución de agentes | Claude Code — slash commands apuntan a un role file en `lib/agents/*/*.md`; Claude Code adopta esa persona y la ejecuta directamente en sesión |
| Coordinación | Agente **Orquestador** (`lib/agents/orchestrator/`) — punto de conversación único, decide qué agente ejecutar y gestiona los puntos de control (ver "Pipeline") |
| Almacenamiento de artefactos | Filesystem local (`vistas/`, `src/`) — sin base de datos intermedia para el propio pipeline |
| Base de datos de aplicación | **PostgreSQL 16**, real y viva, ya creada por el usuario — `DATABASE_URL` pendiente de configurar (ver `.env.example`) |
| Cliente Postgres | **`Bun.SQL`** nativo — sin `pg`/node-postgres ni ORM (ver `tecnologias/tecnologia_bbdd.md`) |
| Backend | **Bun** + Express 5 + TypeScript |
| Validación de artefactos del pipeline | Zod (`lib/schemas/`) |
| Frontend | Web Components (nativos) + lit-html standalone + Tailwind CSS 3.x + TypeScript |
| Build frontend | `bun build` — `src/frontend/src/*.ts` → `src/frontend/dist/*.js` → `<script type="module">` |
| Tests unitarios | `bun test` (API compatible con Jest) — backend + frontend |
| Tests e2e | Cypress — `src/frontend/cypress/e2e/` |
| Calidad de código | SOLID (auditoría manual del agente `reviewer`) + SonarCloud (cobertura 100 % obligatoria) |
| RAG *(planeado, no construido)* | `knowledge_base` con pgvector + embeddings, para dar contexto entre vistas — ver "RAG" más abajo |
| CI/CD | GitHub Actions (`ci-setup` genera los workflows) |
| Docs | MkDocs + Material for MkDocs, cuando el proyecto concreto las necesite |

## Pipeline

Cada vista pasa por dos fases con reglas de control opuestas, coordinadas por el
**Orquestador** (`/orchestrator`) — el usuario no invoca al resto de agentes directamente
en el uso normal.

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

No existe boceto visual ni numeración externa de elementos (el antiguo `sketchNumber` de
versiones previas de este framework). Cada elemento de una vista recibe un **`elementId`**
(string, kebab-case) asignado por `view-designer` — es el identificador que atraviesa el
resto del pipeline: `ui-spec.json → functional-spec.json → use-cases.md → tests → código`.

### Agentes

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
(`.claude/commands/<agente>.md`, un puntero de una línea) o por la herramienta `Skill`. No
hay proceso de orquestación aparte ni base de datos intermedia para el propio pipeline:
cada agente lee sus inputs y escribe sus outputs directamente en el filesystem
(`vistas/<vista>/`, `src/`).

### CLI

```bash
# Punto de entrada habitual — hablas con el Orquestador, no invocas agentes uno a uno
/orchestrator

# Invocación manual de un agente concreto, si quieres saltarte el flujo del Orquestador
/view-designer
/requirement-architect
/tdd-engineer
bun test                          # RED ✗
/implementer
bun test                          # GREEN ✅
/reviewer
/e2e-engineer
bunx cypress run

# On-demand
/ci-setup
/doc-reviewer
/commit
```

### Zod schemas

- `UISpecSchema` (`lib/schemas/ui-spec.schema.js`) — `screens[].components[]` con
  `elementId`, `type`, `props`, `states`, `interactions`.
- `FunctionalSpecSchema` (`lib/schemas/functional-spec.schema.js`) — `appOverview`;
  `elementSpecs[]` con `elementId`, `behavior`, `businessRules`, `dataNeeds`,
  `acceptanceCriteria`; más `globalRules[]`.

`use-cases.md`, `api-contracts.md` y `review-report.md` son Markdown libre, sin schema —
revisados por el humano o por el siguiente agente que los lee directamente.

## RAG *(planeado, no construido)*

La idea de fondo de este framework es que el Orquestador y `view-designer` consulten una
`knowledge_base` (PostgreSQL + pgvector, embeddings) indexando las descripciones de vista
ya escritas, los artefactos generados (`ui-spec.json`, `functional-spec.json`,
`use-cases.md`, `review-report.md`) y el schema real de Postgres — para dar contexto entre
vistas (convenciones ya usadas, tablas relacionadas) sin que el usuario tenga que repetirlo
cada vez. **Esto no existe todavía.** No hay ningún fichero en el repo insinuando lo
contrario; se construirá como tarea propia cuando toque.

## Frontend: Web Components

Un fichero por componente. Shadow DOM siempre abierto. Render solo con lit-html. Nunca
`innerHTML`. TypeScript compilado con `bun build` — fuente en `src/frontend/src/`, salida
en `src/frontend/dist/`.

**La restricción dura es "sin Shadow DOM anidado", no "sin código compartido".** Nunca
compongas una vista a partir de varios custom elements anidados dentro del Shadow DOM de
otro — el atributo `data-element-id="<elementId>"` debe estar en el elemento nativo para
que funcionen `.type()`/`.click()` de Cypress y `shadowRoot.querySelector()` en tests
unitarios, y un segundo shadow root anidado rompe ambos. Compartir comportamiento entre
vistas casi idénticas vía funciones/clases planas o una **clase base abstracta que extiende
`HTMLElement`** es correcto y se anima una vez la duplicación entre vistas es real —
sigue habiendo un único custom element registrado, un único Shadow DOM, por vista.

### Esqueleto de componente

```ts
// example-button.ts
import { html, render } from 'lit-html';

export class ExampleButton extends HTMLElement {
  private _disposables: Array<() => void> = [];

  connectedCallback(): void {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
    const onClick = (): void => this._handleClick();
    this.shadowRoot!.addEventListener('click', onClick);
    this._disposables.push(() => this.shadowRoot!.removeEventListener('click', onClick));
  }

  disconnectedCallback(): void {
    this._disposables.forEach(fn => fn());
    this._disposables = [];
  }

  private _handleClick(): void {
    this.dispatchEvent(new CustomEvent('app:button-clicked', {
      bubbles: true, composed: true,
      detail: { id: this.getAttribute('data-element-id') },
    }));
  }

  private _render(): void {
    const label  = this.getAttribute('label') ?? 'OK';
    const active = this.hasAttribute('active');
    render(html`
      <button .value=${label} @click=${(): void => this._handleClick()} ?disabled=${!active}>
        ${label}
      </button>
    `, this.shadowRoot!);
  }
}
customElements.define('example-button', ExampleButton);
```

### Rules

| Rule | Detail |
|------|--------|
| Nombre | prefijo propio del proyecto concreto (p. ej. `app-*`); registrado con `customElements.define` |
| Shadow DOM | `this.attachShadow({ mode: 'open' })` en `connectedCallback` |
| Render | `lit-html` únicamente — nunca `innerHTML` |
| Bindings | `.prop=` · `@event=` · `?attr=` · `${items.map(...)}` (listas simples) · `${repeat(...)}` *(importar `lit-html/directives/repeat.js` — listas grandes con key tracking)* |
| Lifecycle | `connectedCallback`: setup + render + subscribe. `disconnectedCallback`: flush disposables |
| Disposables | Cada listener/observer/interval → push de su función de limpieza a `this._disposables` |
| Events | `new CustomEvent('app:verbo-sustantivo', { bubbles:true, composed:true, detail:{} })` |
| Modules | `export class` por fichero; cargado vía `<script type="module">` |

### Naming

| Qué | Patrón | Ejemplo |
|-----|--------|---------|
| Fichero | `kebab-case.ts` | `example-button.ts` |
| Clase | `PascalCase` | `ExampleButton` |
| Elemento | prefijo propio del proyecto | `app-example-button` |
| Evento | `app:verbo-sustantivo` | `app:item-selected` |

## Repository Structure

```
vistas/
  <nombre-vista>/
    descripcion_vista_<nombre>.md   # input del usuario
    ui-spec.json                    # salida view-designer
    functional-spec.json            # salida view-designer
    use-cases.md                    # salida requirement-architect
    api-contracts.md                # salida requirement-architect
    schema-changes.sql              # salida requirement-architect (solo si la vista lo necesita)
    review-report.md                # salida reviewer (SOLID + Sonar)

src/
  backend/
    src/                            # salida implementer — Bun + Express + TypeScript
    tests/                          # salida tdd-engineer
  frontend/
    src/                            # salida implementer — Web Components + TypeScript
    dist/                           # salida de bun build
    tests/                          # salida tdd-engineer
    cypress/
      e2e/                          # salida e2e-engineer

lib/
  agents/          # un subdirectorio por agente — solo .md, sin script standalone
  schemas/         # ui-spec.schema.js, functional-spec.schema.js (Zod, elementId)

.claude/commands/  # punteros de una línea a lib/agents/*/*.md
tecnologias/       # decisiones de stack detalladas por capa (bbdd, code, front, qa, ux)
tests/             # tests del propio framework (schemas.test.js)
```
