// @ts-check
import eslintConfig from '@example/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig(...eslintConfig.node, {
  ignores: ['apps', 'packages', 'libs'],
});
