# `@example/client`

Minimal Vite and React client for the monorepo starter.

## Goal

This package exists to show how the frontend should consume the rest of the workspace:

- use shared runtime utilities from `@example/shared`
- use the typed Hono API contract from `@example/api/app`

The current UI is intentionally small so the dependency flow stays obvious.

## Current Behavior

- Renders a single ping-focused screen
- Uses `@example/shared` for a shared date label
- Uses a typed Hono client to call the API `ping` route

## Intentional Constraints

- The API base URL is hardcoded to `http://localhost:3000`
- That hardcoded URL is acceptable for this starter and should not be abstracted unless a task explicitly asks for configuration work
- The client should consume public workspace exports, not private `#src` aliases from other packages

## Commands

- `npm run dev`
- `npm test`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
