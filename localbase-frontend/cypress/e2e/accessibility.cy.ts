/// <reference types="cypress" />
/// <reference types="cypress-axe" />

describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.injectAxe();
  });

  it('Homepage should be accessible', () => {
    cy.visit('/');
    cy.checkA11y();
  });

  it('Sign In page should be accessible', () => {
    cy.visit('/signin');
    cy.checkA11y();
  });

  it('Sign Up page should be accessible', () => {
    cy.visit('/signup');
    cy.checkA11y();
  });

  it('Forgot Password page should be accessible', () => {
    cy.visit('/forgot-password');
    cy.checkA11y();
  });

  it('Dashboard should be accessible', () => {
    // Set up a fake auth session
    cy.window().then((window) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'fake-token',
        expires_at: Date.now() + 3600000,
      }));
    });

    // Mock API responses
    cy.intercept('GET', '**/rest/v1/jobs*', {
      statusCode: 200,
      body: [
        {
          id: 'job1',
          name: 'Test Job 1',
          model: 'gpt-4',
          status: 'completed',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('getJobs');

    cy.intercept('GET', '**/rest/v1/api_keys*', {
      statusCode: 200,
      body: [
        {
          id: 'key1',
          name: 'Test API Key 1',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('getApiKeys');

    cy.visit('/dashboard');
    cy.wait('@getJobs');
    cy.wait('@getApiKeys');
    cy.checkA11y();
  });

  it('Jobs page should be accessible', () => {
    // Set up a fake auth session
    cy.window().then((window) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'fake-token',
        expires_at: Date.now() + 3600000,
      }));
    });

    // Mock API responses
    cy.intercept('GET', '**/rest/v1/jobs*', {
      statusCode: 200,
      body: [
        {
          id: 'job1',
          name: 'Test Job 1',
          model: 'gpt-4',
          status: 'completed',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('getJobs');

    cy.visit('/jobs');
    cy.wait('@getJobs');
    cy.checkA11y();
  });

  it('API Keys page should be accessible', () => {
    // Set up a fake auth session
    cy.window().then((window) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'fake-token',
        expires_at: Date.now() + 3600000,
      }));
    });

    // Mock API responses
    cy.intercept('GET', '**/rest/v1/api_keys*', {
      statusCode: 200,
      body: [
        {
          id: 'key1',
          name: 'Test API Key 1',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('getApiKeys');

    cy.visit('/api-keys');
    cy.wait('@getApiKeys');
    cy.checkA11y();
  });

  it('Create Job page should be accessible', () => {
    // Set up a fake auth session
    cy.window().then((window) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'fake-token',
        expires_at: Date.now() + 3600000,
      }));
    });

    cy.visit('/jobs/new');
    cy.checkA11y();
  });

  it('Create API Key page should be accessible', () => {
    // Set up a fake auth session
    cy.window().then((window) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'fake-token',
        expires_at: Date.now() + 3600000,
      }));
    });

    cy.visit('/api-keys/new');
    cy.checkA11y();
  });

  it('Profile page should be accessible', () => {
    // Set up a fake auth session
    cy.window().then((window) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'fake-token',
        expires_at: Date.now() + 3600000,
      }));
    });

    // Mock API responses
    cy.intercept('GET', '**/rest/v1/profiles*', {
      statusCode: 200,
      body: [
        {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
        },
      ],
    }).as('getProfile');

    cy.visit('/profile');
    cy.wait('@getProfile');
    cy.checkA11y();
  });
});
