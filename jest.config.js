module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  clearMocks: true,
  moduleNameMapper: { '^@/assets/(.*)$': '<rootDir>/assets/$1', '^@/(.*)$': '<rootDir>/src/$1' },
};
