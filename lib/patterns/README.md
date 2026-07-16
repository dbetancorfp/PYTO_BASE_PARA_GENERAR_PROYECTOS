# Pattern library

Plantillas de estructura, no código ejecutable. `implementer` las lee antes de escribir un
componente o servicio que encaje en una de estas formas, y adapta los placeholders
(`<Entity>`, `<entity>`, `<field>`) a la vista concreta — nunca las copia literalmente sin
adaptar tipos y campos reales.

**Por qué existen**: reducen la varianza entre vistas distintas implementadas por
`implementer` en sesiones distintas, y evitan violaciones SOLID/duplicación que `reviewer`
tendría que rechazar después — más barato prevenir la violación que corregirla en el bucle
de la Fase B.

**Cuándo NO usar un patrón de aquí**: si la forma del problema no encaja con ninguno,
no fuerces el patrón — implementa lo que la spec pida. Esta librería cubre las formas más
comunes, no todas las posibles.

| Patrón | Fichero | Cuándo aplica |
|--------|---------|---------------|
| CRUD backend | [`crud-repository.md`](crud-repository.md) | Un endpoint gestiona alta/consulta/edición/baja de una entidad |
| Select en cascada | [`cascading-select.md`](cascading-select.md) | Un select recarga las opciones de otro al cambiar (padre → hijo) |
| Filtro reactivo | [`reactive-filter.md`](reactive-filter.md) | Una lista debe filtrarse mientras el usuario escribe |
| Tabla CRUD (frontend) | [`crud-table-component.md`](crud-table-component.md) | Una vista lista filas de una entidad con edición inline y borrado |
