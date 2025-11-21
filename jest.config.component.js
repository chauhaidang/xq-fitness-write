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
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@helpers/(.*)$': '<rootDir>/test/component/helpers/$1',
  },
};
