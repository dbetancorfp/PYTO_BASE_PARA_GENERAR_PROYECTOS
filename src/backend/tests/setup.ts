process.env.DATA_BACKEND ??= 'memory';

// dom-setup.ts (preloaded before this file, see bunfig.toml) registers happy-dom globally
// for frontend tests, which replaces the global `fetch` with happy-dom's own — same-origin
// policy included. Backend route tests (auth.routes.test.ts) make real HTTP requests to a
// local server on a random port, which happy-dom's fetch treats as cross-origin and blocks.
// Disabling that policy only affects fetch's CORS enforcement in this test process, not
// anything backend routes/services do at runtime.
interface HappyDomGlobal {
  settings: { fetch: { disableSameOriginPolicy: boolean } };
}

const happyDom = (globalThis as { happyDOM?: HappyDomGlobal }).happyDOM;
if (happyDom) {
  happyDom.settings.fetch.disableSameOriginPolicy = true;
}
