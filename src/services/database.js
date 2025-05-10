/**
 * LocalBase API Gateway
 * Database service
 */

const crypto = require('crypto');
const logger = require('../utils/logger');
const { ServiceUnavailableError } = require('../utils/errors');

/**
 * In-memory database (replace with MongoDB in production)
 */
const db = {
  users: new Map(),
  apiKeys: new Map(),
  transactions: []
};

/**
 * Database service
 * Handles data storage and retrieval
 */
class DatabaseService {
  constructor() {
    // Initialize with some mock data
    this._initializeMockData();
    
    logger.info('Database service initialized');
  }
  
  /**
   * Find user by ID
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async findUserById(userId) {
    try {
      return db.users.get(userId) || null;
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
      const userId = db.apiKeys.get(apiKey);
      
      if (!userId) {
        return null;
      }
      
      return this.findUserById(userId);
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
      const userId = userData.id || `user_${crypto.randomBytes(8).toString('hex')}`;
      
      const user = {
        id: userId,
        name: userData.name,
        email: userData.email,
        active: userData.active !== false,
        tier: userData.tier || 'basic',
        balance: userData.balance || 0,
        created_at: Date.now()
      };
      
      db.users.set(userId, user);
      
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
   * @returns {Promise<string>} - API key
   */
  async createApiKey(userId) {
    try {
      const user = await this.findUserById(userId);
      
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      
      // Generate API key
      const apiKey = `lb_sk_${crypto.randomBytes(16).toString('hex')}`;
      
      // Store API key
      db.apiKeys.set(apiKey, userId);
      
      return apiKey;
    } catch (error) {
      logger.error(`Error creating API key for user ${userId}:`, error);
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
      const user = await this.findUserById(userId);
      
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      
      user.balance = newBalance;
      db.users.set(userId, user);
      
      return user;
    } catch (error) {
      logger.error(`Error updating balance for user ${userId}:`, error);
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
      const transaction = {
        id: `tx_${crypto.randomBytes(8).toString('hex')}`,
        ...transactionData,
        timestamp: transactionData.timestamp || Date.now()
      };
      
      db.transactions.push(transaction);
      
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
      let transactions = db.transactions.filter(tx => tx.user_id === userId);
      
      // Apply filters
      if (filters.type) {
        transactions = transactions.filter(tx => tx.type === filters.type);
      }
      
      // Sort by timestamp (descending)
      transactions.sort((a, b) => b.timestamp - a.timestamp);
      
      // Apply pagination
      const limit = filters.limit || 100;
      const offset = filters.offset || 0;
      
      return transactions.slice(offset, offset + limit);
    } catch (error) {
      logger.error(`Error getting transactions for user ${userId}:`, error);
      throw new ServiceUnavailableError('Database error');
    }
  }
  
  /**
   * Initialize mock data
   * 
   * @private
   */
  _initializeMockData() {
    // Create test user
    const testUser = {
      id: 'user_1',
      name: 'Test User',
      email: 'test@example.com',
      active: true,
      tier: 'basic',
      balance: 100,
      created_at: Date.now() - 86400000 // 1 day ago
    };
    
    db.users.set(testUser.id, testUser);
    
    // Create test API key
    db.apiKeys.set('lb_sk_test123456789', testUser.id);
    
    logger.debug('Mock data initialized');
  }
}

// Export singleton instance
module.exports = new DatabaseService();
