/// <reference types="cypress" />
// UC-01: Sign in with valid credentials
//
// Requires a deterministic seeded account (see tecnologias/tecnologia_bbdd.md, "bun run
// db:seed:e2e") — email `e2e-login@example.com`, password `E2e-Test-Password-1`, freshly
// seeded (failed_login_attempts = 0, account_locked = false) before this suite runs.

describe('UC-01: Sign in with valid credentials', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('redirects to /dashboard after signing in with correct credentials', () => {
    cy.get('[data-element-id="email-input"]').type('e2e-login@example.com');
    cy.get('[data-element-id="password-input"]').type('E2e-Test-Password-1');
    cy.get('[data-element-id="login-button"]').click();

    cy.url().should('include', '/dashboard');
  });

  it('shows "Incorrect email or password" after submitting the wrong password, without redirecting', () => {
    cy.get('[data-element-id="email-input"]').type('e2e-login@example.com');
    cy.get('[data-element-id="password-input"]').type('definitely-the-wrong-password');
    cy.get('[data-element-id="login-button"]').click();

    cy.get('[data-element-id="login-error-message"]').should(
      'have.text',
      'Incorrect email or password',
    );
    cy.url().should('include', '/login');
  });
});
