/**
 * LocalBase API Gateway
 * Authentication service
 */

const crypto = require("crypto");
const config = require("../config");
const { AuthenticationError, RateLimitError } = require("../utils/errors");
const logger = require("../utils/logger");
const databaseService = require("./database");

// In-memory rate limiting (replace with Redis in production)
const rateLimits = new Map();

/**
 * Authentication service
 * Handles API key validation and rate limiting
 */
class AuthenticationService {
	constructor() {
		// Nothing to initialize
	}

	/**
	 * Validate API key
	 *
	 * @param {string} apiKey - API key to validate
	 * @returns {Promise<Object>} - User object if valid
	 * @throws {AuthenticationError} - If API key is invalid
	 */
	async validateApiKey(apiKey) {
		// Validate API key format
		if (!apiKey || !apiKey.startsWith(config.auth.apiKeyPrefix)) {
			throw new AuthenticationError(
				"Invalid API key format",
				"api_key",
				"invalid_api_key_format"
			);
		}

		// Find user by API key
		const user = await databaseService.findUserByApiKey(apiKey);

		if (!user) {
			throw new AuthenticationError(
				"Invalid API key",
				"api_key",
				"invalid_api_key"
			);
		}

		// Check if user account is active
		if (!user.active) {
			throw new AuthenticationError(
				"User account is inactive",
				"api_key",
				"inactive_account"
			);
		}

		return user;
	}

	/**
	 * Check rate limit for a user and endpoint
	 *
	 * @param {string} userId - User ID
	 * @param {string} endpoint - API endpoint
	 * @returns {Promise<Object>} - Rate limit information
	 * @throws {RateLimitError} - If rate limit is exceeded
	 */
	async checkRateLimit(userId, endpoint) {
		const key = `${userId}:${endpoint}`;
		const now = Date.now();
		const windowMs = config.rateLimit.windowMs;

		// Get current user's rate limit data
		let userRateLimit = rateLimits.get(key) || {
			count: 0,
			reset: now + windowMs,
		};

		// Reset if window has expired
		if (now > userRateLimit.reset) {
			userRateLimit = {
				count: 0,
				reset: now + windowMs,
			};
		}

		// Check if rate limit exceeded
		if (userRateLimit.count >= config.rateLimit.max) {
			throw new RateLimitError();
		}

		// Increment count and update map
		userRateLimit.count++;
		rateLimits.set(key, userRateLimit);

		// Return rate limit info for headers
		return {
			limit: config.rateLimit.max,
			remaining: config.rateLimit.max - userRateLimit.count,
			reset: Math.floor(userRateLimit.reset / 1000),
		};
	}
}

module.exports = AuthenticationService;
