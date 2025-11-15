import type { Config } from 'jest';

const config: Config = {
  displayName: 'E2E Workflow Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  testMatch: ['<rootDir>/workflows/**/*.test.ts'],
  testTimeout: 60000, // 60 seconds for workflow tests
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  globalTeardown: '<rootDir>/teardown.ts',
  maxWorkers: 1, // Serial execution for E2E
  verbose: true,
  bail: false, // Continue on first failure
  collectCoverageFrom: [],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^@helpers/(.*)$': '<rootDir>/helpers/$1',
  },
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-reports',
      outputName: 'e2e-workflows-junit.xml',
    }],
  ],
};

export default config;