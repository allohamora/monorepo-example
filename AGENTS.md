# AGENTS.md

## Overview

This repository is an example project that demonstrates a practical npm monorepo built on Turborepo:

- `apps/` contains runnable applications such as SPAs, APIs, servers, or other client-facing surfaces.
- `libs/` contains shared runtime libraries used by multiple apps.
- `packages/` contains shared configuration, tooling, and other reusable setup that is not an app and not a runtime library.

## Instructions

- Install new dependencies by npm install commands; do NOT manually edit package.json or package-lock.json.
- Write comments only when necessary to clarify complex logic; prefer self-documenting code.
- Use `context7` mcp tools to get latest docs of the libraries before using them.
- Use `for...of` loops instead of `forEach` for better performance and readability.
- Avoid single-letter or one-word variable names; use descriptive names that clearly indicate purpose (e.g., `task` instead of `t`, `words` instead of `w`).
- Do NOT use the non-null assertion operator (`!`) in TypeScript; instead, use proper type guards, optional chaining, or refactor to handle null/undefined cases explicitly.
- After changes, update tests and docs when needed to keep behavior and documentation aligned.
