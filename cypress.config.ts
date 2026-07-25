import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3050',
    specPattern: 'src/frontend/cypress/e2e/**/*.cy.ts',
    includeShadowDom: true,
    supportFile: false,
  },
});
