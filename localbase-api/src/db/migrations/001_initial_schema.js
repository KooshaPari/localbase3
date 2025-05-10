/**
 * LocalBase API Gateway
 * Initial database migration
 */

const fs = require('fs');
const path = require('path');
const supabase = require('../../services/supabase');
const logger = require('../../utils/logger');

/**
 * Run the initial database migration
 * 
 * @returns {Promise<void>}
 */
async function runMigration() {
  try {
    logger.info('Running initial database migration');
    
    // Read schema SQL
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split SQL into statements
    const statements = schemaSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        throw error;
      }
    }
    
    logger.info('Initial database migration completed successfully');
  } catch (error) {
    logger.error('Error running initial database migration:', error);
    throw error;
  }
}

module.exports = {
  runMigration
};
