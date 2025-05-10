/**
 * LocalBase API Gateway
 * Authentication middleware
 */

const AuthenticationService = require('../services/auth');
const logger = require('../utils/logger');

// Create authentication service instance
// In production, inject dependencies
const authService = new AuthenticationService();

/**
 * Authenticate requests using API key
 */
function authenticate(req, res, next) {
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Missing or invalid Authorization header',
          type: 'authentication_error',
          code: 'invalid_auth_header'
        }
      });
    }
    
    const apiKey = authHeader.split(' ')[1];
    
    // Validate API key
    authService.validateApiKey(apiKey)
      .then(user => {
        // Attach user to request
        req.user = user;
        
        // Check rate limit
        return authService.checkRateLimit(user.id, req.path);
      })
      .then(rateLimitInfo => {
        // Set rate limit headers
        res.set('X-RateLimit-Limit', rateLimitInfo.limit);
        res.set('X-RateLimit-Remaining', rateLimitInfo.remaining);
        res.set('X-RateLimit-Reset', rateLimitInfo.reset);
        
        next();
      })
      .catch(error => {
        logger.error('Authentication error:', error);
        
        if (error.type === 'rate_limit_error') {
          return res.status(429).json({
            error: {
              message: error.message,
              type: error.type,
              code: error.code
            }
          });
        }
        
        res.status(401).json({
          error: {
            message: error.message,
            type: 'authentication_error',
            code: error.code || 'authentication_failed'
          }
        });
      });
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    next(error);
  }
}

module.exports = authenticate;
