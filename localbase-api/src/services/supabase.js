/**
 * LocalBase API Gateway
 * Supabase client service
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const logger = require('../utils/logger');

// Create Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

logger.info('Supabase client initialized');

module.exports = supabase;
