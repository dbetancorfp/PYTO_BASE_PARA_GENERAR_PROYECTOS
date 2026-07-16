# Patrón — Filtro reactivo

Cuándo aplica: una lista debe filtrarse mientras el usuario escribe (`props.is_reactive:
true` en `ui-spec.json`). Regla del proyecto: sin debounce de terceros, y sin re-fetch al
servidor en cada tecla si el dataset ya está en memoria.

## Controller — filtrado extraído del componente (SRP)

```ts
// controllers/reactive-filter.controller.ts
export class ReactiveFilterController<T> {
  private allItems: T[] = [];

  constructor(private readonly matches: (item: T, term: string) => boolean) {}

  setItems(items: T[]): void {
    this.allItems = items;
  }

  filter(term: string): T[] {
    const normalized = term.trim().toLowerCase();
    if (normalized === '') return this.allItems;
    return this.allItems.filter((item) => this.matches(item, normalized));
  }
}
```

## Uso desde el componente

```ts
private readonly filterCtrl = new ReactiveFilterController<Entity>(
  (item, term) => item.name.toLowerCase().includes(term),
);

private _handleInput(term: string): void {
  this._visibleRows = this.filterCtrl.filter(term);   // dispara _render(), sin red
}
```

## Cuándo sí hace falta red (dataset grande, no cabe en memoria)

Si el dataset es demasiado grande para filtrar en cliente, el filtro reactivo llama al
backend — pero sigue sin debounce de terceros: usa `AbortController` para cancelar la
petición anterior si el usuario sigue escribiendo, no un `setTimeout`.

```ts
private _pendingFilter: AbortController | null = null;

private async _handleInput(term: string): Promise<void> {
  this._pendingFilter?.abort();
  this._pendingFilter = new AbortController();
  const rows = await this.api.search(term, { signal: this._pendingFilter.signal });
  this._visibleRows = rows;
}
```

## Reglas

- El componente delega el filtrado (o la llamada de red) al controller — no contiene
  lógica `if (term.length > 0) { ... }` propia dispersa entre el render y el handler.
- El estado "sin resultados" es un estado explícito del componente (`states` en
  `ui-spec.json`), no un array vacío sin feedback visual.
