# monorepo-example

An example npm workspace monorepo built on Turborepo. The current setup is intentionally small, but it is organized the same way a larger multi-app repository would be.

## Repository Structure

- `apps/`: runnable products and entrypoints such as SPAs, APIs, servers, or future clients
- `libs/`: shared runtime code used across apps instead of duplicating the same logic
- `packages/`: shared tooling, configuration, and setup that is not runtime application code

## What's Inside

- `apps/api`: a Hono API running on Node
- `apps/client`: a Vite React SPA
- `libs/shared`: shared runtime utilities used across apps
- `packages/eslint-config`: shared ESLint config
- `packages/prettier-config`: shared Prettier config
- `packages/tsconfig`: shared TypeScript config
