import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { prettier },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: true,
        tsconfigRootDir: new URL(".", import.meta.url).pathname,
      }
    },
    rules: {
      // @ts-expect-error Prettier flat config typing incomplete
      ...prettier.configs.recommended.rules,
    }
  },
  eslintConfigPrettier,
]);
