const getComponentTestConfig = require('@chauhaidang/xq-test-utils/jest.component.config');

module.exports = getComponentTestConfig({
  rootDir: './',
  testMatch: ['<rootDir>/test/component/workflows/**/*.test.ts'],
  setupPath: '<rootDir>/test/component/setup.ts',
  teardownPath: '<rootDir>/test/component/teardown.ts',
  helpersPath: '<rootDir>/test/component/helpers',
  tsconfigPath: '<rootDir>/tsconfig.json',
  testTimeout: 60000,
  displayName: 'Component Tests',
});
