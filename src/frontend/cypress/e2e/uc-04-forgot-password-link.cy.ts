/// <reference types="cypress" />
// UC-04: Forgot password link (out of scope placeholder)

describe('UC-04: Forgot password link (out of scope placeholder)', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('is present and visible below the login button', () => {
    cy.get('[data-element-id="login-button"]').should('be.visible');
    cy.get('[data-element-id="forgot-password-link"]').should('be.visible');
  });

  it('does nothing and does not navigate away when clicked', () => {
    cy.intercept('POST', '/api/auth/login').as('loginRequest');

    cy.get('[data-element-id="forgot-password-link"]').click();

    cy.url().should('include', '/login');
    cy.get('@loginRequest.all').should('have.length', 0);
  });
});
