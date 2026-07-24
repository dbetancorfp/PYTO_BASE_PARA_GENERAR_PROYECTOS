/// <reference types="cypress" />
// UC-02: Client-side field validation

describe('UC-02: Client-side field validation', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('shows inline validation on both fields and sends no request when submitted empty', () => {
    cy.intercept('POST', '/api/auth/login').as('loginRequest');

    cy.get('[data-element-id="login-button"]').click();

    cy.get('[data-element-id="email-input"]').should('have.attr', 'aria-invalid', 'true');
    cy.get('[data-element-id="password-input"]').should('have.attr', 'aria-invalid', 'true');
    cy.get('@loginRequest.all').should('have.length', 0);
  });

  it('clears the email field\'s invalid state as soon as a valid email is typed, without a new submit', () => {
    cy.get('[data-element-id="password-input"]').type('something');
    cy.get('[data-element-id="login-button"]').click();
    cy.get('[data-element-id="email-input"]').should('have.attr', 'aria-invalid', 'true');

    cy.get('[data-element-id="email-input"]').type('now-valid@example.com');
    cy.get('[data-element-id="email-input"]').should('have.attr', 'aria-invalid', 'false');
  });
});
