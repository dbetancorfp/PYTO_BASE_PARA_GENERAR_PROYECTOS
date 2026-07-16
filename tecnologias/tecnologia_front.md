# Tecnologías de frontend

Fuente: `src/frontend/`, `CLAUDE.md`.

## Base

- **Web Components nativos** (`customElements.define`, `HTMLElement`) — sin framework
  (no React/Vue/Svelte/Angular). Un archivo TypeScript por componente, con un prefijo
  propio del proyecto (p. ej. `app-*`).
- **Shadow DOM siempre abierto** (`this.attachShadow({ mode: 'open' })` en
  `connectedCallback`). Regla dura del proyecto: **nunca** anidar un custom element dentro
  del Shadow DOM de otro — cada pantalla es un único custom element con un único
  Shadow Root, para que `data-element-id="N"` sea alcanzable por `shadowRoot.querySelector()`
  (tests unitarios) y por `.type()`/`.click()` de Cypress.
- **lit-html** (standalone, `^3.3.3`) como único motor de render — `html` + `render()`.
  Nunca `innerHTML`. Bindings: `.prop=`, `@event=`, `?attr=`, `${items.map(...)}` para
  listas simples, `${repeat(...)}` (`lit-html/directives/repeat.js`) para listas grandes
  con *key tracking*.
- **TypeScript** estricto (`strict: true` en `tsconfig.json`), sin `any` ni retornos
  implícitos (regla de `CLAUDE.md`).

## Build

- **`bun build`** compila `src/frontend/src/index.ts` →
  `dist/*.js` (`--target browser`), cargado en el HTML vía `<script type="module">`.
- **Tailwind CSS 3.x** compilado aparte con `bunx tailwindcss` (`build:css` en
  `package.json`) → `dist/tailwind.css`. No pasa por `bun build`; ver
  `tecnologia_ux.md` para cómo se inyecta en cada Shadow DOM.
- No hay bundler adicional (Webpack/Vite/esbuild-standalone): `bun build` es el único paso.

## Estructura interna (`src/`)

- `components/` — un componente por vista del proyecto (una vista = una entrada en
  `vistas/`, ver `CLAUDE.md`).
- `controllers/` — lógica de UI extraída de los componentes (cascadas de filtros
  reactivos, flujos CRUD compartidos: `create-row-flow.ts`, `edit-row-flow.ts`,
  `delete-row-flow.ts`, `form-cascade-engine.ts`) — patrón explícito para compartir
  comportamiento **sin** anidar Shadow DOM (funciones/clases planas, no custom elements).
- `services/` — un cliente HTTP por entidad (`auth.service.ts`, `student.service.ts`,
  `rubric.service.ts`...) que llama a la API Express (`/api/*`) con `fetch`.
- `styles/` — `classes-for.ts` (mapeo `type × variant × size → clases Tailwind`,
  fuente única de verdad del sistema de diseño), `shadow-styles.ts`
  (`adoptedStyleSheets`), `tailwind.css` (entrada de Tailwind).
- `utils/` — utilidades transversales.
- `router.ts` — enrutador SPA propio, sin librería externa: mapea `path → render(outlet)`,
  escucha `popstate`, expone `navigate()`. El backend sirve el mismo `index.html` para
  cualquier ruta no-API (fallback SPA en `app.ts`).

## Comunicación con el backend

- `fetch` nativo contra la API Express (`/api/...`), cookies de sesión (`session_id`)
  enviadas automáticamente (`credentials` implícito same-origin).
- Eventos de dominio propios sobre el DOM: `new CustomEvent('app:verbo-sustantivo',
  { bubbles: true, composed: true, detail: {...} })` — `composed: true` es necesario para
  que el evento atraviese la frontera del Shadow DOM.

## Testing frontend (ver también `tecnologia_qa.md`)

- Unit tests de componentes con **`bun test`** (API compatible con Jest) +
  **`@happy-dom/global-registrator`** para simular DOM/Shadow DOM en el runtime de Bun
  sin navegador real.
- E2E con **Cypress** (`^15.18.1`), `includeShadowDom: true` en `cypress.config.ts` —
  imprescindible porque `cy.get()` no atraviesa shadow roots por defecto.
