import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/app/core', '<rootDir>/app/utils'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
    }],
    // Generated Jison output appends `export default`; compile for Jest (CommonJS).
    '^.*parser/mips\\.js$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
    }],
  },
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/app/$1',
  },
};

export default config;
