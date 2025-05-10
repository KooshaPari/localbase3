describe('API Keys', () => {
  beforeEach(() => {
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
        {
          id: 'key2',
          name: 'Test API Key 2',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('getApiKeys');

    // Visit the API keys page
    cy.visit('/api-keys');
  });

  it('displays the list of API keys', () => {
    // Wait for API call to complete
    cy.wait('@getApiKeys');

    // Check page title
    cy.contains('API Keys');

    // Check API keys are listed
    cy.contains('Test API Key 1');
    cy.contains('Test API Key 2');

    // Check create button
    cy.contains('Create New API Key');
  });

  it('allows creating a new API key', () => {
    // Wait for API call to complete
    cy.wait('@getApiKeys');

    // Mock the API key creation response
    cy.intercept('POST', '**/rest/v1/api_keys', {
      statusCode: 201,
      body: {
        id: 'new-key',
        name: 'My New API Key',
        key: 'lb_1234567890abcdef',
        created_at: new Date().toISOString(),
      },
    }).as('createApiKey');

    // Click create button
    cy.contains('Create New API Key').click();

    // Check URL
    cy.url().should('include', '/api-keys/new');

    // Fill in the form
    cy.get('input[name="name"]').type('My New API Key');
    cy.get('input[type="checkbox"]').first().check();

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Wait for API call to complete
    cy.wait('@createApiKey');

    // Check success message
    cy.contains('API key created successfully');

    // Check the API key is displayed
    cy.contains('lb_1234567890abcdef');

    // Copy to clipboard
    cy.contains('Copy to Clipboard').click();

    // Check copied message
    cy.contains('Copied!');

    // Click done
    cy.contains('Done').click();

    // Check URL
    cy.url().should('include', '/api-keys');
  });

  it('allows deleting an API key', () => {
    // Wait for API call to complete
    cy.wait('@getApiKeys');

    // Mock the API key deletion response
    cy.intercept('DELETE', '**/rest/v1/api_keys*', {
      statusCode: 200,
      body: {},
    }).as('deleteApiKey');

    // Click delete button for the first API key
    cy.get('button[aria-label="Delete API Key"]').first().click();

    // Confirm deletion
    cy.contains('Are you sure you want to delete this API key?');
    cy.contains('button', 'Delete').click();

    // Wait for API call to complete
    cy.wait('@deleteApiKey');

    // Check success message
    cy.contains('API key deleted successfully');
  });

  it('displays empty state when no API keys', () => {
    // Mock empty response
    cy.intercept('GET', '**/rest/v1/api_keys*', {
      statusCode: 200,
      body: [],
    }).as('getEmptyApiKeys');

    // Reload the page
    cy.reload();

    // Wait for API call to complete
    cy.wait('@getEmptyApiKeys');

    // Check empty state message
    cy.contains('No API keys found');
    cy.contains('Create your first API key to get started');
  });

  it('displays error state when API call fails', () => {
    // Mock error response
    cy.intercept('GET', '**/rest/v1/api_keys*', {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    }).as('getApiKeysError');

    // Reload the page
    cy.reload();

    // Wait for API call to complete
    cy.wait('@getApiKeysError');

    // Check error message
    cy.contains('Error loading API keys');
    cy.contains('Please try again later');
  });
});
