/**
 * LocalBase API Gateway
 * Logging utility
 */

const config = require('../config');

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Get numeric level for configured log level
const configuredLevel = LOG_LEVELS[config.logLevel] || LOG_LEVELS.info;

/**
 * Simple logger implementation
 * In production, replace with Winston or other logging library
 */
const logger = {
  error: (...args) => {
    if (configuredLevel >= LOG_LEVELS.error) {
      console.error(formatLogMessage('ERROR', ...args));
    }
  },
  
  warn: (...args) => {
    if (configuredLevel >= LOG_LEVELS.warn) {
      console.warn(formatLogMessage('WARN', ...args));
    }
  },
  
  info: (...args) => {
    if (configuredLevel >= LOG_LEVELS.info) {
      console.info(formatLogMessage('INFO', ...args));
    }
  },
  
  debug: (...args) => {
    if (configuredLevel >= LOG_LEVELS.debug) {
      console.debug(formatLogMessage('DEBUG', ...args));
    }
  }
};

/**
 * Format log message with timestamp and level
 */
function formatLogMessage(level, ...args) {
  const timestamp = new Date().toISOString();
  return [timestamp, `[${level}]`, ...args];
}

module.exports = logger;
