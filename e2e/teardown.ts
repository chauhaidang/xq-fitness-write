/**
 * Global teardown for E2E tests
 * Runs after all tests complete
 */

import { logger } from '@chauhaidang/xq-js-common-kit';

export default async (): Promise<void> => {
  logger.info('🧹 E2E-Teardown: Running global teardown');

  // Add any global cleanup logic here if needed
  // For example: closing database connections, cleaning up test data, etc.

  logger.info('✅ E2E-Teardown: Global teardown complete');
};