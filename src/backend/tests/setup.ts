process.env.DATA_BACKEND ??= 'memory';

// bunfig.toml's [test].preload runs for every `bun test` invocation, including
// `bun test src/backend/tests` — so src/frontend/tests/dom-setup.ts's happy-dom
// registration still applies here even though backend tests never touch the DOM. Happy-dom's
// registered `fetch` enforces a same-origin policy that breaks auth.routes.test.ts's real
// HTTP requests against a live Express server on a different port. Toggle happy-dom's own
// escape hatch for that (rather than unregistering it entirely), so a combined `bun test`
// run still has a working DOM for frontend tests.
type GlobalWithHappyDom = typeof globalThis & {
  happyDOM?: { settings: { fetch: { disableSameOriginPolicy: boolean } } };
};

const globalWithHappyDom = globalThis as GlobalWithHappyDom;
if (globalWithHappyDom.happyDOM) {
  globalWithHappyDom.happyDOM.settings.fetch.disableSameOriginPolicy = true;
}
