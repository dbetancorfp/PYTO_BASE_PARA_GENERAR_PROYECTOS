/// <reference types="cypress" />
// UC-04: Forgot password link (out of scope placeholder)

describe('UC-04: Forgot password link (out of scope placeholder)', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('is present and visible below login-button on first load', () => {
    cy.get('[data-element-id="login-button"]').then(($loginButton) => {
      cy.get('[data-element-id="forgot-password-link"]')
        .should('be.visible')
        .then(($link) => {
          expect($link[0].compareDocumentPosition($loginButton[0])).to.eq(
            Node.DOCUMENT_POSITION_PRECEDING,
          );
        });
    });
  });

  it('does not navigate and sends no request when clicked', () => {
    cy.intercept('POST', '/api/auth/login').as('login');
    cy.get('[data-element-id="forgot-password-link"]').click();

    cy.url().should('include', '/login');
    cy.get('@login.all').should('have.length', 0);
  });
});
