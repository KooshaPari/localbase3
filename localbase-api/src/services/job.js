/**
 * LocalBase API Gateway
 * Job management service
 */

const { v4: uuidv4 } = require('uuid');
const blockchainClient = require('./blockchain');
const databaseService = require('./database');
const { ResourceNotFoundError, ServiceUnavailableError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Job management service
 * Handles the lifecycle of inference jobs
 */
class JobManager {
  /**
   * Create a new job
   * 
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} - Created job
   */
  async createJob(jobData) {
    try {
      logger.debug('Creating job:', jobData);
      
      // Create blockchain job
      const blockchainJobResult = await blockchainClient.createJob({
        model: jobData.model,
        provider: jobData.provider_id,
        parameters: jobData.parameters
      });
      
      // Create job in database
      const job = await databaseService.createJob({
        user: jobData.user,
        model: jobData.model,
        provider_id: jobData.provider_id,
        input: jobData.input,
        parameters: jobData.parameters,
        blockchain_job_id: blockchainJobResult.id
      });
      
      return job;
    } catch (error) {
      logger.error('Error creating job:', error);
      throw new ServiceUnavailableError('Failed to create job');
    }
  }
  
  /**
   * Get job by ID
   * 
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Job object
   */
  async getJob(jobId) {
    try {
      logger.debug(`Getting job ${jobId}`);
      
      // Get job from database
      const job = await databaseService.getJob(jobId);
      
      // If job is pending or processing, check blockchain for updates
      if (job.status === 'pending' || job.status === 'processing') {
        const blockchainJob = await blockchainClient.queryJob(job.blockchain_job_id);
        
        // Update job status if changed
        if (blockchainJob.status !== job.status) {
          if (blockchainJob.status === 'completed') {
            await databaseService.updateJobStatus(jobId, 'completed', {
              result: blockchainJob.result,
              usage: blockchainJob.usage,
              cost: blockchainJob.cost
            });
          } else if (blockchainJob.status === 'failed') {
            await databaseService.updateJobStatus(jobId, 'failed', {
              error: blockchainJob.error
            });
          } else {
            await databaseService.updateJobStatus(jobId, blockchainJob.status);
          }
          
          // Refresh job
          return await databaseService.getJob(jobId);
        }
      }
      
      return job;
    } catch (error) {
      logger.error(`Error getting job ${jobId}:`, error);
      
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Failed to get job');
    }
  }
  
  /**
   * Get user jobs
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} - Array of jobs
   */
  async getUserJobs(userId, filters = {}) {
    try {
      logger.debug(`Getting jobs for user ${userId}`);
      
      return await databaseService.getUserJobs(userId, filters);
    } catch (error) {
      logger.error(`Error getting jobs for user ${userId}:`, error);
      throw new ServiceUnavailableError('Failed to get jobs');
    }
  }
  
  /**
   * Update job status
   * 
   * @param {string} jobId - Job ID
   * @param {string} status - New status
   * @param {Object} data - Additional data
   * @returns {Promise<Object>} - Updated job
   */
  async updateJobStatus(jobId, status, data = {}) {
    try {
      logger.debug(`Updating job ${jobId} status to ${status}`);
      
      return await databaseService.updateJobStatus(jobId, status, data);
    } catch (error) {
      logger.error(`Error updating job ${jobId} status:`, error);
      
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Failed to update job status');
    }
  }
  
  /**
   * Complete job
   * 
   * @param {string} jobId - Job ID
   * @param {Object} result - Job result
   * @param {Object} usage - Token usage
   * @returns {Promise<Object>} - Completed job
   */
  async completeJob(jobId, result, usage) {
    try {
      logger.debug(`Completing job ${jobId}`);
      
      // Get job
      const job = await databaseService.getJob(jobId);
      
      // Update blockchain job
      await blockchainClient.completeJob(job.blockchain_job_id, result, usage);
      
      // Calculate cost
      const cost = this._calculateJobCost(job.model, job.provider_id, usage);
      
      // Update job in database
      return await databaseService.updateJobStatus(jobId, 'completed', {
        result,
        usage,
        cost
      });
    } catch (error) {
      logger.error(`Error completing job ${jobId}:`, error);
      
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Failed to complete job');
    }
  }
  
  /**
   * Fail job
   * 
   * @param {string} jobId - Job ID
   * @param {string} error - Error message
   * @returns {Promise<Object>} - Failed job
   */
  async failJob(jobId, errorMessage) {
    try {
      logger.debug(`Failing job ${jobId}: ${errorMessage}`);
      
      // Get job
      const job = await databaseService.getJob(jobId);
      
      // Update blockchain job
      await blockchainClient.failJob(job.blockchain_job_id, errorMessage);
      
      // Update job in database
      return await databaseService.updateJobStatus(jobId, 'failed', {
        error: errorMessage
      });
    } catch (error) {
      logger.error(`Error failing job ${jobId}:`, error);
      
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Failed to fail job');
    }
  }
  
  /**
   * Calculate job cost
   * 
   * @param {string} model - Model ID
   * @param {string} providerId - Provider ID
   * @param {Object} usage - Token usage
   * @returns {number} - Job cost
   * @private
   */
  async _calculateJobCost(model, providerId, usage) {
    try {
      // Get provider
      const provider = await blockchainClient.queryProvider(providerId);
      
      // Get pricing for model
      const pricing = provider.pricing[model] || {};
      
      // Calculate cost
      const inputCost = (usage.input_tokens || 0) * (pricing.input_price_per_token || 0);
      const outputCost = (usage.output_tokens || 0) * (pricing.output_price_per_token || 0);
      
      return inputCost + outputCost;
    } catch (error) {
      logger.error('Error calculating job cost:', error);
      return 0;
    }
  }
}

// Export singleton instance
module.exports = new JobManager();
