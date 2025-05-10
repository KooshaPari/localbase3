/**
 * LocalBase API Gateway
 * Configuration manager
 */

const defaultConfig = require('./default');

// Load environment-specific configuration
let envConfig = {};
try {
  envConfig = require(`./${process.env.NODE_ENV}`);
} catch (error) {
  // No environment-specific config found, use defaults
  console.log(`No configuration found for environment: ${process.env.NODE_ENV}, using defaults`);
}

// Merge configurations
const config = {
  ...defaultConfig,
  ...envConfig
};

module.exports = config;
