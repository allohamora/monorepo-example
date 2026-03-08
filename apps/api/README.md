# `@example/api`

Minimal Hono API for the monorepo starter.

## Goal

This package exists to provide a tiny Node-based API that demonstrates the intended dependency direction in the repo:

- `apps/api` can use runtime utilities from `@example/shared`
- `apps/client` can consume the typed API contract from `@example/api/app`

The current API intentionally stays small so the architecture is obvious.

## Current Behavior

- Exposes a single route: `GET /ping`
- Builds the ping response with a shared utility from `@example/shared`
- Exports the Hono app type through `@example/api/app` so the client can build a typed API client

## Intentional Constraints

- The server runs on hardcoded port `3000`
- The hardcoded port is acceptable in this starter and should not be generalized unless a task explicitly asks for configuration work
- Internal source imports should use the local `#src/*.ts` alias

## Commands

- `npm run dev`
- `npm test`
- `npm run lint`
- `npm run typecheck`
