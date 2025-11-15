/**
 * Global setup for E2E tests
 * Configures PactumJS and waits for API to be ready
 */

import pactum from 'pactum';
import waitOn from 'wait-on';
import { logger } from '@chauhaidang/xq-js-common-kit';

// Get base URL from environment or use default
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/xq-fitness-write-service/api/v1';
const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:8080/xq-fitness-write-service/health';

// Configure PactumJS
pactum.request.setBaseUrl(BASE_URL);
pactum.request.setDefaultTimeout(30000); // 30 seconds default timeout

// Configure retry for transient failures
pactum.handler.addSpecHandler('withRetry', (ctx) => {
  const { spec } = ctx;
  spec.retry({
    count: 3,
    delay: 1000,
    strategy: 'linear',
    status: [503, 502, 500], // Retry on server errors
  });
});

// Add global request/response logging
pactum.reporter.add({
  afterSpec(spec: any) {
    const req = spec.request;
    const res = spec.response;

    // Log request
    logger.info(`→ REQUEST: ${req.method} ${req.url}`);
    if (req.body) {
      logger.debug(`  Body: ${JSON.stringify(req.body, null, 2)}`);
    }

    // Log response
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    logger[logLevel](`← RESPONSE: ${res.statusCode}`);
    if (res.body) {
      logger.debug(`  Body: ${JSON.stringify(res.body, null, 2)}`);
    }
  },
});

// Global setup - runs once before all tests
beforeAll(async () => {
  logger.info('🚀 Starting E2E test suite');
  logger.info(`Base URL: ${BASE_URL}`);
  logger.info(`Health Check URL: ${HEALTH_CHECK_URL}`);

  try {
    // Wait for API to be ready
    logger.info('⏳ Waiting for API server to be ready...');
    await waitOn({
      resources: [HEALTH_CHECK_URL],
      timeout: 30000, // 30 seconds
      interval: 1000, // Check every second
    });
    logger.info('✅ API server is ready');
  } catch (error) {
    logger.error('❌ API server failed to start within timeout');
    logger.error(`Error: ${error}`);
    throw error;
  }
});

// Global teardown marker - runs after all tests
afterAll(() => {
  logger.info('🏁 E2E test suite completed');
});