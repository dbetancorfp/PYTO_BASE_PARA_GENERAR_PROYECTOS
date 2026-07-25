// Delivers the Tailwind CSS compiled into `src/frontend/dist/tailwind.css` to every
// component's open Shadow DOM via `adoptedStyleSheets` — a global <link>/<style> in
// index.html never reaches a shadow root. See tecnologias/tecnologia_ux.md.
//
// No build/serve pipeline exists yet at this point of the view pipeline: there's no
// `bun run build` script, no Tailwind config, and nothing served at `/dist/tailwind.css`
// (that's `e2e-engineer`'s job, later — see views/login/review-report.md). Fetching,
// parsing and adopting that stylesheet is therefore not implemented yet, rather than
// implemented but untested: `attachSharedStyles` is an explicit no-op until that pipeline
// exists. Components still render and behave correctly, they just render unstyled in the
// meantime, exactly like any other missing-asset case. Every component still calls
// `attachSharedStyles` from `connectedCallback` (see CLAUDE.md's "Visual style" rule), so
// no call site needs to change once the real fetch-and-adopt mechanism is reintroduced.

/**
 * Adopts the shared Tailwind stylesheet into `shadowRoot`, once a real build/serve
 * pipeline exists to fetch it from. Safe to call from every component's
 * `connectedCallback`, before the first `_render()`.
 */
export function attachSharedStyles(_shadowRoot: ShadowRoot): void {
  // No-op for now — see the module comment above.
}
