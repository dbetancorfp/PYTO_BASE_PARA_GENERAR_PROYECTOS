import { describe, it, expect, beforeEach } from 'bun:test';
import { attachSharedStyles, __resetSharedStylesheetCacheForTests } from '../src/styles/shadow-styles';

describe('attachSharedStyles', () => {
  beforeEach(() => {
    __resetSharedStylesheetCacheForTests();
  });

  it('fetches /dist/tailwind.css once and adopts it into every shadow root', async () => {
    let fetchCalls = 0;
    globalThis.fetch = (async () => {
      fetchCalls += 1;
      return new Response('.a{color:red}', { status: 200 });
    }) as typeof fetch;

    const hostA = document.createElement('div');
    const shadowA = hostA.attachShadow({ mode: 'open' });
    const hostB = document.createElement('div');
    const shadowB = hostB.attachShadow({ mode: 'open' });

    attachSharedStyles(shadowA);
    attachSharedStyles(shadowB);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchCalls).toBe(1);
    expect(shadowA.adoptedStyleSheets.length).toBe(1);
    expect(shadowB.adoptedStyleSheets.length).toBe(1);
    expect(shadowA.adoptedStyleSheets[0]).toBe(shadowB.adoptedStyleSheets[0]);
  });
});
