# Patrón — Select en cascada

Cuándo aplica: cambiar un select debe recargar las opciones de otro (padre → hijo), y
resetear los selects que dependen de él. `ui-spec.json` lo señala vía `depends_on` en el
componente hijo.

## Controller — lógica de cascada extraída del componente (SRP)

```ts
// controllers/cascade-select.controller.ts
export interface CascadeLevel<T> {
  elementId: string;
  fetchOptions: (parentValue: string | null) => Promise<T[]>;
  onReset?: () => void;
}

export class CascadeSelectController<T> {
  private readonly levels: CascadeLevel<T>[];

  constructor(levels: CascadeLevel<T>[]) {
    this.levels = levels;   // orden = orden de dependencia, padre primero
  }

  async onLevelChanged(index: number, value: string | null): Promise<Map<string, T[]>> {
    const results = new Map<string, T[]>();
    for (let i = index + 1; i < this.levels.length; i++) {
      const level = this.levels[i];
      level.onReset?.();
      const options = value === null ? [] : await level.fetchOptions(value);
      results.set(level.elementId, options);
      value = null; // solo el nivel inmediatamente afectado recibe el valor real
    }
    return results;
  }
}
```

## Uso desde el componente — el componente solo renderiza, no decide la cascada

```ts
private readonly cascade = new CascadeSelectController([
  { elementId: 'year-select', fetchOptions: () => this.api.years() },
  { elementId: 'group-select', fetchOptions: (year) => this.api.groups(year!) },
  { elementId: 'module-select', fetchOptions: (group) => this.api.modules(group!) },
]);

private async _handleYearChange(value: string): Promise<void> {
  const resets = await this.cascade.onLevelChanged(0, value);
  this._optionsByLevel = resets;   // dispara _render()
}
```

## Reglas

- El componente nunca decide "qué recargar después" inline — eso es exactamente la
  responsabilidad que `CascadeSelectController` extrae (si lo escribes dentro del
  componente, `reviewer` lo marcará como violación de SRP).
- Un botón/acción que depende de que **todos** los niveles tengan valor (ej. "Descargar")
  se deshabilita comprobando el último nivel de la cascada, no cada nivel por separado.
- Si algún nivel debe filtrarse por el usuario autenticado (ej. "solo mis módulos"), ese
  filtro va en `fetchOptions`, nunca en el controller genérico.
