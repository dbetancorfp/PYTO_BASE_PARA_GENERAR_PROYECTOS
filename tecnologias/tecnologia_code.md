# Tecnologías de código (backend, lenguaje, arquitectura, pipeline)

Fuente: `package.json`, `src/backend/`, `lib/`, `CLAUDE.md`.

## Lenguaje y runtime

- **TypeScript** (compilador `^6.0.3`) en modo `strict` para todo el código de producción
  (backend + frontend + `lib/`). Regla de `CLAUDE.md`: sin `any`, sin retornos implícitos,
  sin parámetros sin tipar.
- **Bun** como runtime único — no Node.js en producción. Bun cubre: ejecución del
  servidor, test runner, empaquetado (`bun build`), gestor de paquetes (`bun.lock`),
  cliente SQL nativo (`Bun.SQL`) y hashing de contraseñas (`Bun.password`).
- Módulos ES nativos (`"type": "module"` en `package.json`).

## Backend

- **Express `^5.2.1`** — enrutador HTTP. Express 5 reenvía automáticamente las excepciones
  de handlers `async` al middleware de error global (`app.ts`), sin necesitar `try/catch`
  manual en cada ruta.
- **`cookie-parser`** — sesión vía cookie `session_id` (no JWT, no `express-session`).
- Un router Express por entidad en `src/routes/` + `multipart.ts` para subida de ficheros
  (cuando una vista lo necesite) + `error.ts` (mapeo centralizado de códigos de error de
  dominio → status HTTP, tabla `STATUS_MAP`).
- **Arquitectura por capas**: `routes/` (HTTP) → `services/` (lógica de negocio) →
  `repositories/` (acceso a datos, interfaz + implementación intercambiable — ver
  `tecnologia_bbdd.md`). Composition root único en `app.ts` (Dependency Inversion).
- **`pdfkit`** — disponible para generación de PDF real cuando una vista lo requiera.
- **`yaml`** — parseo de datos importados en formato YAML.
- Errores de dominio como clases con `code` (string) + `role` opcional, mapeados
  centralizadamente a status HTTP (400/401/403/404/409/423/500) en `routes/error.ts` —
  ningún handler decide el status HTTP directamente.

## Validación

- **Zod** — usado para validar los artefactos JSON del pipeline de agentes
  (`lib/schemas/*.schema.js`: `UISpecSchema`, `FunctionalSpecSchema`). **No** se usa Zod
  para validar los payloads HTTP de la API en runtime — la validación de entrada ahí es
  manual (comprobaciones explícitas en services/routes).

## Pipeline de generación dirigido por agentes (Claude Code)

- El **Orquestador** (`lib/agents/orchestrator/orchestrator.md`) es el punto de entrada
  conversacional único: decide qué agente ejecutar a continuación, gestiona la revisión
  humana en la fase de diseño y el bucle autónomo en la fase de construcción.
- Cada agente subordinado es un **rol en Markdown** (`lib/agents/<agente>/<agente>.md`)
  que Claude Code lee y ejecuta directamente en sesión — sin proceso de orquestación
  aparte ni base de datos intermedia; cada agente lee/escribe directamente en el
  filesystem del repositorio (`vistas/<vista>/`, `src/{backend,frontend}/`).
- Entrada vía **slash commands** (`.claude/commands/*.md`, punteros de una línea al rol) o
  la herramienta `Skill`.
- Ningún agente tiene hoy un script `.js` standalone que llame a la API de Anthropic por su
  cuenta — todos, incluido el Orquestador, se ejecutan como rol Markdown dentro de la
  sesión de Claude Code.
- `lib/tools/rag-client.js` no existe todavía: la `knowledge_base` (pgvector + embeddings)
  está diseñada en la conversación de arranque del proyecto pero pendiente de
  construcción — se documentará aquí cuando exista código real, no antes.
- `cli/commands/commit.md` — el único fichero que queda de un CLI propio previo; es el
  prompt del skill `/commit`, no código JS.

## Convenciones de código

- Nomenclatura: `kebab-case.ts` para ficheros, `PascalCase` para clases, eventos de dominio
  `app:verbo-sustantivo`.
- Principios **SOLID** obligatorios para todo el código generado, verificados por
  `reviewer`.
- Idioma: todo el código, tipos, nombres, comentarios, mensajes de error, logs y commits
  en **inglés**; el vocabulario de dominio y strings de UI pueden estar en español cuando
  reflejan uso real del proyecto concreto que se esté generando.
