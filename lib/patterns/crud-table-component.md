# Patrón — Tabla CRUD (frontend)

Cuándo aplica: una vista lista filas de una entidad con edición inline y borrado
(proyecto: "edición inline en tablas, nunca modal" — ver `CLAUDE.md`).

## Esqueleto de componente

```ts
// <entity>-table.ts
import { html, render } from 'lit-html';
import { classesFor } from '../styles/classes-for';
import { attachSharedStyles } from '../styles/shadow-styles';

interface Row {
  id: string;
  // ...campos reales de la vista
}

export class EntityTable extends HTMLElement {
  private _disposables: Array<() => void> = [];
  private _rows: Row[] = [];
  private _editingId: string | null = null;

  connectedCallback(): void {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    attachSharedStyles(this.shadowRoot!);
    this._render();
  }

  disconnectedCallback(): void {
    this._disposables.forEach((fn) => fn());
    this._disposables = [];
  }

  setRows(rows: Row[]): void {
    this._rows = rows;
    this._render();
  }

  private _startEdit(id: string): void {
    this._editingId = id;
    this._render();
  }

  private async _saveEdit(id: string, data: Partial<Row>): Promise<void> {
    this.dispatchEvent(new CustomEvent('app:row-saved', {
      bubbles: true, composed: true, detail: { id, data },
    }));
    this._editingId = null;
    this._render();
  }

  private _requestDelete(id: string): void {
    // el componente PIDE el borrado, no decide si procede — el service comprueba
    // dependencias (ver "Patrón de borrado bloqueado" más abajo) y responde con éxito o motivo
    this.dispatchEvent(new CustomEvent('app:row-delete-requested', {
      bubbles: true, composed: true, detail: { id },
    }));
  }

  private _render(): void {
    render(html`
      <table class="${classesFor('table', 'default', 'md')}">
        <tbody>
          ${this._rows.map((row) => this._editingId === row.id
            ? this._renderEditRow(row)
            : this._renderReadRow(row))}
        </tbody>
      </table>
    `, this.shadowRoot!);
  }

  private _renderReadRow(row: Row) {
    return html`
      <tr data-element-id="${this.getAttribute('data-element-id')}-row-${row.id}">
        <td>${/* campos de solo lectura */ ''}</td>
        <td>
          <button class="${classesFor('button', 'ghost', 'sm')}"
                  @click=${(): void => this._startEdit(row.id)}>Editar</button>
          <button class="${classesFor('button', 'danger', 'sm')}"
                  @click=${(): void => this._requestDelete(row.id)}>Borrar</button>
        </td>
      </tr>
    `;
  }

  private _renderEditRow(row: Row) {
    // inputs inline vinculados a los campos reales de la vista, sin modal
    return html`<tr>${/* ... */''}</tr>`;
  }
}
customElements.define('entity-table', EntityTable);
```

## Patrón de borrado bloqueado por dependencias

El componente **pide** el borrado (evento `app:row-delete-requested`); quien decide si
procede es el `service` del backend, no el frontend:

```ts
// services/<entity>.service.ts
async delete(id: string): Promise<void> {
  const dependents = await this.dependentsRepo.countFor(id);
  if (dependents > 0) {
    throw new DomainError('HAS_DEPENDENTS', `Cannot delete: ${dependents} dependent records`);
  }
  await this.repo.delete(id);
}
```

El listener del evento en la vista padre traduce el error `HAS_DEPENDENTS` en el mensaje
visible al usuario — el `entity-table` en sí no conoce la regla de negocio de por qué un
borrado puede fallar.

## Reglas

- Edición inline siempre, nunca modal, para tablas de este patrón.
- El componente nunca decide "puedo borrar esto" — ese juicio vive en el service.
- `data-element-id` en cada fila/control interactivo, derivado del `elementId` de
  `ui-spec.json` + el `id` de la fila real, para que Cypress pueda apuntar a filas
  concretas sin depender del orden.
