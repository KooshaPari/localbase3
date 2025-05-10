/**
 * LocalBase API Gateway
 * Database service
 */

const { User, ApiKey, Transaction, Job } = require('../models');
const logger = require('../utils/logger');
const { ResourceNotFoundError, ServiceUnavailableError } = require('../utils/errors');

/**
 * Database service
 * Handles data storage and retrieval
 */
class DatabaseService {
  /**
   * Find user by ID
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async findUserById(userId) {
    try {
      return await User.findById(userId);
    } catch (error) {
      logger.error(`Error finding user ${userId}:`, error);
      throw new ServiceUnavailableError('Database error');
    }
  }
  
  /**
   * Find user by API key
   * 
   * @param {string} apiKey - API key
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async findUserByApiKey(apiKey) {
    try {
      const apiKeyDoc = await ApiKey.findOne({ 
        key: apiKey,
        active: true
      }).populate('user');
      
      if (!apiKeyDoc) {
        return null;
      }
      
      // Update last used timestamp
      apiKeyDoc.last_used = new Date();
      await apiKeyDoc.save();
      
      return apiKeyDoc.user;
    } catch (error) {
      logger.error('Error finding user by API key:', error);
      throw new ServiceUnavailableError('Database error');
    }
  }
  
  /**
   * Create user
   * 
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUser(userData) {
    try {
      const user = new User({
        name: userData.name,
        email: userData.email,
        active: userData.active !== false,
        tier: userData.tier || 'basic',
        balance: userData.balance || 0
      });
      
      await user.save();
      
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw new ServiceUnavailableError('Database error');
    }
  }
  
  /**
   * Create API key for user
   * 
   * @param {string} userId - User ID
   * @param {string} name - API key name
   * @returns {Promise<string>} - API key
   */
  async createApiKey(userId, name = 'Default API Key') {
    try {
      const user = await this.findUserById(userId);
      
      if (!user) {
        throw new ResourceNotFoundError('User', userId);
      }
      
      // Generate API key
      const key = ApiKey.generateKey();
      
      // Create API key document
      const apiKey = new ApiKey({
        key,
        user: user._id,
        name
      });
      
      await apiKey.save();
      
      return key;
    } catch (error) {
      logger.error(`Error creating API key for user ${userId}:`, error);
      
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Database error');
    }
  }
  
  /**
   * Update user balance
   * 
   * @param {string} userId - User ID
   * @param {number} newBalance - New balance
   * @returns {Promise<Object>} - Updated user
   */
  async updateUserBalance(userId, newBalance) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { balance: newBalance },
        { new: true }
      );
      
      if (!user) {
        throw new ResourceNotFoundError('User', userId);
      }
      
      return user;
    } catch (error) {
      logger.error(`Error updating balance for user ${userId}:`, error);
      
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Database error');
    }
  }
  
  /**
   * Record transaction
   * 
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} - Recorded transaction
   */
  async recordTransaction(transactionData) {
    try {
      const transaction = new Transaction({
        user: transactionData.user,
        type: transactionData.type,
        amount: transactionData.amount,
        balance_after: transactionData.balance_after,
        status: transactionData.status || 'completed',
        job: transactionData.job,
        provider_id: transactionData.provider_id,
        blockchain_tx: transactionData.blockchain_tx,
        metadata: transactionData.metadata
      });
      
      await transaction.save();
      
      return transaction;
    } catch (error) {
      logger.error('Error recording transaction:', error);
      throw new ServiceUnavailableError('Database error');
    }
  }
  
  /**
   * Get user transactions
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} - Array of transactions
   */
  async getUserTransactions(userId, filters = {}) {
    try {
      let query = Transaction.find({ user: userId });
      
      // Apply filters
      if (filters.type) {
        query = query.where('type').equals(filters.type);
      }
      
      if (filters.status) {
        query = query.where('status').equals(filters.status);
      }
      
      // Apply sorting
      query = query.sort({ created_at: -1 });
      
      // Apply pagination
      const limit = filters.limit || 100;
      const skip = filters.offset || 0;
      query = query.skip(skip).limit(limit);
      
      return await query.exec();
    } catch (error) {
      logger.error(`Error getting transactions for user ${userId}:`, error);
      throw new ServiceUnavailableError('Database error');
    }
  }
  
  /**
   * Create job
   * 
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} - Created job
   */
  async createJob(jobData) {
    try {
      const job = new Job({
        user: jobData.user,
        model: jobData.model,
        provider_id: jobData.provider_id,
        input: jobData.input,
        parameters: jobData.parameters,
        blockchain_job_id: jobData.blockchain_job_id,
        status: 'pending'
      });
      
      await job.save();
      
      return job;
    } catch (error) {
      logger.error('Error creating job:', error);
      throw new ServiceUnavailableError('Database error');
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
      const job = await Job.findById(jobId);
      
      if (!job) {
        throw new ResourceNotFoundError('Job', jobId);
      }
      
      return job;
    } catch (error) {
      logger.error(`Error getting job ${jobId}:`, error);
      
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Database error');
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
      const updateData = {
        status,
        updated_at: new Date()
      };
      
      // Add status-specific timestamps
      if (status === 'processing') {
        updateData.started_at = new Date();
      } else if (status === 'completed') {
        updateData.completed_at = new Date();
        updateData.result = data.result;
        updateData.usage = data.usage;
        updateData.cost = data.cost;
      } else if (status === 'failed') {
        updateData.failed_at = new Date();
        updateData.error = data.error;
      }
      
      // Add any additional data
      Object.assign(updateData, data);
      
      const job = await Job.findByIdAndUpdate(
        jobId,
        updateData,
        { new: true }
      );
      
      if (!job) {
        throw new ResourceNotFoundError('Job', jobId);
      }
      
      return job;
    } catch (error) {
      logger.error(`Error updating job ${jobId} status:`, error);
      
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Database error');
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
      let query = Job.find({ user: userId });
      
      // Apply filters
      if (filters.status) {
        query = query.where('status').equals(filters.status);
      }
      
      if (filters.model) {
        query = query.where('model').equals(filters.model);
      }
      
      // Apply sorting
      query = query.sort({ created_at: -1 });
      
      // Apply pagination
      const limit = filters.limit || 100;
      const skip = filters.offset || 0;
      query = query.skip(skip).limit(limit);
      
      return await query.exec();
    } catch (error) {
      logger.error(`Error getting jobs for user ${userId}:`, error);
      throw new ServiceUnavailableError('Database error');
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();
