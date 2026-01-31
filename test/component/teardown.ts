/**
 * Global teardown for Component tests
 * Runs after all tests complete
 */

import { logger, generateMarkdownFromJunit } from '@chauhaidang/xq-js-common-kit';
import fs from 'fs';
import { writeFileSync } from 'node:fs';

/** Markdown section with detailed description of Exercise CRUD component tests */
function getExerciseTestDetailSection(): string {
  return `---

## Exercise CRUD – test detail

| # | Test | Endpoint | Method | Request / behaviour | Expected response | Assertions |
|---|------|----------|--------|---------------------|-------------------|-------------|
| 1 | Create exercise | \`/api/v1/exercises\` | POST | \`workoutDayId\`, \`muscleGroupId\`, \`exerciseName\`, \`totalReps\`, \`weight\`, \`totalSets\` (e.g. Bench Press, 30 reps, 135 lb, 3 sets) | 201 Created, body includes \`id\` | \`id\`, \`workoutDayId\`, \`muscleGroupId\`, \`exerciseName\`, \`totalReps\`, \`weight\`, \`totalSets\` match |
| 2 | Get exercise by ID | \`/api/v1/exercises/:id\` | GET | Valid \`id\` from create | 200 OK | \`id\`, \`exerciseName\`, \`totalReps\`, \`weight\`, \`totalSets\` match created |
| 3 | Update exercise (partial) | \`/api/v1/exercises/:id\` | PUT | \`totalReps\`, \`weight\` only; \`exerciseName\`, \`totalSets\` unchanged | 200 OK | \`totalReps\`, \`weight\` updated; \`exerciseName\`, \`totalSets\` preserved |
| 4 | Delete exercise | \`/api/v1/exercises/:id\` | DELETE | Valid \`id\` | 204 No Content | Subsequent GET \`/exercises/:id\` fails (404) |

**Setup per test:** Each test creates a routine → workout day → exercise (except delete, which deletes the created exercise). All resources are tracked and cleaned up in \`afterEach\`.
`;
}

export default async (): Promise<void> => {
  logger.info('🧹 Component-Teardown: Running global teardown');

  // Close database connection pool to prevent Jest from hanging
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- dynamic require for optional DB teardown
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
    const exerciseDetail = getExerciseTestDetailSection();
    writeFileSync('./test/component/tsr/report.md', markdown + '\n\n' + exerciseDetail);
  } catch (error) {
    logger.warn('⚠️ Could not generate test report:', error);
  }

  logger.info('✅ Component-Teardown: Global teardown complete');
};
