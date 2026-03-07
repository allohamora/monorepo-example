// @ts-check
import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';

const base = defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  { ignores: ['node_modules', 'dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { project: true } },
    rules: {
      'no-undef': 'error',
      'object-shorthand': 'warn',
      'no-async-promise-executor': 'warn',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-deprecated': 'error',
    },
  },
);

const node = defineConfig(...base, {
  files: ['**/*.{ts,tsx}'],
  languageOptions: { globals: globals.node },
});

export default { base, node };
