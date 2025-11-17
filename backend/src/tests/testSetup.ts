import { config } from '@/config';

export function setupTestEnvironment(): void {
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '1433';
  process.env.DB_USER = 'sa';
  process.env.DB_PASSWORD = 'test_password';
  process.env.DB_NAME = 'stockbox_test';
  process.env.DB_ENCRYPT = 'false';
}

export function teardownTestEnvironment(): void {
  // Cleanup logic here
}
