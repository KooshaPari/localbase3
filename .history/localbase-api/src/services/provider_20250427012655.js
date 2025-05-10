/**
 * LocalBase API Gateway
 * Provider selection service
 */

const { ResourceNotFoundError, ServiceUnavailableError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Provider selection service
 * Selects the most appropriate provider for a given request
 */
class ProviderSelector {
  constructor(blockchainClient, config) {
    this.blockchainClient = blockchainClient;
    this.config = config;
    
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
      throw new ResourceNotFoundError('Providers for model', model, 'no_providers_available');
    }
    
    // Filter providers based on user preferences
    const filteredProviders = this._filterProviders(providers, preferences);
    
    if (filteredProviders.length === 0) {
      throw new ServiceUnavailableError(
        'No providers match the specified preferences',
        'provider_preferences',
        'no_matching_providers'
      );
    }
    
    // Rank providers based on multiple factors
    const rankedProviders = this._rankProviders(filteredProviders, preferences);
    
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
    
    // In production, fetch from blockchain
    // For development, use mock data
    const providers = await this._getMockProviders(model);
    
    // Update cache
    this.providerCache.set(cacheKey, {
      providers,
      expiry: Date.now() + this.cacheExpiry
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
    return providers.filter(provider => {
      // Filter by minimum reputation
      if (preferences.min_reputation && 
          provider.reputation < preferences.min_reputation) {
        return false;
      }
      
      // Filter by maximum price
      if (preferences.max_price_per_token && 
          provider.pricing.output_price_per_token > preferences.max_price_per_token) {
        return false;
      }
      
      // Filter by region
      if (preferences.region && 
          provider.region !== preferences.region) {
        return false;
      }
      
      // Filter by response time
      if (preferences.max_response_time_ms && 
          provider.avg_response_time > preferences.max_response_time_ms) {
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
    // Calculate score for each provider based on multiple factors
    const scoredProviders = providers.map(provider => {
      let score = 0;
      
      // Base score from reputation (0-100)
      score += provider.reputation * 100;
      
      // Price factor (lower price = higher score)
      const priceFactor = 1 - (provider.pricing.output_price_per_token / 0.0001);
      score += priceFactor * 50;
      
      // Performance factor (lower response time = higher score)
      const performanceFactor = 1 - (provider.avg_response_time / 1000);
      score += performanceFactor * 30;
      
      // Preferred provider bonus
      if (preferences.preferred_provider_id === provider.id) {
        score += 100;
      }
      
      return { provider, score };
    });
    
    // Sort by score (descending)
    scoredProviders.sort((a, b) => b.score - a.score);
    
    // Return providers only
    return scoredProviders.map(item => item.provider);
  }
  
  /**
   * Get mock providers for development
   * 
   * @param {string} model - Model ID
   * @returns {Promise<Array>} - Array of providers
   * @private
   */
  async _getMockProviders(model) {
    // Mock data for development
    const mockProviders = {
      'lb-llama-3-70b': [
        {
          id: 'provider_1',
          name: 'Provider 1',
          reputation: 0.98,
          region: 'us-west',
          avg_response_time: 150,
          pricing: {
            input_price_per_token: 0.00000002,
            output_price_per_token: 0.00000005
          },
          hardware: {
            gpu_type: 'NVIDIA RTX 4090',
            vram: '24GB'
          },
          status: 'active'
        },
        {
          id: 'provider_2',
          name: 'Provider 2',
          reputation: 0.95,
          region: 'eu-central',
          avg_response_time: 180,
          pricing: {
            input_price_per_token: 0.00000001,
            output_price_per_token: 0.00000004
          },
          hardware: {
            gpu_type: 'NVIDIA RTX 3090',
            vram: '24GB'
          },
          status: 'active'
        }
      ],
      'lb-mixtral-8x7b': [
        {
          id: 'provider_1',
          name: 'Provider 1',
          reputation: 0.98,
          region: 'us-west',
          avg_response_time: 120,
          pricing: {
            input_price_per_token: 0.00000001,
            output_price_per_token: 0.00000003
          },
          hardware: {
            gpu_type: 'NVIDIA RTX 4090',
            vram: '24GB'
          },
          status: 'active'
        }
      ],
      'lb-embedding-ada-002': [
        {
          id: 'provider_3',
          name: 'Provider 3',
          reputation: 0.97,
          region: 'us-east',
          avg_response_time: 80,
          pricing: {
            input_price_per_token: 0.00000001,
            output_price_per_token: 0.00000001
          },
          hardware: {
            gpu_type: 'NVIDIA A100',
            vram: '40GB'
          },
          status: 'active'
        }
      ]
    };
    
    // Return providers for the requested model
    return mockProviders[model] || [];
  }
}

module.exports = ProviderSelector;
