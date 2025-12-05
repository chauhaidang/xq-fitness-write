module.exports = {
  displayName: 'Component Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  testMatch: ['<rootDir>/test/component/workflows/**/*.test.ts'],
  testTimeout: 60000, // 60 seconds for component tests
  setupFilesAfterEnv: ['<rootDir>/test/component/setup.ts'],
  globalTeardown: '<rootDir>/test/component/teardown.ts',
  maxWorkers: 1, // Serial execution for component tests
  verbose: true,
  bail: false,
  collectCoverageFrom: [],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // ts-jest configuration (v29+ syntax)
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        // Optional: enable faster compilation (disables type checking during tests)
        // isolatedModules: true,
        // Optional: show TypeScript diagnostics
        // diagnostics: {
        //   warnOnly: true, // Show warnings instead of errors
        // },
      },
    ],
  },
  moduleNameMapper: {
    '^@helpers/(.*)$': '<rootDir>/test/component/helpers/$1',
  },
};
