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
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXAttribute[name.name=/^(style|contentStyle|contentContainerStyle|labelStyle)$/] ObjectExpression',
          message:
            'Keep native styles in the adjacent *.styles.ts file; use named styles or a data-driven style function.',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    languageOptions: { globals: { test: 'readonly', expect: 'readonly' } },
  },
]);
