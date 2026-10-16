const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  prettier,
  { ignores: ['.codegraph/**', 'coverage/**', 'dist/**', 'artifacts/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    languageOptions: { globals: { test: 'readonly', expect: 'readonly' } },
  },
]);
