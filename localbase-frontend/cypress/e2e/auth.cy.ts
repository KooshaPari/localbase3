describe('Authentication', () => {
  beforeEach(() => {
    // Clear cookies and local storage between tests
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('allows users to sign up', () => {
    // Visit the sign up page
    cy.visit('/signup');

    // Check that the sign up form is displayed
    cy.contains('Create an Account');

    // Fill in the form
    cy.get('input[name="fullName"]').type('Test User');
    cy.get('input[name="email"]').type(`test-${Date.now()}@example.com`);
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');

    // Intercept the sign up request
    cy.intercept('POST', '**/auth/v1/signup').as('signUp');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Wait for the sign up request
    cy.wait('@signUp').then((interception) => {
      // Check that the request was successful
      expect(interception.response.statusCode).to.be.oneOf([200, 201]);
    });

    // Check for success message or redirect
    cy.url().should('include', '/dashboard');
  });

  it('allows users to sign in', () => {
    // Visit the sign in page
    cy.visit('/signin');

    // Check that the sign in form is displayed
    cy.contains('Sign In');

    // Fill in the form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');

    // Intercept the sign in request
    cy.intercept('POST', '**/auth/v1/token*').as('signIn');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Wait for the sign in request
    cy.wait('@signIn').then((interception) => {
      // Check that the request was successful
      expect(interception.response.statusCode).to.be.oneOf([200, 201]);
    });

    // Check for redirect to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('allows users to reset their password', () => {
    // Visit the forgot password page
    cy.visit('/forgot-password');

    // Check that the forgot password form is displayed
    cy.contains('Reset Your Password');

    // Fill in the form
    cy.get('input[name="email"]').type('test@example.com');

    // Intercept the reset password request
    cy.intercept('POST', '**/auth/v1/recover').as('resetPassword');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Wait for the reset password request
    cy.wait('@resetPassword').then((interception) => {
      // Check that the request was successful
      expect(interception.response.statusCode).to.be.oneOf([200, 201]);
    });

    // Check for success message
    cy.contains('Check your email');
  });

  it('shows an error message for invalid credentials', () => {
    // Visit the sign in page
    cy.visit('/signin');

    // Fill in the form with invalid credentials
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');

    // Intercept the sign in request
    cy.intercept('POST', '**/auth/v1/token*').as('signIn');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Wait for the sign in request
    cy.wait('@signIn');

    // Check for error message
    cy.contains('Invalid email or password');
  });

  it('allows users to sign out', () => {
    // Mock a successful sign in
    cy.visit('/');
    
    // Set up a fake auth session
    cy.window().then((window) => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'fake-token',
        expires_at: Date.now() + 3600000,
      }));
    });

    // Visit the dashboard
    cy.visit('/dashboard');

    // Intercept the sign out request
    cy.intercept('POST', '**/auth/v1/logout').as('signOut');

    // Click the sign out button
    cy.contains('Sign Out').click();

    // Wait for the sign out request
    cy.wait('@signOut');

    // Check for redirect to home page
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
