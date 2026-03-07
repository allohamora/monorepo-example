import eslintConfig from '@example/eslint-config'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...eslintConfig.base,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { project: ['./tsconfig.app.json', './tsconfig.node.json'], tsconfigRootDir: import.meta.dirname },
    },
  },
])
