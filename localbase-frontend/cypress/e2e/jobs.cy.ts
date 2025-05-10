describe('Jobs', () => {
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
          result: 'This is the result of Test Job 1',
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

    // Visit the jobs page
    cy.visit('/jobs');
  });

  it('displays the list of jobs', () => {
    // Wait for API call to complete
    cy.wait('@getJobs');

    // Check page title
    cy.contains('Jobs');

    // Check jobs are listed
    cy.contains('Test Job 1');
    cy.contains('Test Job 2');

    // Check status badges
    cy.contains('Completed');
    cy.contains('Pending');

    // Check create button
    cy.contains('Create New Job');
  });

  it('allows viewing job details', () => {
    // Wait for API call to complete
    cy.wait('@getJobs');

    // Mock the job details response
    cy.intercept('GET', '**/rest/v1/jobs?id=eq.job1*', {
      statusCode: 200,
      body: [
        {
          id: 'job1',
          name: 'Test Job 1',
          model: 'gpt-4',
          prompt: 'What is the meaning of life?',
          max_tokens: 1000,
          status: 'completed',
          created_at: new Date().toISOString(),
          result: 'This is the result of Test Job 1',
        },
      ],
    }).as('getJobDetails');

    // Click on the first job
    cy.contains('Test Job 1').click();

    // Wait for API call to complete
    cy.wait('@getJobDetails');

    // Check URL
    cy.url().should('include', '/jobs/job1');

    // Check job details
    cy.contains('Test Job 1');
    cy.contains('gpt-4');
    cy.contains('What is the meaning of life?');
    cy.contains('This is the result of Test Job 1');
  });

  it('allows creating a new job', () => {
    // Wait for API call to complete
    cy.wait('@getJobs');

    // Mock the job creation response
    cy.intercept('POST', '**/rest/v1/jobs', {
      statusCode: 201,
      body: {
        id: 'new-job',
        name: 'My New Job',
        model: 'gpt-4',
        prompt: 'Tell me a joke',
        max_tokens: 500,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    }).as('createJob');

    // Click create button
    cy.contains('Create New Job').click();

    // Check URL
    cy.url().should('include', '/jobs/new');

    // Fill in the form
    cy.get('input[name="name"]').type('My New Job');
    cy.get('select[name="model"]').select('gpt-4');
    cy.get('textarea[name="prompt"]').type('Tell me a joke');
    cy.get('input[name="max_tokens"]').clear().type('500');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Wait for API call to complete
    cy.wait('@createJob');

    // Check URL (should redirect to job details)
    cy.url().should('include', '/jobs/new-job');
  });

  it('allows canceling a pending job', () => {
    // Wait for API call to complete
    cy.wait('@getJobs');

    // Mock the job details response for a pending job
    cy.intercept('GET', '**/rest/v1/jobs?id=eq.job2*', {
      statusCode: 200,
      body: [
        {
          id: 'job2',
          name: 'Test Job 2',
          model: 'gpt-3.5-turbo',
          prompt: 'What is the weather like?',
          max_tokens: 500,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('getPendingJobDetails');

    // Mock the job cancellation response
    cy.intercept('PATCH', '**/rest/v1/jobs?id=eq.job2', {
      statusCode: 200,
      body: {
        id: 'job2',
        status: 'cancelled',
      },
    }).as('cancelJob');

    // Click on the pending job
    cy.contains('Test Job 2').click();

    // Wait for API call to complete
    cy.wait('@getPendingJobDetails');

    // Check URL
    cy.url().should('include', '/jobs/job2');

    // Click cancel button
    cy.contains('Cancel Job').click();

    // Confirm cancellation
    cy.contains('Are you sure you want to cancel this job?');
    cy.contains('button', 'Cancel Job').click();

    // Wait for API call to complete
    cy.wait('@cancelJob');

    // Check success message
    cy.contains('Job cancelled successfully');
  });

  it('displays empty state when no jobs', () => {
    // Mock empty response
    cy.intercept('GET', '**/rest/v1/jobs*', {
      statusCode: 200,
      body: [],
    }).as('getEmptyJobs');

    // Reload the page
    cy.reload();

    // Wait for API call to complete
    cy.wait('@getEmptyJobs');

    // Check empty state message
    cy.contains('No jobs found');
    cy.contains('Create your first job to get started');
  });

  it('displays error state when API call fails', () => {
    // Mock error response
    cy.intercept('GET', '**/rest/v1/jobs*', {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    }).as('getJobsError');

    // Reload the page
    cy.reload();

    // Wait for API call to complete
    cy.wait('@getJobsError');

    // Check error message
    cy.contains('Error loading jobs');
    cy.contains('Please try again later');
  });
});
