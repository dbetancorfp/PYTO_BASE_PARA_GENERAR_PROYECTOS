/// <reference types="cypress" />
// UC-02: Client-side field validation

describe('UC-02: Client-side field validation', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/auth/login').as('login');
    cy.visit('/login');
  });

  it('shows inline validation messages and sends no request when both fields are empty', () => {
    cy.get('[data-element-id="login-button"]').click();

    cy.get('[data-element-id="email-input"]')
      .parent()
      .should('contain.text', 'Email is required');
    cy.get('[data-element-id="password-input"]')
      .closest('div')
      .parent()
      .should('contain.text', 'Password is required');
    cy.get('@login.all').should('have.length', 0);
  });

  it("clears email-input's validation message as soon as the value becomes a valid email, without another submit", () => {
    cy.get('[data-element-id="login-button"]').click();
    cy.get('[data-element-id="email-input"]')
      .parent()
      .should('contain.text', 'Email is required');

    cy.get('[data-element-id="email-input"]').type('valid@example.com');
    cy.get('[data-element-id="email-input"]')
      .parent()
      .should('not.contain.text', 'Email is required');
    cy.get('@login.all').should('have.length', 0);
  });
});
