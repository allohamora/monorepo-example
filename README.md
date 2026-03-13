# monorepo-example

An example npm workspace monorepo built on Turborepo with a focus on developer experience (DX) and best practices.

## Setup

- Modern TypeScript and Node.js setup, with `erasableSyntaxOnly` and direct Node.js execution of TypeScript entry files via `node src/index.ts`.
- TypeScript internal packages for the monorepo, using workspace package imports like `@example/shared` and `package.json` `imports` aliases such as `#src/*.ts`.
- Monorepo-aware dev and test tools, including `node --watch`, `node --test`, Vite, and Vitest.
- Affected workflows based on Turborepo, shown in [`.github/workflows/affected.yml`](.github/workflows/affected.yml).
- Docker packaging based on Turborepo pruning, shown in [`apps/api/Dockerfile`](apps/api/Dockerfile).
- Shared ESLint, Prettier, and TypeScript configuration, shown in `packages/eslint-config`, `packages/prettier-config`, and `packages/tsconfig`.
- `lint-staged` based pre-commit hook for applying format and lint changes across the monorepo, using the root config for root files and the nearest workspace config for app and package files based on their paths.
- Conventional commits enforced by the `commit-msg` hook with `commitlint`, using scopes like `feat(api):` for workspace-specific changes and `feat:` for repo-wide changes.
- Custom PR tags like `shared`, `api`, and `client` for better understanding of affected packages by the PR author.
- Monorepo code generation based on Plop, shown in the root `"generate:package"` script and [`plopfile.ts`](plopfile.ts).
- Running agents from the repo root, so tools like Claude Code keep their `.claude` state and permissions in one place instead of splitting them across workspaces.
- Package-local `AGENTS.md` / `CLAUDE.md` files act like skill-like local instructions for agents that automatically discover them when working in a directory or reading files under it.

## Release Versioning

This monorepo uses a single-version, lockstep versioning strategy. The root package and every workspace package share the same version, and each release bumps all package versions together even if only one part of the repo changed.

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
