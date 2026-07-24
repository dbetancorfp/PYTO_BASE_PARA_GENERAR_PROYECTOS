// elementId: login-heading (shared infrastructure every component's connectedCallback
// calls — no single elementId owns it; tagged here since it's exercised on first render)
import { describe, it, expect, afterEach } from 'bun:test';
import { loadSharedStyleSheet } from '../src/styles/shadow-styles';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('elementId: login-heading (loadSharedStyleSheet)', () => {
  it('returns a populated CSSStyleSheet when the fetch succeeds', async () => {
    globalThis.fetch = (async () =>
      new Response('.text-sm{font-size:.875rem}', { status: 200 })) as typeof fetch;

    const sheet = await loadSharedStyleSheet();

    expect(sheet).toBeInstanceOf(CSSStyleSheet);
    expect(sheet?.cssRules.length).toBeGreaterThan(0);
  });

  it('returns null when the response is not ok', async () => {
    globalThis.fetch = (async () => new Response('', { status: 404 })) as typeof fetch;

    const sheet = await loadSharedStyleSheet();

    expect(sheet).toBeNull();
  });

  it('returns null when fetch throws (no server / network error)', async () => {
    globalThis.fetch = (async () => {
      throw new Error('network error');
    }) as typeof fetch;

    const sheet = await loadSharedStyleSheet();

    expect(sheet).toBeNull();
  });

  it('returns null in a non-browser environment (no CSSStyleSheet global)', async () => {
    const original = globalThis.CSSStyleSheet;
    // @ts-expect-error — deliberately simulating an environment without CSSStyleSheet
    delete globalThis.CSSStyleSheet;
    try {
      const sheet = await loadSharedStyleSheet();
      expect(sheet).toBeNull();
    } finally {
      globalThis.CSSStyleSheet = original;
    }
  });
});
