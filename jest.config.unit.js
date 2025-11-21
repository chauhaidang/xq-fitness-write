module.exports = {
  displayName: 'Unit Tests',
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  collectCoverageFrom: ['src/**/*.js', '!src/index.js', '!src/config/database.js'],
  testMatch: ['**/test/unit/**/*.test.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
