/**
 * LocalBase API Gateway
 * Blockchain client service
 */

const cosmosClient = require("./cosmos");
const config = require("../config");
const logger = require("../utils/logger");
const {
	ServiceUnavailableError,
	ResourceNotFoundError,
} = require("../utils/errors");

/**
 * Blockchain client service
 * Interfaces with the LocalBase blockchain
 */
class BlockchainClient {
	constructor() {
		this.config = config.blockchain;
		this.cosmosClient = cosmosClient;

		logger.info("Blockchain client initialized");
	}

	/**
	 * Query models
	 *
	 * @returns {Promise<Array>} - Array of models
	 */
	async queryModels() {
		try {
			logger.debug("Querying models");

			return await this.cosmosClient.queryModels();
		} catch (error) {
			logger.error("Error querying models:", error);
			throw new ServiceUnavailableError(
				"Failed to query models from blockchain"
			);
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
			logger.debug(`Querying model: ${modelId}`);

			return await this.cosmosClient.queryModel(modelId);
		} catch (error) {
			logger.error("Error querying model:", error);

			if (error instanceof ResourceNotFoundError) {
				throw error;
			}

			throw new ServiceUnavailableError(
				"Failed to query model from blockchain"
			);
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
			logger.debug(`Querying providers for model: ${model}`);

			return await this.cosmosClient.queryProvidersByModel(model);
		} catch (error) {
			logger.error("Error querying providers:", error);
			throw new ServiceUnavailableError(
				"Failed to query providers from blockchain"
			);
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
			logger.debug(`Querying provider: ${providerId}`);

			return await this.cosmosClient.queryProvider(providerId);
		} catch (error) {
			logger.error("Error querying provider:", error);

			if (error instanceof ResourceNotFoundError) {
				throw error;
			}

			throw new ServiceUnavailableError(
				"Failed to query provider from blockchain"
			);
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
			logger.debug("Creating job on blockchain:", jobData);

			return await this.cosmosClient.createJob(jobData);
		} catch (error) {
			logger.error("Error creating job:", error);
			throw new ServiceUnavailableError("Failed to create job on blockchain");
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
			logger.debug(`Querying job: ${jobId}`);

			return await this.cosmosClient.queryJob(jobId);
		} catch (error) {
			logger.error("Error querying job:", error);
			throw new ServiceUnavailableError("Failed to query job from blockchain");
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
			logger.debug(`Completing job ${jobId}`);

			return await this.cosmosClient.completeJob(jobId, result, resourcesUsed);
		} catch (error) {
			logger.error("Error completing job:", error);
			throw new ServiceUnavailableError("Failed to complete job on blockchain");
		}
	}

	/**
	 * Fail job on blockchain
	 *
	 * @param {string} jobId - Job ID
	 * @param {string} errorMessage - Error message
	 * @returns {Promise<Object>} - Updated job
	 */
	async failJob(jobId, errorMessage) {
		try {
			logger.debug(`Failing job ${jobId}: ${errorMessage}`);

			return await this.cosmosClient.failJob(jobId, errorMessage);
		} catch (error) {
			logger.error("Error failing job:", error);
			throw new ServiceUnavailableError("Failed to fail job on blockchain");
		}
	}
}

// Export singleton instance
module.exports = new BlockchainClient();
