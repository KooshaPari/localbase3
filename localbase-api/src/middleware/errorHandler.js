/**
 * LocalBase API Gateway
 * Error handling middleware
 */

const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('API Error:', err);
  
  // If it's our custom API error, use its properties
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        type: err.type,
        param: err.param,
        code: err.code
      }
    });
  }
  
  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        message: 'Invalid JSON',
        type: 'invalid_request_error',
        code: 'invalid_json'
      }
    });
  }
  
  // Default error response for unexpected errors
  res.status(500).json({
    error: {
      message: 'An unexpected error occurred',
      type: 'server_error',
      code: 'internal_server_error'
    }
  });
}

module.exports = errorHandler;
