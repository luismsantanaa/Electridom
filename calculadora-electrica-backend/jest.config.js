export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/test/**',
    '!**/scripts/**',
    '!**/migrations/**',
    '!**/seeds/**',
    '!**/main.ts',
    '!**/index.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 30,
      lines: 40,
      statements: 40,
    },
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/jest.setup.js'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 30000,
};
