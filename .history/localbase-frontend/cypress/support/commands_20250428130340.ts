/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/signin');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// -- This is a child command --
Cypress.Commands.add('createApiKey', (name, permissions = ['read:models']) => {
  cy.visit('/api-keys/new');
  cy.get('input[name="name"]').type(name);
  
  // Check permissions
  permissions.forEach(permission => {
    const selector = permission === 'read:models' ? 'Read Models' :
                    permission === 'create:jobs' ? 'Create Jobs' :
                    permission === 'read:jobs' ? 'Read Jobs' : '';
    
    if (selector) {
      cy.contains(selector).parent().find('input[type="checkbox"]').check();
    }
  });
  
  cy.get('button[type="submit"]').click();
  cy.contains('API key created successfully');
});

// -- This is a child command --
Cypress.Commands.add('createJob', (name, model, prompt, maxTokens = 1000) => {
  cy.visit('/jobs/new');
  cy.get('input[name="name"]').type(name);
  cy.get('select[name="model"]').select(model);
  cy.get('textarea[name="prompt"]').type(prompt);
  cy.get('input[name="max_tokens"]').clear().type(maxTokens.toString());
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/jobs/');
});

// -- This is a child command --
Cypress.Commands.add('mockAuth', () => {
  cy.window().then((window) => {
    window.localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'fake-token',
      expires_at: Date.now() + 3600000,
    }));
  });
});

// -- This is a child command --
Cypress.Commands.add('logout', () => {
  cy.contains('Sign Out').click();
  cy.url().should('eq', Cypress.config().baseUrl + '/');
});

// -- This is a parent command --
Cypress.Commands.add('checkApiKeysList', () => {
  cy.visit('/api-keys');
  cy.contains('API Keys');
});

// -- This is a parent command --
Cypress.Commands.add('checkJobsList', () => {
  cy.visit('/jobs');
  cy.contains('Jobs');
});

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createApiKey(name: string, permissions?: string[]): Chainable<void>;
      createJob(name: string, model: string, prompt: string, maxTokens?: number): Chainable<void>;
      mockAuth(): Chainable<void>;
      logout(): Chainable<void>;
      checkApiKeysList(): Chainable<void>;
      checkJobsList(): Chainable<void>;
    }
  }
}
