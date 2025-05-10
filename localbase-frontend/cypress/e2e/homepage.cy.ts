describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays the hero section', () => {
    cy.get('h1').contains('Decentralized AI Compute Marketplace');
    cy.get('a').contains('Get Started');
    cy.get('a').contains('Learn More');
  });

  it('displays the features section', () => {
    cy.contains('Why Choose LocalBase?');
    cy.contains('High Performance');
    cy.contains('Decentralized Security');
    cy.contains('Cost Effective');
  });

  it('navigates to sign up page when clicking Get Started', () => {
    cy.get('a').contains('Get Started').click();
    cy.url().should('include', '/signup');
  });

  it('displays the code example section', () => {
    cy.contains('LocalBase AI Inference');
    cy.get('pre').should('be.visible');
  });

  it('displays the footer', () => {
    cy.get('footer').should('be.visible');
    cy.get('footer').contains('LocalBase');
  });
});
