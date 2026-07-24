/// <reference types="cypress" />
// UC-03: Toggle password visibility

describe('UC-03: Toggle password visibility', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('reveals the password as plain text after clicking the toggle once', () => {
    cy.get('[data-element-id="password-input"]').should('have.attr', 'type', 'password');

    cy.get('[data-element-id="password-toggle-button"]').click();

    cy.get('[data-element-id="password-input"]').should('have.attr', 'type', 'text');
    cy.get('[data-element-id="password-toggle-button"]').should(
      'have.attr',
      'aria-label',
      'Hide password',
    );
  });

  it('masks the password again after a second click on the toggle', () => {
    cy.get('[data-element-id="password-toggle-button"]').click();
    cy.get('[data-element-id="password-toggle-button"]').click();

    cy.get('[data-element-id="password-input"]').should('have.attr', 'type', 'password');
    cy.get('[data-element-id="password-toggle-button"]').should(
      'have.attr',
      'aria-label',
      'Show password',
    );
  });
});
