/**
 * LocalBase API Gateway
 * Database connection service
 */

const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB
 * 
 * @returns {Promise} - MongoDB connection
 */
async function connect() {
  try {
    logger.info(`Connecting to MongoDB at ${config.database.uri}...`);
    
    // Set mongoose options
    mongoose.set('strictQuery', true);
    
    // Connect to MongoDB
    await mongoose.connect(config.database.uri, config.database.options);
    
    logger.info('Connected to MongoDB successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to application termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

/**
 * Initialize database with seed data
 * Only used in development environment
 */
async function initializeDevData() {
  if (config.environment !== 'development') {
    return;
  }
  
  const { User, ApiKey } = require('../models');
  
  try {
    // Check if we already have a test user
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (!existingUser) {
      logger.info('Initializing development data...');
      
      // Create test user
      const testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        active: true,
        tier: 'basic',
        balance: 100
      });
      
      await testUser.save();
      
      // Create test API key
      const apiKey = new ApiKey({
        key: 'lb_sk_test123456789',
        user: testUser._id,
        name: 'Test API Key'
      });
      
      await apiKey.save();
      
      logger.info('Development data initialized successfully');
    }
  } catch (error) {
    logger.error('Error initializing development data:', error);
  }
}

module.exports = {
  connect,
  initializeDevData
};
