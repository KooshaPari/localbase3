/**
 * LocalBase API Gateway
 * Job management service
 */

const { v4: uuidv4 } = require('uuid');
const blockchainClient = require('./blockchain');
const logger = require('../utils/logger');
const { ResourceNotFoundError, ServiceUnavailableError } = require('../utils/errors');

/**
 * In-memory job storage (replace with database in production)
 */
const jobStore = new Map();

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
      // Generate unique job ID
      const jobId = `job_${uuidv4()}`;
      
      logger.debug(`Creating job ${jobId}:`, jobData);
      
      // Create job record
      const job = {
        id: jobId,
        user_id: jobData.user,
        model: jobData.model,
        provider_id: jobData.provider,
        input: jobData.input,
        parameters: jobData.parameters,
        status: 'pending',
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      // Store job in memory (use database in production)
      jobStore.set(jobId, job);
      
      // Create job on blockchain
      await blockchainClient.createJob({
        id: jobId,
        model: jobData.model,
        provider: jobData.provider,
        parameters: {
          max_tokens: jobData.parameters.max_tokens,
          temperature: jobData.parameters.temperature
        }
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
      
      // Get job from memory (use database in production)
      const job = jobStore.get(jobId);
      
      if (!job) {
        throw new ResourceNotFoundError('Job', jobId);
      }
      
      // If job is pending or processing, check blockchain for updates
      if (job.status === 'pending' || job.status === 'processing') {
        const blockchainJob = await blockchainClient.queryJob(jobId);
        
        // Update job status if changed
        if (blockchainJob.status !== job.status) {
          job.status = blockchainJob.status;
          job.updated_at = Date.now();
          
          if (blockchainJob.status === 'completed') {
            job.result = blockchainJob.result;
            job.completed_at = Date.now();
          } else if (blockchainJob.status === 'failed') {
            job.error = blockchainJob.error;
            job.failed_at = Date.now();
          }
          
          // Update job in memory
          jobStore.set(jobId, job);
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
   * List jobs for a user
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} - Array of jobs
   */
  async listJobs(userId, filters = {}) {
    try {
      logger.debug(`Listing jobs for user ${userId} with filters:`, filters);
      
      // Get jobs from memory (use database in production)
      const jobs = Array.from(jobStore.values())
        .filter(job => job.user_id === userId)
        .filter(job => {
          // Apply filters
          if (filters.status && job.status !== filters.status) {
            return false;
          }
          
          if (filters.model && job.model !== filters.model) {
            return false;
          }
          
          if (filters.provider_id && job.provider_id !== filters.provider_id) {
            return false;
          }
          
          return true;
        });
      
      // Sort by created_at (descending)
      jobs.sort((a, b) => b.created_at - a.created_at);
      
      // Apply pagination
      const limit = filters.limit || 100;
      const offset = filters.offset || 0;
      
      return jobs.slice(offset, offset + limit);
    } catch (error) {
      logger.error(`Error listing jobs for user ${userId}:`, error);
      throw new ServiceUnavailableError('Failed to list jobs');
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
      
      // Get job from memory
      const job = jobStore.get(jobId);
      
      if (!job) {
        throw new ResourceNotFoundError('Job', jobId);
      }
      
      // Update job status
      job.status = status;
      job.updated_at = Date.now();
      
      // Add additional data
      Object.assign(job, data);
      
      // Update job in memory
      jobStore.set(jobId, job);
      
      return job;
    } catch (error) {
      logger.error(`Error updating job ${jobId} status:`, error);
      
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Failed to update job status');
    }
  }
  
  /**
   * Complete a job
   * 
   * @param {string} jobId - Job ID
   * @param {string} result - Job result
   * @param {Object} usage - Token usage
   * @returns {Promise<Object>} - Completed job
   */
  async completeJob(jobId, result, usage) {
    try {
      logger.debug(`Completing job ${jobId}`);
      
      return this.updateJobStatus(jobId, 'completed', {
        result,
        usage,
        completed_at: Date.now()
      });
    } catch (error) {
      logger.error(`Error completing job ${jobId}:`, error);
      throw error;
    }
  }
  
  /**
   * Fail a job
   * 
   * @param {string} jobId - Job ID
   * @param {string} error - Error message
   * @returns {Promise<Object>} - Failed job
   */
  async failJob(jobId, error) {
    try {
      logger.debug(`Failing job ${jobId}: ${error}`);
      
      return this.updateJobStatus(jobId, 'failed', {
        error,
        failed_at: Date.now()
      });
    } catch (error) {
      logger.error(`Error failing job ${jobId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new JobManager();
