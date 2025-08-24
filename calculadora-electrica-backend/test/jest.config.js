import baseConfig from '../jest.config.js';

export default {
  ...baseConfig,
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/../src/$1',
  },
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          paths: {
            'src/*': ['src/*'],
          },
        },
      },
    ],
  },
};
