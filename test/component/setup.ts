/**
 * Global setup for Component tests
 * Waits for API to be ready before running tests
 */

import { waitForService } from '@chauhaidang/xq-test-utils';
import { logger } from '@chauhaidang/xq-common-kit';

// Force local DB for component tests (override .env - xq-infra exposes DB on localhost:5432)
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'xq_fitness';
process.env.DB_USER = 'xq_user';
process.env.DB_PASSWORD = 'xq_password';

// Get base URL from environment or use default (test-env gateway entry point)
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/xq-fitness-write-service/api/v1';
const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:8080/xq-fitness-write-service/health';

// Global setup - runs once before all tests
beforeAll(async () => {
  logger.info('🚀 Starting Component test suite');
  logger.info(`Base URL: ${BASE_URL}`);
  logger.info(`Health Check URL: ${HEALTH_CHECK_URL}`);

  try {
    // Wait for API to be ready
    logger.info('⏳ Waiting for API server to be ready...');
    await waitForService(HEALTH_CHECK_URL, { timeout: 30000, interval: 1000 });
    logger.info('✅ API server is ready');
  } catch (error) {
    logger.error('❌ API server failed to start within timeout');
    logger.error(`Error: ${error}`);
    throw error;
  }
});

// Global teardown marker - runs after all tests
afterAll(() => {
  logger.info('🏁 Component test suite completed');
});
