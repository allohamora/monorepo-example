# How to build a convenient typescript full-stack monorepo

Hi, my name is Herman. Over the years I have seen many teams set up a full-stack monorepo, get it working, and then spend the rest of the project patching rough edges, adding hacks, or delaying improvements because they turn out to be too painful to make. After enough of that, the conclusion is often simple: a monorepo is not worth it.

I do not think the monorepo itself is usually the problem. More often, the problem is a setup that was put together quickly and never made convenient for day-to-day work. In this article, I want to show the approach I use to keep a full-stack monorepo smooth, practical, and close to normal application development.

I am writing this for engineers who want one repository for `client`, `api`, and `shared` typescript code, but do not want the monorepo to complicate day-to-day development. I will use my own repository as the example, not as a universal template, but as a concrete demonstration of decisions and tradeoffs.

## Why I choose a monorepo for full-stack work

I do not think every full-stack application should live in a monorepo. If `api` and `client` can be fully implemented within one framework like astro, or if they barely depend on each other, a monorepo may be unnecessary.

But I often build systems where `api` and `client` are tightly related while still needing to stay separate applications. I may want a dedicated `api` with its own runtime and its own deployment. I may also need websockets or a job queue, which can be awkward to implement inside some full-stack frameworks. In those cases, a monorepo becomes a good middle ground.

It keeps the applications close enough to share contracts and runtime code, but it does not force everything into one structure shaped by a specific framework. In this repository, `api` is a hono app and `client` is a react app built with vite. The `client` can import types from `api` to make type-safe requests, and anything else that should be shared can live in the `shared` library.

The alternative is often more expensive than it seems at first. As soon as I split a tightly connected system into separate repositories, I usually need private package publishing, version coordination, and more complicated ci. In my experience, that often creates more problems than a monorepo, not fewer.

## What I actually want from a full-stack monorepo

Before I choose tools, I define what I want from the monorepo, otherwise it becomes too easy to chase features instead of solving practical problems with minimal setup.

For a full-stack typescript monorepo, my baseline requirements are fairly simple:

- Clear boundaries between applications, shared runtime code, and tooling.
- The ability to run scripts from the repository root when that is convenient, while keeping each workspace useful on its own.
- Shared code without publishing internal packages or rebuilding them after every small change.
- Dev scripts that react naturally to changes in dependencies.
- CI that runs checks only where they matter.
- Docker images that include only what the target application needs.
- Git history and repository conventions that stay understandable for regular application developers.

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

At the package manager level, I keep the foundation just as simple. Npm workspaces already give me what I need here: dependency resolution between workspaces, symlinked internal packages through `node_modules`, and root-level script execution.

```json
{
  "name": "@example/root",
  "private": true,
  "workspaces": ["apps/*", "libs/*", "packages/*"]
}
```

I know many teams prefer pnpm or yarn, and those are excellent tools, but for my requirements npm is enough and there is no reason to add another tool to the stack without a real need.

## Buildless typescript internal packages

The biggest choice in this setup is how I treat shared internal packages. A lot of monorepo discussions start from the assumption that they should be built first and then consumed as compiled output. That can be the right choice in some environments, but I do not want it by default.

For internal code that lives entirely inside one repository, I prefer the approach that turborepo documentation calls a [just-in-time internal package](https://turborepo.dev/docs/core-concepts/internal-packages#just-in-time-packages). In practice, the package points directly to typescript source files, and the rest of the toolchain consumes them without a separate build step.

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

This one decision removes a surprising amount of infrastructure code that usually appears in a monorepo. At the same time, it forbids typescript aliases, because aliases already require a build step.

If I wanted aliases for internal packages, I would have to add a build into `dist/`, then do a post-build rewrite with something like tsc-alias, and also keep separate watch support for rebuilds. With `turbo watch`, that would mean either unnecessary restarts of the dev process or a parallel loop rebuilding dependencies on every change. If I needed finer behavior, where only monorepo dependencies get rebuilt while local changes are still handled by the application's own watcher, I would have to go further. In practice, that usually ends with a custom watch script on top of something like turbowatch and even a separate internal scripts package.

The problem often does not stop at runtime. After a few rebuilds, the typescript server in the editor can stop syncing correctly, so I either restart it manually or patch the setup with `references` without `composite` to keep the ide aligned with the current state. That tradeoff can be justified if the package needs to be published or the toolchain truly requires compiled output, but without a real need I would not do it.

## Why development stays smooth

The buildless package decision works because the runtime and tooling choices support it instead of fighting it.

This repository targets modern node.js with erasable syntax and relies on running typescript entry files directly. The `api` package uses `node src/index.ts` for start and `node --watch src/index.ts` for development. The `shared` library also works directly with source code. That means I can change code in `@example/shared`, and normal tooling picks it up without a separate cycle of rebuilding the package, restarting the application, and updating the editor state.

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

This matters not only for `api`. Vite and vitest on the `client` side can also work with internal packages directly, so I do not need extra monorepo orchestration on top of the normal workflow.

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

I keep shared eslint, prettier, and typescript configs in `packages/eslint-config`, `packages/prettier-config`, and `packages/tsconfig`, and I treat them like ordinary workspace packages.

For shared prettier, each workspace adds `@example/prettier-config` and points its `prettier` field to it in `package.json`. `.prettierignore` cannot be shared the same way, so it has to be duplicated in each workspace and at the root.

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

For eslint, I usually want the shared package to provide a few obvious base configs like `base` and `node`, while each workspace keeps a small local `eslint.config.mjs`. In this repository, `api` and the `shared` library can simply export `eslintConfig.node`, while `client` has `eslintConfig.base` with additional rules for react and vite.

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

Typescript follows the same pattern, but the package shape is simpler. A shared `tsconfig` package usually just keeps files like `node.json` at the package root, then each workspace extends what it needs. In this repo, `api` and `shared` extend `@example/tsconfig/node.json`, while `client` keeps its own `tsconfig` files because vite has its own constraints.

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

I apply the same thinking to commit hygiene. Husky and lint-staged run fixes before commit, and the nearest config handles the staged files, so root files can stay on root config while apps and libraries keep their own local setup. `apps`, `packages`, and `libs` are ignored for root checks, which keeps root formatting, linting, and typechecking focused on root files.

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

Conventional commits help here too, and commit scopes are especially useful. With `feat(api):` or `fix(client):`, I can see which part of the system changed before opening the diff, while a plain `feat:` usually means the change touches multiple applications or the whole repository. That makes both the history easier to read and the changelog easier to generate through conventional-changelog. It is a small convention, supported by commitlint and husky, but it pays off over time.

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

```json
// package.json
"scripts": {
  "update:changelog": "conventional-changelog -p conventionalcommits"
}
```

I also find custom pull request labels like `shared`, `api`, or `client` useful, because they let me filter pull requests and understand what was touched before reading the files.

I also simplify the versioning scheme on purpose. This repository uses one version for the root package and all workspaces, so there is no need for separate versions for each package or a more complicated version update process, and `scripts/release.ts` shows a simple example of that release flow.

```ts
// scripts/release.ts
const setPackageJsonVersion = async (version: string) => {
  await $`npm version ${version} --commit-hooks false --git-tag-version false`; // root package.json
  await $`npm version ${version} --workspaces --commit-hooks false --git-tag-version false`;
};

const updateChangelog = async () => {
  await $`npm run update:changelog`;
};

const version = await getVersion();

// other actions like create release branch, bump version in .env, make a commit, etc.
await setPackageJsonVersion(version);
await updateChangelog();
```

## Where turborepo earns its place

In this setup, turborepo is not mandatory, but in some places it is really useful.

The clearest example is affected ci. I want the repository to understand relationships between packages and run checks only where a change actually matters, and turborepo already does that well enough.

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

```json5
// turbo.json
"//#format": {
  "cache": false,
  "inputs": ["$TURBO_DEFAULT$", "!apps/**", "!libs/**", "!packages/**"]
}
```

In this example, I set `TURBO_SCM_BASE` explicitly in github actions to help turborepo find the right comparison point when using `--affected`, and those root tasks are there so affected runs can include root files, not just workspace changes.

Docker is the other obvious example. `turbo prune` lets me build an image from only the code and dependencies the target application needs instead of pulling the whole repository into the build context. In this repo, the `Dockerfile` for `api` uses `turbo prune --scope=@example/api --docker` for exactly that reason. That is real value, not abstraction for its own sake.

This is also why I do not use nx here. I think it works well when a repository stays inside its model, but that comes with more abstraction and more magic.

## The extra quality-of-life pieces

Once the main workflow is stable, a few smaller choices make the repository nicer to live in.

One of them is code generation. A lot of monorepo work is repetitive: create a package, add scripts, wire shared configs, fill out the basic structure, and make sure no small detail gets missed. In this repo, I use plop for that and show an example of it in the root `generate:package` script. The same approach works anywhere the structure repeats, for example when creating a new microservice together with changes to the terraform schema. It is not a core architectural piece, but it saves me from boring copy-paste mistakes.

Another is how I work with ai agents in the repository. In a monorepo, I prefer running the agent from the repository root. That keeps its state, permissions, and memory in one place instead of scattering them across workspaces. When the agent needs to work inside a nested app or library, it can automatically load the local `AGENTS.md` / `CLAUDE.md` file there. That lets me keep instructions close to specific parts of the repo when I need them.

## Conclusion

This approach relies on a few simple decisions that fit together well. Npm workspaces handle local package linking, buildless internal packages remove the endless rebuild cycle, modern node.js simplifies the typescript workflow, and turborepo stays only where it really provides a benefit.

I am not presenting this repository as a perfect template that every team should copy. I am simply showing an idea and a set of tradeoffs. But if you are building a full-stack typescript system and you are tired of monorepos that feel heavier than the product itself, this is the direction I would start with.

Repository: [https://github.com/allohamora/monorepo-example](https://github.com/allohamora/monorepo-example)
