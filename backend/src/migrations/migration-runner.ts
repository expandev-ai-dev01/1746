/**
 * Database Migration Runner
 *
 * Automatically runs database migrations on application startup.
 * This module executes SQL scripts from the migrations folder to set up
 * or update the database schema without requiring external tools.
 */

import sql from 'mssql';
import * as fs from 'fs/promises';
import * as path from 'path';

interface MigrationConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  encrypt: boolean;
}

interface MigrationRecord {
  id: number;
  filename: string;
  executed_at: Date;
  checksum: string;
}

export class MigrationRunner {
  private config: sql.config;
  private migrationsPath: string;

  constructor(config: MigrationConfig, migrationsPath: string = './migrations') {
    this.config = {
      server: config.server,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      options: {
        encrypt: config.encrypt,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    };
    this.migrationsPath = path.resolve(migrationsPath);
  }

  /**
   * Initialize migration tracking table
   */
  private async initializeMigrationTable(pool: sql.ConnectionPool): Promise<void> {
    const createTableSQL = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'migrations' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE [dbo].[migrations] (
          [id] INT IDENTITY(1,1) PRIMARY KEY,
          [filename] NVARCHAR(255) NOT NULL UNIQUE,
          [executed_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          [checksum] NVARCHAR(64) NOT NULL
        );
        PRINT 'Migration tracking table created successfully';
      END
    `;

    await pool.request().query(createTableSQL);
    console.log('✓ Migration tracking table initialized');
  }

  /**
   * Get list of already executed migrations
   */
  private async getExecutedMigrations(pool: sql.ConnectionPool): Promise<Set<string>> {
    try {
      const result = await pool.request().query<MigrationRecord>(
        'SELECT filename FROM [dbo].[migrations] ORDER BY id'
      );
      return new Set(result.recordset.map(r => r.filename));
    } catch (error) {
      console.log('No previous migrations found');
      return new Set();
    }
  }

  /**
   * Calculate checksum for migration file
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Record migration execution
   */
  private async recordMigration(
    pool: sql.ConnectionPool,
    filename: string,
    checksum: string
  ): Promise<void> {
    await pool.request()
      .input('filename', sql.NVarChar(255), filename)
      .input('checksum', sql.NVarChar(64), checksum)
      .query(`
        INSERT INTO [dbo].[migrations] (filename, checksum)
        VALUES (@filename, @checksum)
      `);
  }

  /**
   * Execute a single migration file
   */
  private async executeMigration(
    pool: sql.ConnectionPool,
    filename: string,
    content: string
  ): Promise<void> {
    console.log(`\n→ Executing migration: ${filename}`);

    // Split by GO statements (SQL Server batch separator)
    const batches = content
      .split(/^\s*GO\s*$/im)
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);

    console.log(`  Found ${batches.length} SQL batches to execute`);

    for (let i = 0; i < batches.length; i++) {
      try {
        await pool.request().query(batches[i]);
        console.log(`  ✓ Batch ${i + 1}/${batches.length} executed`);
      } catch (error: any) {
        console.error(`  ✗ Batch ${i + 1}/${batches.length} failed:`);
        console.error(`    ${error.message}`);
        throw new Error(`Migration ${filename} failed at batch ${i + 1}: ${error.message}`);
      }
    }

    const checksum = this.calculateChecksum(content);
    await this.recordMigration(pool, filename, checksum);
    console.log(`✓ Migration ${filename} completed successfully`);
  }

  /**
   * Get all migration files sorted by name
   */
  private async getMigrationFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(f => f.endsWith('.sql'))
        .sort(); // Sort alphabetically (assuming timestamp prefix)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn(`⚠️  Migrations directory not found: ${this.migrationsPath}`);
        console.warn(`   This is normal if no database migrations were generated.`);
      } else {
        console.error(`Error reading migrations directory: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    console.log('\n========================================');
    console.log('DATABASE MIGRATION RUNNER');
    console.log('========================================\n');

    let pool: sql.ConnectionPool | null = null;

    try {
      console.log('→ Connecting to database...');
      pool = await sql.connect(this.config);
      console.log('✓ Database connection established\n');

      // Initialize migration tracking
      await this.initializeMigrationTable(pool);

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations(pool);
      console.log(`→ Found ${executedMigrations.size} previously executed migrations\n`);

      // Get all migration files
      const migrationFiles = await this.getMigrationFiles();
      console.log(`→ Found ${migrationFiles.length} migration files\n`);

      if (migrationFiles.length === 0) {
        console.log('✓ No migrations to run\n');
        return;
      }

      // Execute pending migrations
      const pendingMigrations = migrationFiles.filter(f => !executedMigrations.has(f));

      if (pendingMigrations.length === 0) {
        console.log('✓ Database is up to date - no pending migrations\n');
        return;
      }

      console.log(`→ Running ${pendingMigrations.length} pending migrations...\n`);

      for (const filename of pendingMigrations) {
        const filePath = path.join(this.migrationsPath, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        await this.executeMigration(pool, filename, content);
      }

      console.log('\n========================================');
      console.log('✓ ALL MIGRATIONS COMPLETED SUCCESSFULLY');
      console.log('========================================\n');

    } catch (error: any) {
      console.error('\n========================================');
      console.error('✗ MIGRATION FAILED');
      console.error('========================================');
      console.error(`Error: ${error.message}\n`);
      throw error;
    } finally {
      if (pool) {
        await pool.close();
        console.log('→ Database connection closed\n');
      }
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const pool = await sql.connect(this.config);
      await pool.close();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Initialize and run migrations from environment variables
 */
export async function runDatabaseMigrations(options?: {
  skipIfNoNewMigrations?: boolean;
  logLevel?: 'silent' | 'minimal' | 'verbose';
}): Promise<void> {
  const skipIfNoNewMigrations = options?.skipIfNoNewMigrations ?? true;
  const logLevel = options?.logLevel ?? 'minimal';

  // Skip migrations entirely if disabled via environment variable
  if (process.env.SKIP_MIGRATIONS === 'true') {
    if (logLevel !== 'silent') {
      console.log('ℹ️  Migrations skipped (SKIP_MIGRATIONS=true)');
    }
    return;
  }

  // Validate required environment variables
  const requiredEnvVars = ['DB_SERVER', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    const error = `Missing required database environment variables: ${missingVars.join(', ')}`;
    console.error('❌ Migration Configuration Error:');
    console.error(`   ${error}`);
    console.error('\n   Please ensure the following environment variables are configured in Azure App Service:');
    console.error('   - DB_SERVER (e.g., your-server.database.windows.net)');
    console.error('   - DB_NAME (e.g., your-database)');
    console.error('   - DB_USER (e.g., your-admin-user)');
    console.error('   - DB_PASSWORD (your database password)');
    console.error('   - DB_PORT (optional, defaults to 1433)');
    console.error('   - DB_ENCRYPT (optional, defaults to false)\n');
    throw new Error(error);
  }

  const config: MigrationConfig = {
    server: process.env.DB_SERVER!,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    encrypt: process.env.DB_ENCRYPT === 'true'
  };

  // Migrations are located in the root 'migrations' folder of the backend
  // When running from dist/, we need to go up to project root and find migrations
  // When running from src/, same thing
  const migrationsPath = process.env.MIGRATIONS_PATH || path.join(__dirname, '../../migrations');

  const runner = new MigrationRunner(config, migrationsPath);

  // Quick check: if skipIfNoNewMigrations is true, check if there are new migrations first
  if (skipIfNoNewMigrations) {
    const migrationFiles = await runner['getMigrationFiles']();

    if (migrationFiles.length === 0) {
      if (logLevel === 'verbose') {
        console.log('✓ No migration files found - skipping migration check');
      }
      return;
    }

    // Quick connection test and count check
    try {
      const pool = await sql.connect(config);

      // Check if migrations table exists
      const tableCheck = await pool.request().query(`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'migrations'
      `);

      if (tableCheck.recordset[0].count > 0) {
        // Table exists, check count
        const countResult = await pool.request().query(
          'SELECT COUNT(*) as count FROM [dbo].[migrations]'
        );
        const executedCount = countResult.recordset[0].count;

        if (executedCount >= migrationFiles.length) {
          // All migrations already executed
          if (logLevel !== 'silent') {
            console.log('✓ Database migrations up to date (no pending migrations)');
          }
          await pool.close();
          return;
        }
      }

      await pool.close();
    } catch (error) {
      // If quick check fails, fall through to full migration run
      if (logLevel === 'verbose') {
        console.log('→ Quick migration check failed, running full migration process...');
      }
    }
  }

  // Run full migration process
  await runner.runMigrations();
}
