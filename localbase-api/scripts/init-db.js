#!/usr/bin/env node

/**
 * LocalBase API Gateway
 * Database initialization script
 */

require('dotenv').config();
const { runMigrations } = require('../src/db/migrate');
const logger = require('../src/utils/logger');

async function initializeDatabase() {
  try {
    logger.info('Initializing database');
    
    // Run migrations
    await runMigrations();
    
    logger.info('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
