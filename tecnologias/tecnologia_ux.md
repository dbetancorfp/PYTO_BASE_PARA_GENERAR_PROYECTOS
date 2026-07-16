# Tecnologías de UX / diseño

Fuente: `src/frontend/src/styles/`, `vistas/`, `lib/agents/view-designer/`.

## Sistema de diseño

- **Tailwind CSS 3.x** como único lenguaje de estilos — sin CSS-in-JS, sin librería de
  componentes UI de terceros (no Material, no Bootstrap, no shadcn). Paleta neutra
  profesional acordada con el usuario del proyecto concreto que se esté generando —
  extendida en `tailwind.config.js`.
- **Fuente única de verdad**: `classesFor(type, variant, size)`
  (`src/styles/classes-for.ts`) — tabla `type × variant × size → clases Tailwind`. Ningún
  componente contiene lógica `if variant === '...'` propia; todos llaman a esta función.
  Decisión tomada explícitamente para evitar duplicación de código (Sonar penaliza la
  duplicación, ver `tecnologia_qa.md`).
- Vocabulario de `variant` cerrado y reutilizado del propio schema de especificación UI
  (`props.variant: primary | secondary | danger | ghost | link` en
  `lib/schemas/ui-spec.schema.js`) — no se inventan valores nuevos por vista.
- Escala de tamaños (`size`): `sm` / `md` (por defecto) / `lg`, aplicada como
  padding + tamaño de texto.

## Entrega del CSS al Shadow DOM

- Como cada componente usa Shadow DOM abierto, un `<link>`/`<style>` global
  en `index.html` **no** llega a los shadow roots — las clases Tailwind no tendrían efecto
  visual sin un paso adicional.
- Solución: **`adoptedStyleSheets`** (API nativa de Shadow DOM) —
  `src/styles/shadow-styles.ts` construye un único `CSSStyleSheet` de forma perezosa
  (`fetch('/dist/tailwind.css')` + `replaceSync`), compartido por instancia entre todos
  los componentes, y lo adopta en cada shadow root vía `attachSharedStyles(shadowRoot)`.
  Evita duplicar/parsear el CSS por instancia.

## Descripción de vista → especificación UI (proceso, no herramienta)

- **No hay boceto visual** (HTML anotado, Figma, etc.) en este proyecto. La única fuente
  de verdad de "qué existe en una vista" es `vistas/<vista>/descripcion_vista_<vista>.md`
  — texto libre escrito por el usuario: qué quiere el "cliente" de esa vista, qué datos
  maneja, qué tablas de la base de datos están implicadas.
- El agente **`view-designer`** (`lib/agents/view-designer/view-designer.md`) diseña la UI
  a partir de esa descripción: decide componentes, estados e interacciones, y asigna a
  cada uno un `elementId` propio (no hay numeración externa que seguir, como sí la había
  con el antiguo `sketchNumber` del boceto). El resultado es `ui-spec.json` +
  `functional-spec.json` por vista.
- Nada aparece en fases posteriores (casos de uso, tests, código) sin haber sido
  diseñado primero por `view-designer` con su propio `elementId`.

## Patrones de interacción de UX reutilizables

- **Filtros reactivos**: cuando una vista lista datos filtrables, los filtros deben aplicar
  mientras el usuario escribe (regla explícita de `CLAUDE.md`) — implementado en
  `controllers/` vía funciones de cascada de consultas, no debounce de terceros.
- **Import masivo**: cuando una vista necesita alta masiva de datos, usa un componente
  `file-upload` con su propia variante Tailwind (`file:mr-3 file:rounded...`), integrado
  en el mismo sistema `classesFor`.
- **Accesibilidad de estado**: la variante `danger` se reutiliza de forma consistente en
  inputs, botones y párrafos para señalar error/validación fallida en todo el sistema, en
  vez de un color distinto por componente.
- **Matrices de selección** (ítem × nivel, celda × celda): cuando una vista requiera que el
  usuario seleccione un valor por celda de una matriz, cada celda es un estado
  independiente que debe poder validarse visualmente sin ambigüedad (usa `variant="danger"`
  para el estado de validación fallida, no un estilo ad-hoc).

## Herramientas de diseño

No hay herramienta de diseño externa (Figma, Sketch...) en el flujo: la descripción en
markdown de cada vista **es** el artefacto de entrada, editada directamente y versionada
en git — decisión consciente para que la especificación de cada vista sea texto simple,
legible y versionable sin herramientas externas.
