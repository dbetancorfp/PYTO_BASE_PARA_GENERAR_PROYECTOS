// Delivers the Tailwind CSS compiled into src/frontend/dist/tailwind.css to every open
// Shadow DOM in the app (a global <link>/<style> in index.html never reaches a shadow
// root). See tecnologias/tecnologia_ux.md, "Delivering CSS to the Shadow DOM".
//
// The stylesheet is fetched and parsed once (module-level memoized promise) and shared
// across every component instance via `adoptedStyleSheets`, instead of re-parsing the CSS
// per component. Re-introduced once a real build/serve pipeline existed to make it
// reachable (`bun run build` + Express static serving of src/frontend/dist/) — see
// views/login/review-report.md's cycle 2 for why it was a documented no-op before that.

let sharedStyleSheetPromise: Promise<CSSStyleSheet | null> | null = null;

// Exported (in addition to `attachSharedStyles`) so tests can exercise every branch
// directly, without the module-level memoization `attachSharedStyles` wraps it in.
export async function loadSharedStyleSheet(): Promise<CSSStyleSheet | null> {
  if (typeof CSSStyleSheet === 'undefined' || typeof fetch === 'undefined') {
    // Non-browser environment (or a test runner without a served /dist) — no styles to
    // adopt; components still render correctly, just unstyled.
    return null;
  }
  try {
    const response = await fetch('/dist/tailwind.css');
    if (!response.ok) return null;
    const cssText = await response.text();
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    return sheet;
  } catch {
    // Fetch can throw outright (e.g. relative URLs against `about:blank` in unit tests, or
    // no server running yet) — treated the same as "no styles available".
    return null;
  }
}

/**
 * Adopts the shared Tailwind stylesheet into `shadowRoot`, once it's loaded. Fire-and-forget
 * by design: components must render correctly before the stylesheet resolves, and must not
 * block or fail their own render waiting for it.
 */
export function attachSharedStyles(shadowRoot: ShadowRoot): void {
  sharedStyleSheetPromise ??= loadSharedStyleSheet();
  void sharedStyleSheetPromise.then((sheet) => {
    if (sheet && !shadowRoot.adoptedStyleSheets.includes(sheet)) {
      shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
    }
  });
}
