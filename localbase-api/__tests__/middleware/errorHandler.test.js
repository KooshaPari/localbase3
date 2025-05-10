const errorHandler = require('../../src/middleware/errorHandler');
const { 
  AuthenticationError, 
  AuthorizationError, 
  ResourceNotFoundError, 
  ValidationError, 
  RateLimitError 
} = require('../../src/utils/errors');

describe('Error Handler Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });
  
  it('should handle AuthenticationError', () => {
    const error = new AuthenticationError('Invalid API key', 'invalid_api_key');
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Invalid API key',
        type: 'authentication_error',
        code: 'invalid_api_key',
      },
    });
  });
  
  it('should handle AuthorizationError', () => {
    const error = new AuthorizationError('Permission denied', 'permission_denied');
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Permission denied',
        type: 'authorization_error',
        code: 'permission_denied',
      },
    });
  });
  
  it('should handle ResourceNotFoundError', () => {
    const error = new ResourceNotFoundError('Model', 'gpt-5', 'model_not_found');
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Model gpt-5 not found',
        type: 'invalid_request_error',
        code: 'model_not_found',
      },
    });
  });
  
  it('should handle ValidationError', () => {
    const error = new ValidationError('Invalid request parameters', 'invalid_parameters', {
      model: 'Model is required',
      prompt: 'Prompt is required',
    });
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Invalid request parameters',
        type: 'invalid_request_error',
        code: 'invalid_parameters',
        param: null,
        details: {
          model: 'Model is required',
          prompt: 'Prompt is required',
        },
      },
    });
  });
  
  it('should handle RateLimitError', () => {
    const error = new RateLimitError('Too many requests', 'rate_limit_exceeded');
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Too many requests',
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded',
      },
    });
  });
  
  it('should handle generic Error with status code', () => {
    const error = new Error('Something went wrong');
    error.statusCode = 500;
    error.code = 'internal_error';
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Something went wrong',
        type: 'api_error',
        code: 'internal_error',
      },
    });
  });
  
  it('should handle unknown errors as 500 Internal Server Error', () => {
    const error = new Error('Unexpected error');
    
    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'An unexpected error occurred',
        type: 'api_error',
        code: 'internal_error',
      },
    });
  });
  
  it('should log the error in non-production environment', () => {
    // Save original console.error
    const originalConsoleError = console.error;
    
    // Mock console.error
    console.error = jest.fn();
    
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Set NODE_ENV to development
    process.env.NODE_ENV = 'development';
    
    // Create error
    const error = new Error('Test error');
    
    // Call error handler
    errorHandler(error, req, res, next);
    
    // Verify console.error was called
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error and NODE_ENV
    console.error = originalConsoleError;
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  it('should not log the error in production environment', () => {
    // Save original console.error
    const originalConsoleError = console.error;
    
    // Mock console.error
    console.error = jest.fn();
    
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Set NODE_ENV to production
    process.env.NODE_ENV = 'production';
    
    // Create error
    const error = new Error('Test error');
    
    // Call error handler
    errorHandler(error, req, res, next);
    
    // Verify console.error was not called
    expect(console.error).not.toHaveBeenCalled();
    
    // Restore console.error and NODE_ENV
    console.error = originalConsoleError;
    process.env.NODE_ENV = originalNodeEnv;
  });
});
