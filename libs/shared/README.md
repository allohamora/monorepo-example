# `@example/shared`

Shared runtime utilities for the monorepo starter.

## Goal

This package exists to hold small runtime helpers that can be used by both the API and the client without duplicating logic.

## What Belongs Here

- Cross-runtime utilities that work in both Node and the browser
- Small shared helpers with no app-specific assumptions
- Public exports that other workspaces can consume through `@example/shared`

## What Does Not Belong Here

- Hono routing or server setup
- React components or browser-only UI logic
- Package-specific behavior that only one app needs

## Current Exports

- `getCurrentDate`

The public entrypoint currently re-exports from aliased source modules, and that pattern should stay in place as the package grows.

## Commands

- `npm run dev`
- `npm test`
- `npm run lint`
- `npm run typecheck`
