const { authenticate, authorize } = require('../../src/middleware/auth');
const { AuthenticationError } = require('../../src/utils/errors');

describe('Authentication Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      headers: {},
      get: jest.fn(header => req.headers[header.toLowerCase()]),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });
  
  describe('authenticate', () => {
    it('should call next() when valid API key is provided', () => {
      // Mock the validateApiKey function
      const validateApiKey = jest.fn().mockResolvedValue({
        id: 'key123',
        user_id: 'user123',
        permissions: ['read:models'],
      });
      
      // Create middleware with mocked function
      const middleware = authenticate(validateApiKey);
      
      // Set up request with API key
      req.headers.authorization = 'Bearer valid-api-key';
      
      // Call middleware
      middleware(req, res, next);
      
      // Verify validateApiKey was called with correct key
      expect(validateApiKey).toHaveBeenCalledWith('valid-api-key');
      
      // Wait for the async function to complete
      return new Promise(resolve => {
        setImmediate(() => {
          // Verify next was called
          expect(next).toHaveBeenCalled();
          // Verify user was set on request
          expect(req.user).toBeDefined();
          expect(req.user.id).toBe('user123');
          expect(req.user.permissions).toEqual(['read:models']);
          resolve();
        });
      });
    });
    
    it('should return 401 when no API key is provided', () => {
      // Mock the validateApiKey function
      const validateApiKey = jest.fn();
      
      // Create middleware with mocked function
      const middleware = authenticate(validateApiKey);
      
      // Call middleware with no API key
      middleware(req, res, next);
      
      // Wait for the async function to complete
      return new Promise(resolve => {
        setImmediate(() => {
          // Verify validateApiKey was not called
          expect(validateApiKey).not.toHaveBeenCalled();
          
          // Verify next was called with error
          expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
          
          // Verify error has correct properties
          const error = next.mock.calls[0][0];
          expect(error.message).toBe('No API key provided');
          expect(error.statusCode).toBe(401);
          expect(error.code).toBe('missing_api_key');
          
          resolve();
        });
      });
    });
    
    it('should return 401 when invalid API key format is provided', () => {
      // Mock the validateApiKey function
      const validateApiKey = jest.fn();
      
      // Create middleware with mocked function
      const middleware = authenticate(validateApiKey);
      
      // Set up request with invalid API key format
      req.headers.authorization = 'InvalidFormat';
      
      // Call middleware
      middleware(req, res, next);
      
      // Wait for the async function to complete
      return new Promise(resolve => {
        setImmediate(() => {
          // Verify validateApiKey was not called
          expect(validateApiKey).not.toHaveBeenCalled();
          
          // Verify next was called with error
          expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
          
          // Verify error has correct properties
          const error = next.mock.calls[0][0];
          expect(error.message).toBe('Invalid API key format');
          expect(error.statusCode).toBe(401);
          expect(error.code).toBe('invalid_api_key_format');
          
          resolve();
        });
      });
    });
    
    it('should return 401 when API key validation fails', () => {
      // Mock the validateApiKey function to return null (invalid key)
      const validateApiKey = jest.fn().mockResolvedValue(null);
      
      // Create middleware with mocked function
      const middleware = authenticate(validateApiKey);
      
      // Set up request with API key
      req.headers.authorization = 'Bearer invalid-api-key';
      
      // Call middleware
      middleware(req, res, next);
      
      // Wait for the async function to complete
      return new Promise(resolve => {
        setImmediate(() => {
          // Verify validateApiKey was called
          expect(validateApiKey).toHaveBeenCalledWith('invalid-api-key');
          
          // Verify next was called with error
          expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
          
          // Verify error has correct properties
          const error = next.mock.calls[0][0];
          expect(error.message).toBe('Invalid API key');
          expect(error.statusCode).toBe(401);
          expect(error.code).toBe('invalid_api_key');
          
          resolve();
        });
      });
    });
  });
  
  describe('authorize', () => {
    it('should call next() when user has required permission', () => {
      // Set up request with user having required permission
      req.user = {
        id: 'user123',
        permissions: ['read:models', 'create:jobs'],
      };
      
      // Create middleware requiring 'read:models' permission
      const middleware = authorize('read:models');
      
      // Call middleware
      middleware(req, res, next);
      
      // Verify next was called without error
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should return 403 when user lacks required permission', () => {
      // Set up request with user lacking required permission
      req.user = {
        id: 'user123',
        permissions: ['read:models'],
      };
      
      // Create middleware requiring 'create:jobs' permission
      const middleware = authorize('create:jobs');
      
      // Call middleware
      middleware(req, res, next);
      
      // Verify next was called with error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      
      // Verify error has correct properties
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Permission denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('permission_denied');
    });
    
    it('should support requiring multiple permissions (AND logic)', () => {
      // Set up request with user having some but not all required permissions
      req.user = {
        id: 'user123',
        permissions: ['read:models', 'read:jobs'],
      };
      
      // Create middleware requiring multiple permissions
      const middleware = authorize(['read:models', 'create:jobs']);
      
      // Call middleware
      middleware(req, res, next);
      
      // Verify next was called with error
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      
      // Update user to have all required permissions
      req.user.permissions.push('create:jobs');
      
      // Reset next mock
      next.mockReset();
      
      // Call middleware again
      middleware(req, res, next);
      
      // Verify next was called without error
      expect(next).toHaveBeenCalledWith();
    });
  });
});
