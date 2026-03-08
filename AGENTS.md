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

## Instructions

- Install new dependencies by npm install commands; do NOT manually edit package.json or package-lock.json.
- Write comments only when necessary to clarify complex logic; prefer self-documenting code.
- Use `context7` mcp tools to get latest docs of the libraries before using them.
- Use `for...of` loops instead of `forEach` for better performance and readability.
- Avoid single-letter or one-word variable names; use descriptive names that clearly indicate purpose (e.g., `task` instead of `t`, `words` instead of `w`).
- Do NOT use the non-null assertion operator (`!`) in TypeScript; instead, use proper type guards, optional chaining, or refactor to handle null/undefined cases explicitly.
- After changes, update tests and docs when needed to keep behavior and documentation aligned.
