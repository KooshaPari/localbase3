/**
 * LocalBase API Gateway
 * Cosmos SDK blockchain client
 */

const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { SigningStargateClient, StargateClient } = require('@cosmjs/stargate');
const config = require('../config');
const logger = require('../utils/logger');
const { ServiceUnavailableError, ResourceNotFoundError } = require('../utils/errors');

/**
 * Cosmos SDK blockchain client
 * Interfaces with the LocalBase blockchain
 */
class CosmosClient {
  constructor() {
    this.config = config.blockchain;
    this.client = null;
    this.signingClient = null;
    this.wallet = null;
    this.address = null;
    this.initialized = false;
  }
  
  /**
   * Initialize the client
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (this.initialized) {
        return;
      }
      
      logger.info('Initializing Cosmos SDK client...');
      
      // Create wallet from mnemonic
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(
        this.config.walletMnemonic,
        { prefix: this.config.addressPrefix || 'lb' }
      );
      
      // Get address
      const accounts = await this.wallet.getAccounts();
      this.address = accounts[0].address;
      
      // Create clients
      this.client = await StargateClient.connect(this.config.rpcUrl);
      this.signingClient = await SigningStargateClient.connectWithSigner(
        this.config.rpcUrl,
        this.wallet
      );
      
      logger.info(`Cosmos SDK client initialized with address: ${this.address}`);
      this.initialized = true;
    } catch (error) {
      logger.error('Error initializing Cosmos SDK client:', error);
      throw new ServiceUnavailableError('Failed to initialize blockchain client');
    }
  }
  
  /**
   * Ensure client is initialized
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  /**
   * Query models
   * 
   * @returns {Promise<Array>} - Array of models
   */
  async queryModels() {
    try {
      await this._ensureInitialized();
      
      logger.debug('Querying models from blockchain');
      
      // In a real implementation, query the blockchain
      // For now, use mock data
      return [
        {
          id: 'lb-llama-3-70b',
          object: 'model',
          created_at: Date.now() - 86400000, // 1 day ago
          owned_by: 'localbase',
          providers: [
            {
              id: 'provider_1',
              reputation: 0.98,
              price_per_token: 0.00000005,
              avg_response_time: 150
            },
            {
              id: 'provider_2',
              reputation: 0.95,
              price_per_token: 0.00000004,
              avg_response_time: 180
            }
          ]
        },
        {
          id: 'lb-mixtral-8x7b',
          object: 'model',
          created_at: Date.now() - 86400000, // 1 day ago
          owned_by: 'localbase',
          providers: [
            {
              id: 'provider_1',
              reputation: 0.98,
              price_per_token: 0.00000003,
              avg_response_time: 120
            }
          ]
        },
        {
          id: 'lb-embedding-ada-002',
          object: 'model',
          created_at: Date.now() - 86400000, // 1 day ago
          owned_by: 'localbase',
          providers: [
            {
              id: 'provider_3',
              reputation: 0.97,
              price_per_token: 0.00000001,
              avg_response_time: 80
            }
          ]
        }
      ];
    } catch (error) {
      logger.error('Error querying models:', error);
      throw new ServiceUnavailableError('Failed to query models from blockchain');
    }
  }
  
  /**
   * Query model details
   * 
   * @param {string} modelId - Model ID
   * @returns {Promise<Object>} - Model details
   */
  async queryModel(modelId) {
    try {
      await this._ensureInitialized();
      
      logger.debug(`Querying model: ${modelId}`);
      
      // In a real implementation, query the blockchain
      // For now, use mock data
      const models = await this.queryModels();
      const model = models.find(m => m.id === modelId);
      
      if (!model) {
        throw new ResourceNotFoundError('Model', modelId);
      }
      
      return model;
    } catch (error) {
      logger.error('Error querying model:', error);
      
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Failed to query model from blockchain');
    }
  }
  
  /**
   * Query providers by model
   * 
   * @param {string} model - Model ID
   * @returns {Promise<Array>} - Array of providers
   */
  async queryProvidersByModel(model) {
    try {
      await this._ensureInitialized();
      
      logger.debug(`Querying providers for model: ${model}`);
      
      // In a real implementation, query the blockchain
      // For now, use mock data
      const providers = [
        {
          id: 'provider_1',
          name: 'Provider 1',
          created: Math.floor(Date.now() / 1000) - 86400,
          hardware: {
            gpu_type: 'NVIDIA RTX 4090',
            vram: '24GB',
            cpu_cores: 16,
            ram: '64GB'
          },
          benchmark_results: {
            inference_speed: 120,
            max_batch_size: 8
          },
          reputation: 0.98,
          models_supported: ['lb-llama-3-70b', 'lb-mixtral-8x7b'],
          pricing: {
            'lb-llama-3-70b': {
              input_price_per_token: 0.00000002,
              output_price_per_token: 0.00000005
            },
            'lb-mixtral-8x7b': {
              input_price_per_token: 0.00000001,
              output_price_per_token: 0.00000003
            }
          },
          status: 'active',
          region: 'us-west',
          avg_response_time: 150,
          performance_history: {
            uptime_percentage: 99.8,
            avg_response_time: 150,
            completed_jobs: 15420
          }
        },
        {
          id: 'provider_2',
          name: 'Provider 2',
          created: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
          hardware: {
            gpu_type: 'NVIDIA RTX 3090',
            vram: '24GB',
            cpu_cores: 12,
            ram: '32GB'
          },
          benchmark_results: {
            inference_speed: 150,
            max_batch_size: 6
          },
          reputation: 0.95,
          models_supported: ['lb-llama-3-70b'],
          pricing: {
            'lb-llama-3-70b': {
              input_price_per_token: 0.00000002,
              output_price_per_token: 0.00000004
            }
          },
          status: 'active',
          region: 'us-east',
          avg_response_time: 180,
          performance_history: {
            uptime_percentage: 99.5,
            avg_response_time: 180,
            completed_jobs: 8750
          }
        },
        {
          id: 'provider_3',
          name: 'Provider 3',
          created: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
          hardware: {
            gpu_type: 'NVIDIA A100',
            vram: '80GB',
            cpu_cores: 32,
            ram: '128GB'
          },
          benchmark_results: {
            inference_speed: 80,
            max_batch_size: 16
          },
          reputation: 0.97,
          models_supported: ['lb-embedding-ada-002'],
          pricing: {
            'lb-embedding-ada-002': {
              input_price_per_token: 0.00000001
            }
          },
          status: 'active',
          region: 'eu-west',
          avg_response_time: 80,
          performance_history: {
            uptime_percentage: 99.9,
            avg_response_time: 80,
            completed_jobs: 25680
          }
        }
      ];
      
      return providers.filter(p => p.models_supported.includes(model));
    } catch (error) {
      logger.error('Error querying providers:', error);
      throw new ServiceUnavailableError('Failed to query providers from blockchain');
    }
  }
  
  /**
   * Query provider details
   * 
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object>} - Provider details
   */
  async queryProvider(providerId) {
    try {
      await this._ensureInitialized();
      
      logger.debug(`Querying provider: ${providerId}`);
      
      // In a real implementation, query the blockchain
      // For now, use mock data
      const providers = [
        {
          id: 'provider_1',
          name: 'Provider 1',
          created: Math.floor(Date.now() / 1000) - 86400,
          hardware: {
            gpu_type: 'NVIDIA RTX 4090',
            vram: '24GB',
            cpu_cores: 16,
            ram: '64GB'
          },
          benchmark_results: {
            inference_speed: 120,
            max_batch_size: 8
          },
          reputation: 0.98,
          models_supported: ['lb-llama-3-70b', 'lb-mixtral-8x7b'],
          pricing: {
            'lb-llama-3-70b': {
              input_price_per_token: 0.00000002,
              output_price_per_token: 0.00000005
            },
            'lb-mixtral-8x7b': {
              input_price_per_token: 0.00000001,
              output_price_per_token: 0.00000003
            }
          },
          status: 'active',
          region: 'us-west',
          avg_response_time: 150,
          performance_history: {
            uptime_percentage: 99.8,
            avg_response_time: 150,
            completed_jobs: 15420
          }
        },
        {
          id: 'provider_2',
          name: 'Provider 2',
          created: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
          hardware: {
            gpu_type: 'NVIDIA RTX 3090',
            vram: '24GB',
            cpu_cores: 12,
            ram: '32GB'
          },
          benchmark_results: {
            inference_speed: 150,
            max_batch_size: 6
          },
          reputation: 0.95,
          models_supported: ['lb-llama-3-70b'],
          pricing: {
            'lb-llama-3-70b': {
              input_price_per_token: 0.00000002,
              output_price_per_token: 0.00000004
            }
          },
          status: 'active',
          region: 'us-east',
          avg_response_time: 180,
          performance_history: {
            uptime_percentage: 99.5,
            avg_response_time: 180,
            completed_jobs: 8750
          }
        },
        {
          id: 'provider_3',
          name: 'Provider 3',
          created: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
          hardware: {
            gpu_type: 'NVIDIA A100',
            vram: '80GB',
            cpu_cores: 32,
            ram: '128GB'
          },
          benchmark_results: {
            inference_speed: 80,
            max_batch_size: 16
          },
          reputation: 0.97,
          models_supported: ['lb-embedding-ada-002'],
          pricing: {
            'lb-embedding-ada-002': {
              input_price_per_token: 0.00000001
            }
          },
          status: 'active',
          region: 'eu-west',
          avg_response_time: 80,
          performance_history: {
            uptime_percentage: 99.9,
            avg_response_time: 80,
            completed_jobs: 25680
          }
        }
      ];
      
      const provider = providers.find(p => p.id === providerId);
      
      if (!provider) {
        throw new ResourceNotFoundError('Provider', providerId);
      }
      
      return provider;
    } catch (error) {
      logger.error('Error querying provider:', error);
      
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Failed to query provider from blockchain');
    }
  }
  
  /**
   * Create job on blockchain
   * 
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} - Created job
   */
  async createJob(jobData) {
    try {
      await this._ensureInitialized();
      
      logger.debug('Creating job on blockchain:', jobData);
      
      // In a real implementation, create job on blockchain
      // For now, use mock implementation
      return {
        id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        txhash: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        success: true
      };
    } catch (error) {
      logger.error('Error creating job:', error);
      throw new ServiceUnavailableError('Failed to create job on blockchain');
    }
  }
  
  /**
   * Query job status
   * 
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Job status
   */
  async queryJob(jobId) {
    try {
      await this._ensureInitialized();
      
      logger.debug(`Querying job: ${jobId}`);
      
      // In a real implementation, query the blockchain
      // For now, use mock implementation
      return {
        id: jobId,
        status: 'pending',
        created_at: Date.now() - 60000 // 1 minute ago
      };
    } catch (error) {
      logger.error('Error querying job:', error);
      throw new ServiceUnavailableError('Failed to query job from blockchain');
    }
  }
  
  /**
   * Complete job on blockchain
   * 
   * @param {string} jobId - Job ID
   * @param {Object} result - Job result
   * @param {Object} resourcesUsed - Resources used
   * @returns {Promise<Object>} - Updated job
   */
  async completeJob(jobId, result, resourcesUsed) {
    try {
      await this._ensureInitialized();
      
      logger.debug(`Completing job ${jobId}`);
      
      // In a real implementation, update job on blockchain
      // For now, use mock implementation
      return {
        id: jobId,
        status: 'completed',
        txhash: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        success: true
      };
    } catch (error) {
      logger.error('Error completing job:', error);
      throw new ServiceUnavailableError('Failed to complete job on blockchain');
    }
  }
  
  /**
   * Fail job on blockchain
   * 
   * @param {string} jobId - Job ID
   * @param {string} error - Error message
   * @returns {Promise<Object>} - Updated job
   */
  async failJob(jobId, errorMessage) {
    try {
      await this._ensureInitialized();
      
      logger.debug(`Failing job ${jobId}: ${errorMessage}`);
      
      // In a real implementation, update job on blockchain
      // For now, use mock implementation
      return {
        id: jobId,
        status: 'failed',
        txhash: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        success: true
      };
    } catch (error) {
      logger.error('Error failing job:', error);
      throw new ServiceUnavailableError('Failed to fail job on blockchain');
    }
  }
}

// Export singleton instance
module.exports = new CosmosClient();
