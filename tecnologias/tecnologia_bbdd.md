# Tecnologías de base de datos

Fuente: `src/backend/src/db/`, `src/backend/src/repositories/`, `vistas/<vista>/schema-changes.sql`.

## Motor

- **PostgreSQL 16** — único motor soportado. La base de datos es real y vive de forma
  continua (no se recrea por proyecto): cada vista puede aportar `schema-changes.sql`
  incremental (`CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`)
  cuando necesita tablas o columnas nuevas — no existe un `schema.sql` monolítico único
  que se reescriba entero en cada iteración (ver `lib/agents/requirement-architect/`).
- Extensión **`pgcrypto`** habilitada (`CREATE EXTENSION IF NOT EXISTS pgcrypto`) para
  funciones de hashing en SQL y generación de UUIDs (`gen_random_uuid()`), aunque el
  hashing de contraseñas de aplicación se hace en la capa Bun (ver más abajo), no en
  PostgreSQL.
- Reglas de dominio que crucen varias tablas (unicidad compuesta, invariantes que un
  `CHECK` simple no puede expresar) se implementan como **funciones + triggers** cuando
  haga falta, no solo como `CHECK`/`UNIQUE`.
- Sin tipos `ENUM`: los dominios cerrados se fuerzan con `CHECK` sobre `VARCHAR`, por
  decisión explícita del proyecto (ver `CLAUDE.md`).

## Cliente / driver

- **`Bun.SQL`** (cliente SQL nativo de Bun, `import { SQL } from 'bun'`) — **no** se usa
  `pg`/`node-postgres` ni ningún ORM (Prisma, Drizzle, TypeORM...). Es el único paquete de
  acceso a datos del proyecto.
- `src/db/pg-client.ts` — factoría mínima: `createPgClient(databaseUrl) → new SQL(databaseUrl)`.
- `src/db/sql-executor.ts` — dos interfaces estructurales propias (no de Bun) que acotan la
  superficie que necesitan los repositorios:
  - `SqlExecutor`: firma de *tagged template* (`sql\`SELECT ...${valor}\``) — permite
    parametrizar queries de forma segura (sin concatenación de strings) y permite
    sustituir el cliente real por un doble de test.
  - `TransactionalSqlExecutor`: añade `sql.begin(fn)` para transacciones atómicas
    multi-sentencia (solo para las escrituras que requieren atomicidad entre varias
    tablas).
- `src/db/schema-bootstrap.ts` — aplica el DDL incremental de una vista (`schema-changes.sql`)
  vía `sql.file()`.

## Patrón de acceso a datos

- **Repository pattern** con inversión de dependencias (DIP): por cada entidad hay una
  interfaz en `src/repositories/*.repository.ts` (p. ej. `EntityRepository`) y **dos
  implementaciones**:
  - `src/repositories/postgres/pg-*.repository.ts` — implementación real contra Postgres
    vía `Bun.SQL`.
  - `src/repositories/in-memory/in-memory-*.repository.ts` — doble en memoria (un `Map`/array
    por entidad en `store.ts`), usado en tests unitarios y en modo `DATA_BACKEND=memory`.
- `src/app.ts` es el **composition root**: `buildRepositories(deps)` decide qué
  implementación inyectar según `AppDeps.backend` (`'memory' | 'postgres'`). Las rutas y
  servicios solo conocen las interfaces, nunca las clases `Pg*`/`InMemory*` concretas.
- Selección de backend en runtime vía variables de entorno (`src/db/env.ts`):
  `DATA_BACKEND=memory|postgres` + `DATABASE_URL` (obligatoria si `postgres`, **pendiente
  de configurar todavía en este proyecto** — ver `.env.example`) + `PORT`.
- Sesiones de usuario **no** se persisten en base de datos: viven en un `Map` en proceso
  (`InMemorySessionRepository`), compartido independientemente del backend de datos
  elegido.

## Seguridad de credenciales

- Contraseñas: **`Bun.password`** (bcrypt, `cost: 10`) — hash y verificación en la capa de
  aplicación (`AuthService`), no en SQL.
- Bloqueo de cuenta tras intentos fallidos configurables, gestionado a nivel de fila
  (columnas tipo `failed_login_attempts`/`account_locked` en la entidad de usuario que
  cada proyecto defina) — lógica en `AuthService`, no en triggers.

## Scripts y entornos

- `bun run db:setup` — aplica el DDL acumulado contra `DATABASE_URL`; una variable de
  entorno fuerza el reset completo en local/test.
- `bun run db:seed:e2e` — datos deterministas para Cypress.
- CI (`.github/workflows/ci.yml`, `e2e.yml`): servicio `postgres:16` como contenedor de
  GitHub Actions (no Testcontainers) para ejecutar `bun test` contra una base de datos
  real.
- Tests unitarios de repositorios Postgres usan un doble de `Bun.SQL` propio
  (`tests/helpers/fake-sql.ts`), no una base de datos real ni Testcontainers.

## Importación masiva de datos

Cuando una vista necesita alta masiva de datos (CSV/JSON/YAML), el patrón es un
servicio de parseo (`<entity>-parser.service.ts`) + un importador
(`<entity>-importer.ts`) que interactúan con las tablas de esa vista vía sus
repositorios — nunca con SQL directo desde la capa de importación. Paquete **`yaml`**
disponible para formatos YAML.
