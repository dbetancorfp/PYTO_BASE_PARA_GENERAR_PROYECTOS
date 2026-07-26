import { describe, it, expect, beforeEach } from 'bun:test';
import { attachSharedStyles, __resetSharedStylesheetCacheForTests } from '../src/styles/shadow-styles';

describe('attachSharedStyles, when fetching the shared stylesheet fails', () => {
  beforeEach(() => {
    __resetSharedStylesheetCacheForTests();
  });

  it('leaves the shadow root unstyled, without throwing', async () => {
    globalThis.fetch = (async () => {
      throw new Error('network error');
    }) as typeof fetch;

    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });

    expect(() => attachSharedStyles(shadow)).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(shadow.adoptedStyleSheets.length).toBe(0);
  });

  it('leaves the shadow root unstyled when the response is not ok', async () => {
    globalThis.fetch = (async () => new Response(null, { status: 404 })) as typeof fetch;

    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });

    attachSharedStyles(shadow);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(shadow.adoptedStyleSheets.length).toBe(0);
  });
});
