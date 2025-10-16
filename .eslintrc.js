module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    browser: true,
  },
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-console': 'warn',
  },
  overrides: [
    {
      files: ['packages/api/**/*.spec.ts', 'packages/api/**/*.test.ts'],
      env: {
        jest: true,
        node: true,
      },
    },
    {
      files: ['packages/web/**/*.test.tsx', 'packages/web/**/*.test.ts'],
      env: {
        browser: true,
        es2022: true,
      },
      globals: {
        React: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
    {
      files: ['packages/web/**/*.tsx'],
      env: {
        browser: true,
        es2022: true,
      },
      globals: {
        React: 'readonly',
        NodeJS: 'readonly',
        KeyType: 'readonly',
        KeyUsage: 'readonly',
      },
    },
    {
      files: ['packages/web/src/utils/crypto.ts'],
      globals: {
        KeyType: 'readonly',
        KeyUsage: 'readonly',
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'build/', 'node_modules/', '*.js'],
};
