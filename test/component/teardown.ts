/**
 * Global teardown for Component tests
 * Runs after all tests complete
 */

import { logger, generateMarkdownFromJunit } from '@chauhaidang/xq-js-common-kit';
import fs from 'fs';
import { writeFileSync } from 'node:fs';

export default async (): Promise<void> => {
  logger.info('🧹 Component-Teardown: Running global teardown');
  
  // Close database connection pool to prevent Jest from hanging
  try {
    const db = require('../../src/config/database');
    if (db.close) {
      await db.close();
      logger.info('✅ Database connection pool closed');
    }
  } catch (error) {
    logger.warn('⚠️ Could not close database pool:', error);
  }
  
  // Generate test report
  try {
    const xmlContent = fs.readFileSync('./test/component/tsr/junit.xml', 'utf8');
    const markdown = await generateMarkdownFromJunit(xmlContent);
    writeFileSync('./test/component/tsr/report.md', markdown);
  } catch (error) {
    logger.warn('⚠️ Could not generate test report:', error);
  }
  
  logger.info('✅ Component-Teardown: Global teardown complete');
};
