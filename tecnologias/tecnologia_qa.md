# Tecnologías de QA (testing y calidad)

Fuente: `package.json`, `.github/workflows/`, `sonar-project.properties`,
`lib/agents/reviewer/`, `lib/agents/tdd-engineer/`.

## Tests unitarios

- **`bun test`** (runner nativo de Bun, API compatible con Jest: `describe`/`it`/`expect`).
  Ejecutado con `--max-workers=1` (evita condiciones de carrera entre tests que comparten
  estado/puerto en el backend).
- Cada `describe()` referencia un `elementId` (convención obligatoria de `CLAUDE.md`) para
  trazar cada test hasta el elemento de la vista que verifica.
- **`@happy-dom/global-registrator`** — DOM simulado para poder testear Web Components
  (Shadow DOM, `customElements`) dentro de `bun test`, sin navegador real.
- Backend: repositorios Postgres se testean con un doble propio de `Bun.SQL`
  (`tests/helpers/fake-sql.ts`), no contra una base de datos real en tests unitarios.
- Cobertura: `bun test --coverage --coverage-reporter=lcov` → `coverage/lcov.info`,
  consumido por SonarCloud. **Gate: 100 % de cobertura** (ver `lib/agents/reviewer/`).

## Tests end-to-end

- **Cypress** — specs por caso de uso en `src/frontend/cypress/e2e/uc-XX-*.cy.ts`, flujo
  principal + alternativo crítico por caso de uso.
- `includeShadowDom: true` (necesario por el Shadow DOM de cada componente).
- **`start-server-and-test`** orquesta el arranque del servidor Express en modo
  `DATA_BACKEND=postgres` + `cypress run` en un único comando.
- Seed de datos deterministas antes de cada suite contra Postgres real — no hay mocking de
  red en e2e.
- No hay workflow de CI para Cypress (explícito en `CLAUDE.md`): e2e solo corre en local,
  a diferencia de los tests unitarios que sí corren en GitHub Actions.

## Análisis estático / calidad de código

- **TypeScript strict** vía `tsc --noEmit` (script `type-check` en `package.json`) —
  gate de tipos sin emitir JS (el JS real lo produce `bun build`).
- **SonarCloud** (`sonarsource/sonarcloud-github-action`) — bugs, vulnerabilidades,
  code smells, duplicación de código y **cobertura al 100 %**, en cada push a `main` y
  cada PR. Configurado por `sonar-project.properties` (excluye artefactos generados del
  pipeline, `docs/`, `dist/`, `site/`, ficheros no-código). Complementa (no sustituye) la
  revisión SOLID de `reviewer` — SonarCloud no detecta violaciones de diseño orientado a
  objetos.
- Revisión de principios **SOLID** como checklist explícita, auditada por `reviewer`, que
  rechaza y hace que el Orquestador reinvoque a `implementer` hasta cumplir.

## CI/CD

- **GitHub Actions**:
  - `.github/workflows/ci.yml` — en push/PR: levanta un contenedor de servicio
    `postgres:16`, instala con `bun install --frozen-lockfile`, corre `bun test` con
    cobertura, publica a SonarCloud.
  - `.github/workflows/deploy-docs.yml` — al cambiar `docs/**`/`mkdocs.yml` (si `docs/`
    existe): `mkdocs build --strict` (Python) → `actions/upload-pages-artifact` →
    `actions/deploy-pages` (GitHub Pages).
- No hay pipeline de despliegue de la aplicación en sí (solo de la documentación).

## Proceso de QA dirigido por agentes (metodología, no herramienta)

- **TDD obligatorio** (`CLAUDE.md`): tests en rojo antes que implementación —
  `tdd-engineer` genera los tests desde los criterios de aceptación de
  `functional-spec.json`; `implementer` escribe el mínimo código para ponerlos en verde.
- **Revisión humana explícita** en la fase de diseño (view-designer → requirement-architect
  → tdd-engineer): el Orquestador no avanza de un agente al siguiente sin aprobación del
  usuario.
- **Bucle autónomo** en la fase de construcción: `implementer` → tests → `reviewer`
  (SOLID + SonarCloud, cobertura 100 %) → `e2e-engineer`, con reinicio automático del ciclo
  ante cualquier fallo (máximo 10 ciclos) — ver `lib/agents/orchestrator/orchestrator.md`.
