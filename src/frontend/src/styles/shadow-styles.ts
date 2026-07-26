// Delivers the Tailwind CSS compiled into `src/frontend/dist/tailwind.css` to every
// component's open Shadow DOM via `adoptedStyleSheets` — a global <link>/<style> in
// index.html never reaches a shadow root. See tecnologias/tecnologia_ux.md.
//
// Fetched once, lazily, and shared across every component instance via this module-level
// promise — components never duplicate the parse. If the fetch fails (asset missing,
// network error), components still render and behave correctly, just unstyled, exactly
// like any other missing-asset case.
let sharedStylesheetPromise: Promise<CSSStyleSheet | null> | null = null;

function loadSharedStylesheet(): Promise<CSSStyleSheet | null> {
  if (!sharedStylesheetPromise) {
    sharedStylesheetPromise = fetch('/dist/tailwind.css')
      .then((response) => (response.ok ? response.text() : null))
      .then((cssText) => {
        if (!cssText) return null;
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(cssText);
        return sheet;
      })
      .catch(() => null);
  }
  return sharedStylesheetPromise;
}

/**
 * Adopts the shared Tailwind stylesheet into `shadowRoot`. Safe to call from every
 * component's `connectedCallback`, before the first `_render()` — the sheet is adopted
 * asynchronously, once fetched, without requiring the caller to await anything.
 */
export function attachSharedStyles(shadowRoot: ShadowRoot): void {
  void loadSharedStylesheet().then((sheet) => {
    if (sheet) {
      shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
    }
  });
}

// Test-only: Bun shares one module registry across every test file in a run, so the
// module-level cache above would otherwise leak between files that each stub `fetch`
// differently. Not called from any production code path.
export function __resetSharedStylesheetCacheForTests(): void {
  sharedStylesheetPromise = null;
}
