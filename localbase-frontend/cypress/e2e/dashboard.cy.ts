describe('Dashboard', () => {
  beforeEach(() => {
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
        {
          id: 'job2',
          name: 'Test Job 2',
          model: 'gpt-3.5-turbo',
          status: 'pending',
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
        {
          id: 'key2',
          name: 'Test API Key 2',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('getApiKeys');

    // Visit the dashboard
    cy.visit('/dashboard');
  });

  it('displays the dashboard with user information', () => {
    // Wait for API calls to complete
    cy.wait('@getJobs');
    cy.wait('@getApiKeys');

    // Check welcome message
    cy.contains('Welcome to your dashboard');

    // Check recent jobs section
    cy.contains('Recent Jobs');
    cy.contains('Test Job 1');
    cy.contains('Test Job 2');

    // Check API keys section
    cy.contains('API Keys');
    cy.contains('Test API Key 1');
    cy.contains('Test API Key 2');

    // Check action buttons
    cy.contains('Create New Job');
    cy.contains('Create API Key');
  });

  it('navigates to job details when clicking on a job', () => {
    // Wait for API calls to complete
    cy.wait('@getJobs');
    cy.wait('@getApiKeys');

    // Click on a job
    cy.contains('Test Job 1').click();

    // Check URL
    cy.url().should('include', '/jobs/job1');
  });

  it('navigates to create job page when clicking Create New Job', () => {
    // Wait for API calls to complete
    cy.wait('@getJobs');
    cy.wait('@getApiKeys');

    // Click on Create New Job button
    cy.contains('Create New Job').click();

    // Check URL
    cy.url().should('include', '/jobs/new');
  });

  it('navigates to create API key page when clicking Create API Key', () => {
    // Wait for API calls to complete
    cy.wait('@getJobs');
    cy.wait('@getApiKeys');

    // Click on Create API Key button
    cy.contains('Create API Key').click();

    // Check URL
    cy.url().should('include', '/api-keys/new');
  });

  it('displays empty state when no jobs or API keys', () => {
    // Mock empty responses
    cy.intercept('GET', '**/rest/v1/jobs*', {
      statusCode: 200,
      body: [],
    }).as('getEmptyJobs');

    cy.intercept('GET', '**/rest/v1/api_keys*', {
      statusCode: 200,
      body: [],
    }).as('getEmptyApiKeys');

    // Reload the page
    cy.reload();

    // Wait for API calls to complete
    cy.wait('@getEmptyJobs');
    cy.wait('@getEmptyApiKeys');

    // Check empty state messages
    cy.contains('No jobs found');
    cy.contains('No API keys found');
  });

  it('displays error state when API calls fail', () => {
    // Mock error responses
    cy.intercept('GET', '**/rest/v1/jobs*', {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    }).as('getJobsError');

    cy.intercept('GET', '**/rest/v1/api_keys*', {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    }).as('getApiKeysError');

    // Reload the page
    cy.reload();

    // Wait for API calls to complete
    cy.wait('@getJobsError');
    cy.wait('@getApiKeysError');

    // Check error messages
    cy.contains('Error loading jobs');
    cy.contains('Error loading API keys');
  });
});
