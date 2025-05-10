/**
 * LocalBase API Gateway
 * Custom error classes
 */

/**
 * Base API error class
 */
class ApiError extends Error {
  constructor(statusCode, message, type = 'server_error', param = null, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.param = param;
    this.code = code;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error
 */
class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed', param = null, code = 'authentication_failed') {
    super(401, message, 'authentication_error', param, code);
  }
}

/**
 * Invalid request error
 */
class InvalidRequestError extends ApiError {
  constructor(message, param = null, code = 'invalid_request') {
    super(400, message, 'invalid_request_error', param, code);
  }
}

/**
 * Rate limit error
 */
class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded', param = null, code = 'rate_limit_exceeded') {
    super(429, message, 'rate_limit_error', param, code);
  }
}

/**
 * Resource not found error
 */
class ResourceNotFoundError extends ApiError {
  constructor(resource, id, code = 'not_found') {
    super(404, `${resource} not found: ${id}`, 'invalid_request_error', resource.toLowerCase(), code);
  }
}

/**
 * Provider error
 */
class ProviderError extends ApiError {
  constructor(message, param = null, code = 'provider_error') {
    super(502, message, 'provider_error', param, code);
  }
}

/**
 * Service unavailable error
 */
class ServiceUnavailableError extends ApiError {
  constructor(message = 'Service temporarily unavailable', param = null, code = 'service_unavailable') {
    super(503, message, 'service_unavailable', param, code);
  }
}

module.exports = {
  ApiError,
  AuthenticationError,
  InvalidRequestError,
  RateLimitError,
  ResourceNotFoundError,
  ProviderError,
  ServiceUnavailableError
};
