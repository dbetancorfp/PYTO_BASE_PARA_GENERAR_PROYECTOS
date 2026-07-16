# Patrón — CRUD backend (repository + service + route)

Cuándo aplica: un endpoint gestiona alta/consulta/edición/baja de una entidad. Cubre DIP
(interfaz + doble implementación) y el mapeo de errores de dominio → status HTTP.

## Repository — interfaz + implementación Postgres + doble en memoria

```ts
// repositories/<entity>.repository.ts
export interface <Entity> {
  id: string;
  // ...campos reales de la vista
}

export interface <Entity>Repository {
  findAll(): Promise<<Entity>[]>;
  findById(id: string): Promise<<Entity> | null>;
  create(data: Omit<<Entity>, 'id'>): Promise<<Entity>>;
  update(id: string, data: Partial<Omit<<Entity>, 'id'>>): Promise<<Entity> | null>;
  delete(id: string): Promise<boolean>;
}
```

```ts
// repositories/postgres/pg-<entity>.repository.ts
import type { SqlExecutor } from '../../db/sql-executor';
import type { <Entity>, <Entity>Repository } from '../<entity>.repository';

export class Pg<Entity>Repository implements <Entity>Repository {
  constructor(private readonly sql: SqlExecutor) {}

  async findAll(): Promise<<Entity>[]> {
    return this.sql`SELECT * FROM <entity_table> ORDER BY created_at DESC`;
  }

  async findById(id: string): Promise<<Entity> | null> {
    const [row] = await this.sql`SELECT * FROM <entity_table> WHERE id = ${id}`;
    return row ?? null;
  }

  // create/update/delete siguen el mismo patrón: tagged template, nunca concatenación
}
```

```ts
// repositories/in-memory/in-memory-<entity>.repository.ts
import type { <Entity>, <Entity>Repository } from '../<entity>.repository';

export class InMemory<Entity>Repository implements <Entity>Repository {
  private readonly store = new Map<string, <Entity>>();

  async findAll(): Promise<<Entity>[]> {
    return [...this.store.values()];
  }
  // resto de métodos operan sobre `store`, mismo contrato que la interfaz
}
```

## Service — lógica de negocio, nunca SQL directo

```ts
// services/<entity>.service.ts
import type { <Entity>Repository } from '../repositories/<entity>.repository';

export class <Entity>Service {
  constructor(private readonly repo: <Entity>Repository) {}   // inyección — nunca `new Pg<Entity>Repository()` aquí

  async list(): Promise<<Entity>[]> {
    return this.repo.findAll();
  }

  async create(data: Omit<<Entity>, 'id'>): Promise<<Entity>> {
    // validaciones/reglas de negocio de la vista van aquí, no en la ruta
    return this.repo.create(data);
  }
}
```

## Route — un fichero por entidad, sin lógica de negocio inline

```ts
// routes/<entity>.ts
import { Router } from 'express';
import type { <Entity>Service } from '../services/<entity>.service';

export function <entity>Router(service: <Entity>Service): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await service.list());
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await service.create(req.body));
  });

  return router;
}
```

## Composition root — dónde se decide la implementación real

```ts
// app.ts
const repo: <Entity>Repository =
  deps.backend === 'postgres' ? new Pg<Entity>Repository(sql) : new InMemory<Entity>Repository();
const service = new <Entity>Service(repo);
app.use('/api/<entities>', <entity>Router(service));
```

## Errores de dominio

No lances `Error` genérico desde el service. Usa una clase de error con `code`, mapeada
centralizadamente en `routes/error.ts` (ver `implementer.md` → "Reglas de implementación").
