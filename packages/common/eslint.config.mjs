import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { prettier, 'simple-import-sort': simpleImportSort },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: true,
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
      },
    },
    rules: {
      // @ts-expect-error Prettier flat config typing incomplete
      ...prettier.configs.recommended.rules,
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  eslintConfigPrettier,
]);
