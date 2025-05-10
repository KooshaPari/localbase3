/**
 * LocalBase API Gateway
 * Database migration runner
 */

const fs = require('fs');
const path = require('path');
const supabase = require('../services/supabase');
const logger = require('../utils/logger');

/**
 * Run all migrations
 * 
 * @returns {Promise<void>}
 */
async function runMigrations() {
  try {
    logger.info('Starting database migrations');
    
    // Create migrations table if it doesn't exist
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    });
    
    if (tableError) {
      throw tableError;
    }
    
    // Get applied migrations
    const { data: appliedMigrations, error: queryError } = await supabase
      .from('migrations')
      .select('name')
      .order('id', { ascending: true });
    
    if (queryError) {
      throw queryError;
    }
    
    const appliedMigrationNames = appliedMigrations.map(m => m.name);
    
    // Get migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    // Run pending migrations
    for (const file of migrationFiles) {
      const migrationName = path.basename(file, '.js');
      
      if (appliedMigrationNames.includes(migrationName)) {
        logger.info(`Migration ${migrationName} already applied, skipping`);
        continue;
      }
      
      logger.info(`Applying migration: ${migrationName}`);
      
      // Import and run migration
      const migration = require(path.join(migrationsDir, file));
      await migration.runMigration();
      
      // Record migration
      const { error: insertError } = await supabase
        .from('migrations')
        .insert({ name: migrationName });
      
      if (insertError) {
        throw insertError;
      }
      
      logger.info(`Migration ${migrationName} applied successfully`);
    }
    
    logger.info('Database migrations completed');
  } catch (error) {
    logger.error('Error running migrations:', error);
    throw error;
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration process completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runMigrations
};
