/**
 * LocalBase API Gateway
 * Payment service
 */

const blockchainClient = require('./blockchain');
const databaseService = require('./database');
const logger = require('../utils/logger');
const { InvalidRequestError, ServiceUnavailableError } = require('../utils/errors');

/**
 * Payment service
 * Handles payment processing between users and providers
 */
class PaymentService {
  /**
   * Calculate job cost
   * 
   * @param {Object} jobData - Job data
   * @param {Object} provider - Provider data
   * @returns {Promise<Object>} - Cost estimate
   */
  async calculateJobCost(jobData, provider) {
    try {
      logger.debug('Calculating job cost:', { jobData, provider });
      
      // Get provider pricing for the model
      const pricing = provider.pricing[jobData.model];
      
      if (!pricing) {
        throw new InvalidRequestError(
          `Provider ${provider.id} does not support model ${jobData.model}`,
          'model',
          'unsupported_model'
        );
      }
      
      // Estimate input tokens
      const inputTokens = this._estimateInputTokens(jobData);
      
      // Estimate maximum output tokens
      const outputTokens = jobData.parameters.max_tokens || 100;
      
      // Calculate cost based on provider pricing
      const inputCost = inputTokens * pricing.input_price_per_token;
      const outputCost = outputTokens * pricing.output_price_per_token;
      
      // Add safety margin (10%)
      const totalCost = (inputCost + outputCost) * 1.1;
      
      return {
        estimated_input_tokens: inputTokens,
        estimated_output_tokens: outputTokens,
        input_cost: inputCost,
        output_cost: outputCost,
        total_cost: totalCost
      };
    } catch (error) {
      logger.error('Error calculating job cost:', error);
      
      if (error instanceof InvalidRequestError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Failed to calculate job cost');
    }
  }
  
  /**
   * Create escrow for job payment
   * 
   * @param {string} userId - User ID
   * @param {string} jobId - Job ID
   * @param {string} providerId - Provider ID
   * @param {number} amount - Escrow amount
   * @returns {Promise<Object>} - Created escrow
   */
  async createEscrow(userId, jobId, providerId, amount) {
    try {
      logger.debug('Creating escrow:', { userId, jobId, providerId, amount });
      
      // Check user balance
      const user = await databaseService.findUserById(userId);
      
      if (!user) {
        throw new InvalidRequestError(`User ${userId} not found`, 'user_id', 'user_not_found');
      }
      
      if (user.balance < amount) {
        throw new InvalidRequestError(
          'Insufficient funds',
          'amount',
          'insufficient_funds'
        );
      }
      
      // Create escrow on blockchain
      const escrow = await blockchainClient.createEscrow({
        jobId,
        userId,
        providerId,
        amount
      });
      
      // Update user balance
      await databaseService.updateUserBalance(userId, user.balance - amount);
      
      // Record transaction
      await databaseService.recordTransaction({
        user_id: userId,
        type: 'escrow',
        amount: -amount,
        job_id: jobId,
        provider_id: providerId
      });
      
      return escrow;
    } catch (error) {
      logger.error('Error creating escrow:', error);
      
      if (error instanceof InvalidRequestError) {
        throw error;
      }
      
      throw new ServiceUnavailableError('Failed to create escrow');
    }
  }
  
  /**
   * Release payment from escrow
   * 
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Release result
   */
  async releasePayment(jobId) {
    try {
      logger.debug(`Releasing payment for job ${jobId}`);
      
      // Release escrow on blockchain
      const result = await blockchainClient.releaseEscrow(jobId);
      
      // Record transaction for provider
      // In a real implementation, get the actual amount and provider ID
      await databaseService.recordTransaction({
        user_id: 'provider_1', // This would come from the job
        type: 'payment',
        amount: 0.001, // This would be the actual amount
        job_id: jobId
      });
      
      return result;
    } catch (error) {
      logger.error(`Error releasing payment for job ${jobId}:`, error);
      throw new ServiceUnavailableError('Failed to release payment');
    }
  }
  
  /**
   * Refund escrow to user
   * 
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Refund result
   */
  async refundEscrow(jobId) {
    try {
      logger.debug(`Refunding escrow for job ${jobId}`);
      
      // In a real implementation, refund escrow on blockchain
      // For now, use mock implementation
      const result = {
        id: jobId,
        status: 'refunded',
        refunded_at: Date.now()
      };
      
      // Record transaction for user
      // In a real implementation, get the actual amount and user ID
      await databaseService.recordTransaction({
        user_id: 'user_1', // This would come from the job
        type: 'refund',
        amount: 0.001, // This would be the actual amount
        job_id: jobId
      });
      
      return result;
    } catch (error) {
      logger.error(`Error refunding escrow for job ${jobId}:`, error);
      throw new ServiceUnavailableError('Failed to refund escrow');
    }
  }
  
  /**
   * Estimate input tokens for a job
   * 
   * @param {Object} jobData - Job data
   * @returns {number} - Estimated token count
   * @private
   */
  _estimateInputTokens(jobData) {
    // Simple estimation based on input type
    if (jobData.messages) {
      // Chat completion
      return jobData.messages.reduce((total, message) => {
        return total + Math.ceil((message.content?.length || 0) / 4);
      }, 20); // Base overhead
    } else if (jobData.prompt) {
      // Text completion
      return Math.ceil((jobData.prompt?.length || 0) / 4);
    } else if (jobData.input) {
      // Embedding
      if (Array.isArray(jobData.input)) {
        return jobData.input.reduce((total, text) => {
          return total + Math.ceil((text?.length || 0) / 4);
        }, 0);
      } else {
        return Math.ceil((jobData.input?.length || 0) / 4);
      }
    }
    
    // Default
    return 10;
  }
}

// Export singleton instance
module.exports = new PaymentService();
