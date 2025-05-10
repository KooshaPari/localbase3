/**
 * LocalBase API Gateway
 * Provider selection service
 */

const blockchainClient = require("./blockchain");
const config = require("../config");
const {
	ResourceNotFoundError,
	ServiceUnavailableError,
} = require("../utils/errors");
const logger = require("../utils/logger");

/**
 * Provider selection service
 * Selects the most appropriate provider for a given request
 */
class ProviderSelector {
	constructor() {
		// Cache for provider data (in production, use Redis)
		this.providerCache = new Map();
		this.cacheExpiry = 60000; // 1 minute
	}

	/**
	 * Select provider for a request
	 *
	 * @param {Object} options - Selection options
	 * @param {string} options.model - Model ID
	 * @param {Object} options.preferences - Provider preferences
	 * @param {Object} options.user - User object
	 * @returns {Promise<Object>} - Selected provider
	 * @throws {ResourceNotFoundError} - If no providers are available
	 */
	async selectProvider(options) {
		const { model, preferences = {}, user } = options;

		// Get providers supporting the requested model
		const providers = await this._getProvidersByModel(model);

		if (providers.length === 0) {
			throw new ResourceNotFoundError(
				"Providers for model",
				model,
				"no_providers_available"
			);
		}

		// Filter providers based on user preferences
		const filteredProviders = this._filterProviders(providers, preferences);

		if (filteredProviders.length === 0) {
			logger.warn(
				`No providers match preferences for model ${model}, using all available providers`
			);
			// If no providers match the preferences, use all providers
			// This is more user-friendly than throwing an error
		}

		// Rank providers based on multiple factors
		const rankedProviders = this._rankProviders(
			filteredProviders.length > 0 ? filteredProviders : providers,
			preferences
		);

		// Return the highest-ranked provider
		return rankedProviders[0];
	}

	/**
	 * Get providers supporting a specific model
	 *
	 * @param {string} model - Model ID
	 * @returns {Promise<Array>} - Array of providers
	 * @private
	 */
	async _getProvidersByModel(model) {
		// Check cache first
		const cacheKey = `providers:${model}`;
		const cachedData = this.providerCache.get(cacheKey);

		if (cachedData && cachedData.expiry > Date.now()) {
			return cachedData.providers;
		}

		// Fetch from blockchain client
		const providers = await blockchainClient.queryProvidersByModel(model);

		// Update cache
		this.providerCache.set(cacheKey, {
			providers,
			expiry: Date.now() + this.cacheExpiry,
		});

		return providers;
	}

	/**
	 * Filter providers based on preferences
	 *
	 * @param {Array} providers - Array of providers
	 * @param {Object} preferences - Provider preferences
	 * @returns {Array} - Filtered providers
	 * @private
	 */
	_filterProviders(providers, preferences) {
		return providers.filter((provider) => {
			// Filter by minimum reputation
			if (
				preferences.min_reputation &&
				provider.reputation < preferences.min_reputation
			) {
				return false;
			}

			// Filter by maximum price
			if (preferences.max_price_per_token) {
				// Check if any of the provider's models have a price higher than the max
				const modelPricing = provider.pricing[preferences.model] || {};
				if (
					modelPricing.output_price_per_token > preferences.max_price_per_token
				) {
					return false;
				}
			}

			// Filter by region
			if (preferences.region && provider.region !== preferences.region) {
				return false;
			}

			// Filter by response time
			if (
				preferences.max_response_time_ms &&
				provider.avg_response_time > preferences.max_response_time_ms
			) {
				return false;
			}

			// Filter by specific provider ID
			if (preferences.provider_id && provider.id !== preferences.provider_id) {
				return false;
			}

			return true;
		});
	}

	/**
	 * Rank providers based on multiple factors
	 *
	 * @param {Array} providers - Array of providers
	 * @param {Object} preferences - Provider preferences
	 * @returns {Array} - Ranked providers
	 * @private
	 */
	_rankProviders(providers, preferences) {
		// Define weights for different factors
		const weights = {
			reputation: preferences.reputation_weight || 0.4,
			price: preferences.price_weight || 0.3,
			responseTime: preferences.response_time_weight || 0.3,
		};

		// Calculate scores for each provider
		const providersWithScores = providers.map((provider) => {
			// Reputation score (0-1)
			const reputationScore = provider.reputation;

			// Price score (lower price = higher score)
			// Find the output price for the requested model
			const modelPricing = provider.pricing[preferences.model] || {};
			const outputPrice = modelPricing.output_price_per_token || 0.00000005; // Default if not found
			// Normalize price score (assuming 0.0000001 is the highest reasonable price)
			const priceScore = 1 - outputPrice / 0.0000001;

			// Response time score (lower time = higher score)
			// Normalize response time (assuming 500ms is the highest reasonable time)
			const responseTimeScore = 1 - provider.avg_response_time / 500;

			// Calculate weighted score
			const score =
				weights.reputation * reputationScore +
				weights.price * priceScore +
				weights.responseTime * responseTimeScore;

			// Preferred provider bonus
			if (preferences.provider_id === provider.id) {
				score += 1; // Add a significant bonus
			}

			return {
				...provider,
				score,
			};
		});

		// Sort by score (descending)
		return providersWithScores.sort((a, b) => b.score - a.score);
	}
}

module.exports = ProviderSelector;
