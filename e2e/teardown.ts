/**
 * Global teardown for E2E tests
 * Runs after all tests complete
 */

import {logger, generateMarkdownFromJunit} from '@chauhaidang/xq-js-common-kit';
import fs from "fs";
import {writeFileSync} from "node:fs";

export default async (): Promise<void> => {
    logger.info('🧹 E2E-Teardown: Running global teardown');
    const xmlContent = fs.readFileSync('./tsr/junit.xml', 'utf8')
    const markdown = await generateMarkdownFromJunit(xmlContent)
    writeFileSync('./tsr/report.md', markdown);
    logger.info('✅ E2E-Teardown: Global teardown complete');
};