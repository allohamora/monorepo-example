# How to build a convenient typescript full-stack monorepo

Hi, my name is Herman. Over the years I have seen many teams set up a full-stack monorepo, get it working, and then spend the rest of the project patching rough edges, adding hacks, or delaying improvements because they turn out to be too painful to make. After enough of that, the conclusion is often simple: a monorepo is not worth it.

I do not think the monorepo itself is usually the problem. More often, the problem is a setup that was put together quickly and never made convenient for day-to-day work. In this article, I want to show the approach I use to keep a full-stack monorepo smooth, practical, and close to normal application development.

I am writing this for engineers who want one repository for `client`, `api`, and `shared` typescript code, but do not want the workflow to feel heavier every few months. I will use my own repository as the example, not as a universal template, but as a concrete demonstration of the decisions that keep a monorepo convenient for me.

## Why I choose a monorepo for full-stack work

I do not think every full-stack application should live in a monorepo. If `api` and `client` fit naturally inside one framework like `astro`, or if they barely depend on each other, a monorepo may be unnecessary.

But I often build systems where `api` and `client` are tightly related while still needing to stay separate applications. I may want a dedicated `api` with its own runtime model and its own deployment. I may also need `websockets` or a `job queue`, which can be awkward to implement inside some full-stack frameworks. In those cases, a monorepo becomes a good middle ground.

It keeps the applications close enough to share contracts and runtime code, but it does not force everything into one structure shaped by a specific framework. In this repository, `api` is a `hono` app and `client` is a `react` app built with `vite`. The `client` can import types from `api` to make type-safe requests, and anything else that should be shared can live in the `shared` library.

The alternative is often more expensive than it seems at first. As soon as I split a tightly connected system into separate repositories, I usually need private package publishing, version coordination, and more complicated `ci`. In my experience, that often creates more problems than a monorepo, not fewer.

## What I actually want from a full-stack monorepo

Before I choose tools, I try to define what I actually want the repository to do for me. If I skip that step, it becomes too easy to keep adding features just because monorepo tools offer them.

For a full-stack typescript system, my baseline is fairly simple:

- Clear boundaries between runnable applications, shared runtime code, and tooling.
- The ability to run scripts from the repository root when that is convenient, while keeping each workspace useful on its own.
- Shared code without publishing internal packages or rebuilding them after every small change.
- Dev scripts that react naturally to changes in dependencies.
- `CI` that runs checks only where they matter.
- `Docker` images that include only what the target application needs.
- Git history and repository conventions that stay understandable for regular application developers.

This list matters because it changes how I evaluate tools. I am not looking for the most feature-rich monorepo setup. I am looking for the setup that solves these practical problems with the least extra ceremony.

## Simple workspace boundaries

The first thing I want from a monorepo is a structure that makes sense as soon as I open it, without any explanation. I do not want top-level folders whose meaning changes from project to project. I want boundaries that tell me what something is before I read its code.

That is why I use a very simple split:

```text
apps/
├── api
└── client

libs/
└── shared

packages/
├── eslint-config
├── prettier-config
└── tsconfig
```

`apps/` contains runnable applications. `libs/` contains shared runtime code. `packages/` contains tooling and shared configuration. This is not a revolutionary structure, but that is exactly why I like it. It scales well, it is easy to scan, and it keeps runtime code separate from tooling concerns.

At the package manager level, I keep the foundation just as simple. `npm` workspaces already give me what I need here: dependency resolution between workspaces, symlinked internal packages through `node_modules`, and root-level script execution.

```json
{
  "name": "@example/root",
  "private": true,
  "workspaces": ["apps/*", "libs/*", "packages/*"]
}
```

I know many teams prefer `pnpm` or `yarn`, and those tools can be excellent. This is not an argument that `npm` is universally better. It is simply my conclusion that for this repository, `npm` is already enough.

## Buildless typescript internal packages

The biggest choice in this setup is how I treat shared internal packages. A lot of monorepo discussions start from the assumption that they should be built first and then consumed as compiled output. That can be the right choice in some environments, but I do not want it by default.

For internal code that lives entirely inside one repository, I prefer the approach that `turborepo` documentation calls a [just-in-time internal package](https://turborepo.dev/docs/core-concepts/internal-packages#just-in-time-packages). In practice, that means the package points directly to typescript source files, and the rest of the toolchain consumes them without a separate build step.

```json
{
  "name": "@example/shared",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "imports": {
    "#src/*.ts": "./src/*.ts"
  }
}
```

This one decision removes a surprising amount of infrastructure code. I do not need a parallel watch process rebuilding the shared package. I do not need to worry about stale `dist/` output. I do not need to teach every tool how to follow build artifacts that exist only because the repo is a monorepo.

It also changes how I think about aliases. In this setup, I do not want typescript `paths` to be the main way internal packages are consumed. They can be fine in some application-level cases, but they are not the foundation I want for buildless internal packages.

If I insisted on aliases for internal packages, I would usually stop being truly buildless. I would need compiled output in `dist/`, package entrypoints pointing at that output, a typescript build step, and usually a post-build rewrite with something like `tsc-alias` so the compiled imports still resolve correctly.

After that, I would also need watch scripts for those packages. I could wire that through something like `turbo watch`, but the tradeoff would not look very attractive to me. In one version, the running dev process gets restarted more often than it needs to be. In another, I end up with a separate dependency rebuild loop running on every change while the app watcher keeps handling local files. Both versions can work, but neither one feels especially smooth.

If I wanted finer control, where only monorepo dependencies get rebuilt while local changes are still handled by the application's own watcher, I would probably end up writing a custom watch script on top of something like `turbowatch`. In practice, that can easily turn into a small internal scripts package and another layer of repo-specific logic.

Then the editor can become part of the problem too. After a few rebuilds, the typescript server can drift out of sync, so I either restart it manually or patch the setup with `references` without `composite` just to keep the ide aligned with the latest output.

That setup can be made to work, and for some repositories it may be the right tradeoff. I just do not want to choose that stack before I need it, especially when a buildless package plus node's `imports` already gives me a simpler path.

I am not saying compiled internal packages are wrong. If a package needs to run in an environment that cannot consume source directly, if it needs to be published outside the repo, or if the toolchain truly requires compiled output, then a build step is reasonable. My point is narrower: I do not want to pay that cost before I have a real reason.

## Why development stays smooth

The buildless package decision works because the runtime and tooling choices support it instead of fighting it.

This repository targets modern `node.js`, leans on `erasableSyntaxOnly`, and runs typescript entry files directly. The `api` package uses `node src/index.ts` for start and `node --watch src/index.ts` for development. The `shared` library is also source-first. In practice, that means I can change code in `@example/shared` and let normal tooling pick it up without a separate cycle of rebuilding the package, restarting the app, and resetting editor state.

The typescript configuration is intentionally aligned with that model:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "verbatimModuleSyntax": true,
    "strict": true,
    "erasableSyntaxOnly": true,
    "allowImportingTsExtensions": true,
    "rewriteRelativeImportExtensions": true,
    "module": "NodeNext",
    "noEmit": true
  }
}
```

For me, this is where the monorepo stops feeling special. `node` can run an `api` entry file that imports buildless internal packages without extra glue. `vite` and `vitest` can do the same during `client` development, so I do not need a separate monorepo-specific development mode layered on top of normal development.

This is also where the benefit of importing types from `api` shows up:

```ts
// apps/api/src/app.ts
export const app = new Hono().get('/ping', (c) => c.text(ping()));
export type App = typeof app;

// apps/client/src/api.ts
import { type App } from '@example/api/app';
import { hc } from 'hono/client';

const api = hc<App>('http://localhost:3000');

// somewhere in the client code
const res = await api.ping.$get();
console.log(await res.text());
```

If I break the server contract with an incompatible change, `client` can fail during typechecking instead of letting the mismatch survive until runtime. When something cannot or should not be exported directly from the server package, I move it into the `shared` library. That keeps the contract between applications close to the code that uses it.

## The conventions that make daily work smoother

These conventions are not only about runtime mechanics. They also make daily work smoother by reducing the number of decisions engineers have to make every day.

I keep shared `eslint`, `prettier`, and `typescript` configs in `packages/eslint-config`, `packages/prettier-config`, and `packages/tsconfig`, and I treat them like ordinary workspace packages.

`Prettier` is the simplest case. Each workspace adds `@example/prettier-config` and points its `prettier` field at it. `.prettierignore` cannot really be shared the same way, so I keep one at the root and duplicate it in each workspace.

```json5
// packages/prettier-config/src/index.json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 120
}

// apps/api/package.json
{
  "devDependencies": {
    "@example/prettier-config": "*"
  },
  "prettier": "@example/prettier-config"
}
```

`Eslint` is a little more layered, but still straightforward. I usually want the shared package to expose a few obvious building blocks such as `base` and `node`, while each workspace keeps a small local `eslint.config.mjs`. In this repo, `api` and `shared` can simply export `eslintConfig.node` as the default, while `client` builds on `eslintConfig.base` with browser, react hooks, and vite-specific rules.

```js
// packages/eslint-config/src/index.mjs
export const base = defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
);

// apps/client/eslint.config.mjs
export default defineConfig([...eslintConfig.base, reactHooks.configs.flat.recommended, reactRefresh.configs.vite]);
```

`Typescript` follows the same pattern, but the package shape is simpler. A shared `tsconfig` package usually just keeps files like `node.json` at the package root, then each workspace extends what it needs. In this repo, `api` and `shared` extend `@example/tsconfig/node.json`, while `client` keeps its own `tsconfig` files because `vite` has its own constraints.

```json5
// packages/tsconfig/node.json
{
  "compilerOptions": {
    "target": "esnext",
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "module": "NodeNext",
    "noEmit": true
  }
}

// apps/api/tsconfig.json
{
  "extends": "@example/tsconfig/node.json"
}
```

I apply the same thinking to commit hygiene. `husky` and `lint-staged` run fixes before commit, and the nearest config handles the staged files, so root files can stay on root rules while apps and libraries keep their own local setup. `apps`, `packages`, and `libs` are ignored for root checks, which keeps root formatting, linting, and typechecking focused on root files.

```bash
# .husky/pre-commit
npx --no-install lint-staged
```

```json5
// package.json
"lint-staged": {
  "*.{js,cjs,mjs,json,yml,md}": "prettier --write",
  "*.ts": "eslint --fix"
}

// apps/client/package.json
"lint-staged": {
  "*.{js,cjs,mjs,json,yml,md,html,css}": "prettier --write",
  "*.{ts,tsx}": "eslint --fix"
}
```

Conventional commits help for the same reason. In a monorepo, scopes are especially useful. A commit like `feat(api):` or `fix(client):` tells me which part of the system changed before I open the diff, while a plain `feat:` usually means the change is broader. The conventional commit format is covered by `commitlint` and `husky`, and consistent scopes pay off over time, especially when I need to generate a changelog. In this repo, `update:changelog` and the release flow in `scripts/release.ts` both benefit from that consistency.

```bash
# .husky/commit-msg
npx --no-install -- commitlint --edit "$1"
```

```json
// .commitlintrc.json
{
  "extends": ["@commitlint/config-conventional"]
}
```

I also find custom pull request labels like `shared`, `api`, or `client` useful, because they make it easier to scan and filter pull requests before I read the files.

I also keep versioning simple. This repository uses one lockstep version across the root package and all workspaces. I do not treat the apps, libraries, and config packages here as separate public products, so separate version streams would mostly add extra work.

## Where turborepo earns its place

`turborepo` is not the center of this setup, but it is useful in the places where monorepo-specific logic actually matters. I do not want it wrapping every workflow by default. I use it when I need graph awareness, cache awareness, or pruning, and I leave it out when a normal script is enough.

The clearest example is affected checks in `ci`. I want the repository to understand package relationships and run checks only where a change actually matters, and `turborepo` already handles that well enough that I do not see a reason to replace it with custom scripts to walk the dependency graph.

```yaml
# .github/workflows/affected.yml
env:
  # https://github.com/vercel/turborepo/issues/9320
  TURBO_SCM_BASE: ${{ github.event_name == 'pull_request' && github.event.pull_request.base.sha || github.event.before }}

steps:
  - run: npx turbo run format --affected
  - run: npx turbo run lint --affected
  - run: npx turbo run typecheck --affected
  - run: npx turbo run test --affected
```

I also need root-only tasks in `turbo.json` for checks that should react to root files such as `README.md`:

```json5
// turbo.json
"//#format": {
  "cache": false,
  "inputs": ["$TURBO_DEFAULT$", "!apps/**", "!libs/**", "!packages/**"]
}
```

In this repository, I set `TURBO_SCM_BASE` explicitly in `github actions` to help `turborepo` find the right comparison point when using `--affected`. Those root tasks are there so affected runs can include root files, not just workspace changes.

`Docker` is the other obvious example. `turbo prune` lets me build an image from only the code and dependencies the target application needs instead of pulling the whole repository into the build context. In this repo, the `Dockerfile` for `api` uses `turbo prune --scope=@example/api --docker` for exactly that reason. That is real value, not abstraction for its own sake.

This is also why I do not use `nx` here. I think it works well when a repository stays inside its model, but that comes with more abstraction and more magic. For this repo, I would rather stay closer to standard tools until I have a concrete reason to do otherwise.

## The extra quality-of-life pieces

Once the main workflow is stable, a few smaller choices make the repository nicer to live in.

One of them is code generation. A lot of monorepo work is repetitive: create a package, add scripts, wire shared configs, fill out the basic structure, and make sure no small detail gets missed. In this repo, I use `plop` for that through the root `generate:package` workflow. The same approach works anywhere the structure repeats, for example when creating a new microservice together with its `terraform` changes. It is not a core architectural piece, but it saves me from boring copy-paste mistakes.

Another is how I work with `ai` agents in the repository. In a monorepo, I prefer running the agent from the repository root. That keeps its state, permissions, and memory in one place instead of scattering them across workspaces. At the same time, when the agent needs to work inside a nested app or library, it can load the local `AGENTS.md` or `CLAUDE.md` file there. That lets me keep focused instructions close to specific parts of the repo when I need them. For a repository with multiple applications and shared packages, running the agent from the repository root feels much cleaner.

## Conclusion

For me, a convenient typescript monorepo is not about assembling the most advanced stack. It is about removing unnecessary layers until the repository feels like normal application development again. `Npm` workspaces handle local package linking, buildless internal packages remove the rebuild treadmill, modern `node.js` keeps typescript workflows straightforward, and `turborepo` stays in the narrow places where its graph awareness actually pays off.

I am not presenting this repository as a perfect template that every team should copy. It is a demonstration of an idea and a set of tradeoffs. But if you are building a full-stack typescript system and you are tired of monorepos that feel heavier than the product itself, this is the direction I would start with.

Repository: [https://github.com/allohamora/monorepo-example](https://github.com/allohamora/monorepo-example)
