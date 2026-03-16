# How I make a convenient TypeScript Full-Stack Monorepo

My name is Herman. Over the years I have seen many teams start a full-stack monorepo by following the docs until it technically works, then spend the rest of the project smoothing rough edges with extra scripts, hacks, and workaround layers. After enough of that, the conclusion is often simple: monorepos are not worth it.

I do not think the monorepo itself is usually the problem. More often, the problem is a setup that was made to work once, but never made comfortable to work in. In this article, I want to show the approach I use to keep a full-stack monorepo smooth, practical, and close to normal application development.

I am writing this for engineers who want one repository for a client, an API, and shared TypeScript code, but do not want the workflow to feel heavier every month. I will use my own repository as the example, not as a universal template, but as a concrete showcase of the decisions that keep a monorepo convenient for me.

## Why I choose a monorepo for full-stack work

I do not think every full-stack application should live in a monorepo. If the backend and frontend naturally belong to one framework application, or if the parts barely depend on each other, a monorepo may be unnecessary.

But I often build systems where the API and the client are tightly related while still needing to stay separate applications. I may want a dedicated backend with its own runtime model, its own deployment, WebSockets, background work, or an API surface that I do not want to hide inside a frontend framework. In those cases, a monorepo becomes a good middle ground.

It keeps the applications close enough to share contracts and runtime code, but it does not force them into one framework-specific structure. In this repository, the API is a Hono app and the client is a Vite React app. The client can import the API app type for a type-safe client, and anything that should be shared outside the server boundary can live in a separate shared library. That is a very practical balance for me.

The alternative is often more expensive than it first appears. Once I split a tightly coupled system into separate repositories, I usually need private package publishing, version coordination, and more CI wiring. In my experience, that is often more hassle than a monorepo, not less.

## What I actually want from a full-stack monorepo

Before I choose tools, I try to define what I want the repository to do for me. If I do not do that, it is too easy to collect features just because monorepo tools offer them.

For a full-stack TypeScript system, my baseline is simple:

- Clear boundaries between runnable apps, shared runtime code, and tooling.
- The ability to run scripts from the repository root when that is convenient, while keeping each workspace usable on its own.
- Shared code without publishing internal packages or rebuilding them after every small change.
- Development servers and tests that react to dependency changes naturally.
- CI that runs checks only where changes actually matter.
- Docker images that include only what the target app needs.
- Git history and repo conventions that stay understandable for regular application developers.

This list matters because it changes how I evaluate tools. I am not looking for the most feature-rich monorepo setup. I am looking for the setup that solves these practical problems with the least extra ceremony.

## The foundation: simple workspace boundaries

The first thing I want from a monorepo is a structure that makes sense when I open it without any explanation. I do not want top-level folders whose meaning changes from project to project. I want boundaries that tell me what something is before I read its code.

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

At the package manager level, I keep the foundation just as simple. npm workspaces already give me what I need here: workspace dependency resolution, symlinked internal packages through `node_modules`, and root-level script execution.

```json
{
  "name": "@example/root",
  "private": true,
  "workspaces": ["apps/*", "libs/*", "packages/*"]
}
```

I know many teams prefer pnpm or Yarn, and those tools can be excellent. This is not an argument that npm is universally better. It is simply my conclusion that for this repository, npm is already enough. I do not need to switch package managers just to get a monorepo.

## The key decision: buildless internal TypeScript packages

The biggest choice in this setup is how I treat shared internal packages. Many monorepo discussions start from the assumption that they should be built first and then consumed as compiled output. That can be the right choice in some environments, but I do not want it by default.

For internal code that lives and dies inside the same repository, I prefer what Turborepo documents as a [Just-in-Time Internal Package](https://turborepo.dev/docs/core-concepts/internal-packages#just-in-time-packages). In practice, that means the package points directly to TypeScript source and the rest of the toolchain consumes it without a separate package build step.

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

This one decision removes a surprising amount of infrastructure code. I do not need a parallel watch process rebuilding the shared package. I do not need to worry about stale `dist/` output. I do not need to teach every tool how to follow a build artifact that exists only because the repo is a monorepo.

It also changes how I think about aliases. In this setup, I do not want TypeScript `paths` to be the center of package consumption. They are fine in some application-level scenarios, but they do not work for buildless internal packages.

But what if I wanted to do it? If I decided to use aliases for internal packages anyway, I would usually stop being truly buildless. I would need compiled output such as `dist/`, package entrypoints pointing at that output, a TypeScript build step, and usually a post-build rewrite step with something like `tsc-alias` so the compiled code still imports correctly.

After that, I would also need a watch script for those packages. I could wire that through something like `turbo watch`, but the tradeoff would not be very attractive to me. With `interruptible: true`, Turbo could kill the running dev process, rebuild what changed, and start it again, even in cases where the app's own watcher could have handled the local change without a full restart. With `interruptible: false`, I would end up running two processes in parallel: the app's dev script and a separate dependency rebuild loop that runs on every change, while the dev process itself never restarts. Both variants can work, but neither one would feel especially smooth.

If I wanted rebuild-and-restart behavior only for monorepo dependencies, while leaving local changes to Vite or another app watcher, I would probably end up writing a custom watch script on top of something like `turbowatch`. In practice, that would often mean putting the logic into a small internal scripts package such as `@example/scripts`, wiring it in with something like `"devDependencies": { "@example/scripts": "*" }`, and pointing each workspace `dev` script to it with something like `"scripts": { "dev": "workspace-dev" }`.

Then the editor could become part of the problem too: after some rebuilds, the TypeScript server can get into a bad state, so I would either restart it manually in VS Code, or add `references` to consumed workspace packages such as `../../libs/shared` without `composite`. TypeScript warns about that setup, but it keeps the IDE aligned with the latest output.

That setup could be made to work, and for some repositories it could be the right tradeoff. I just would not want to choose that stack before I needed it, especially when a buildless package plus Node's `imports` already gives me a simpler path.

I am not saying compiled internal packages are wrong. If a package needs to run in an environment that cannot consume the source directly, if it needs to be published outside the repo, or if the toolchain truly requires compiled output, then a build step is reasonable. My point is narrower: I do not want to pay that cost before I have a real reason.

## Why development stays smooth

The buildless package decision works because the runtime and tooling choices support it instead of fighting it.

This repository targets modern Node.js with erasable syntax and leans on direct execution of TypeScript entry files. The API package uses `node src/index.ts` for start and `node --watch src/index.ts` for development. The shared library is also source-first. In practice, that means I can change code in `@example/shared`, rerun or restart naturally through normal tooling, and avoid the usual loop of "change source, rebuild package, restart app, refresh editor state."

The TypeScript configuration is intentionally aligned with that model:

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

For me, this is where the monorepo stops feeling special. Node can run an API entry file that imports buildless internal packages without extra glue. Vite and Vitest can do the same during frontend development, so I do not need a separate monorepo-specific development mode layered on top of normal development.

There is also a full-stack benefit here. The Hono pattern in this repository is very direct:

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

I export the app type from the server package and consume it on the client through `hc<App>()`. If I change the server contract in a breaking way, the client can fail at typecheck time instead of letting the mismatch survive until runtime. When something cannot or should not be exported from the server package itself, I move it into the shared library.

This is one of the main reasons I like a monorepo for full-stack work. The contract between the applications can stay close to the code that uses it.

## The conventions that make daily work smoother

These conventions are not only about runtime mechanics. They also make daily work smoother by reducing the number of decisions that engineers need to make every day.

I keep shared ESLint, Prettier, and TypeScript configs in `packages/eslint-config`, `packages/prettier-config`, and `packages/tsconfig`, and I treat them like normal workspace packages.

Prettier is the simplest case: each workspace adds `@example/prettier-config` and points its `prettier` field at it. `.prettierignore` cannot really be shared the same way, so I keep one at the root and create it in each workspace.

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
  "prettier": "@example/prettier-config"
}
```

ESLint is a little more layered, but still straightforward. I usually want a shared ESLint package to expose a few obvious building blocks such as `base`, `node`, or `client`, and then let each workspace keep a small local `eslint.config.mjs`. In this repo, the API and shared library can just export `eslintConfig.node`, while the client file mostly contains the client-specific layer on top of `eslintConfig.base`, namely browser, React Hooks, and Vite rules.

```js
// packages/eslint-config/src/index.mjs
const base = defineConfig(eslint.configs.recommended, ...tseslint.configs.recommended, eslintPluginPrettierRecommended);

// apps/client/eslint.config.mjs
export default defineConfig([...eslintConfig.base, reactHooks.configs.flat.recommended, reactRefresh.configs.vite]);
```

TypeScript follows the same pattern, but the package shape is simpler. A shared `tsconfig` package usually just keeps files like `node.json` at the package root, then each workspace extends what it needs. In this repo, the API and shared library extend `@example/tsconfig/node.json`, while the client keeps its own Vite-oriented `tsconfig` files because Vite has its own constraints.

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

I apply the same thinking to commit hygiene. `Husky` and `lint-staged` run fixes before commit, and the nearest config handles the staged file, so root files can stay on root rules while apps and libraries keep their own local setup, with `apps`, `packages`, and `libs` ignored for root checks so root formatting, linting, and typechecking stay focused on root-owned files. The workflow stays strict enough to be useful without turning commits into a ceremony.

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

Conventional commits help for the same reason. In a monorepo, scope is especially useful. A commit like `feat(api):` or `fix(client):` tells me which part of the system changed before I open the diff, while a plain `feat:` usually means the change affects several apps or the repository as a whole. It also helps when I need to generate a changelog. In this repo, `update:changelog` and the release flow in `scripts/release.ts` both benefit from predictable commit types and scopes. It is a small convention, covered by `commitlint` and `Husky`, but it pays off over time.

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

I find custom PR tags such as `shared`, `api`, or `client` useful because they let me filter PRs and understand what was affected before I even read the files.

I also keep versioning simple. This repository uses one lockstep version across the root package and all workspaces. I do not treat the apps, libraries, and config packages here as independent public products, so separate version streams would mostly create bookkeeping. One repo, one product, one version line feels much simpler to me.

## Where Turborepo earns its place

Turborepo is not the center of this setup, but it is useful in the places where monorepo-specific logic actually matters. I do not want it to wrap every workflow by default. I use it when I need graph awareness, cache awareness, or pruning, and leave it out when a normal script is enough.

The clearest example is affected CI. I want the repository to understand package relationships and run checks only where a change matters, and Turborepo already handles that well enough that I do not see a reason to replace it with custom dependency-graph scripting.

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

In this repository I set `TURBO_SCM_BASE` explicitly in GitHub Actions to help Turborepo find the correct target when using `--affected`. Turbo still handles the affected logic itself, but it also needs root-task entries like that so affected runs can include root-owned files instead of only workspace changes.

Docker is the other obvious example. `turbo prune` lets me build an image from only the code and dependencies needed by the target app instead of dragging the whole repository into the build context. In this repo, the API Dockerfile uses `turbo prune --scope=@example/api --docker` for exactly that reason. That is real value, not just abstraction for its own sake.

This is also why I do not use Nx here. I think it works well when a repository stays inside its model, but that comes with more abstraction and more magic. For this repository, I would rather keep the stack closer to standard tools and keep more flexibility until I have a concrete reason to use Nx.

## The extra quality-of-life pieces

Once the main workflow is stable, a few smaller choices make the repository nicer to live in.

One of them is code generation. A lot of monorepo work is repetitive by nature: create a package, add scripts, wire shared configs, fill out the basic structure, and make sure no small detail gets missed. In this repo, I use Plop for that through the root `generate:package` workflow, but the same approach also works anywhere the structure repeats, whether that means scaffolding a new microservice together with its Terraform changes, for example. It is not a core architectural piece, but it saves me from boring copy-paste mistakes.

Another one is how I work with AI agents in the repository. In a monorepo, I prefer running the agent from the repository root. That keeps its state, permissions, and memory in one place instead of fragmenting them across workspaces. At the same time, when the agent needs to work inside a nested app or library, it can load the local `AGENTS.md` / `CLAUDE.md` file there, so I can still attach focused instructions to specific parts of the repo when needed. For a repository with multiple applications and shared packages, that root-run model feels much cleaner.

Neither of these pieces is the reason the monorepo works. They are the finishing touches that keep the daily workflow from getting noisy.

## Conclusion

For me, a convenient TypeScript monorepo is not about assembling the most advanced stack. It is about removing unnecessary layers until the repository feels like normal application development again. npm workspaces handle local package linking, buildless internal packages remove the rebuild treadmill, modern Node.js keeps TypeScript workflows straightforward, and Turborepo stays in the narrow places where its graph awareness actually pays off, mainly affected CI and Docker pruning.

I am not presenting this repository as a perfect template that every team should copy. It is a showcase of an idea and a set of tradeoffs. But if you are building a full-stack TypeScript system and you are tired of monorepos that feel heavier than the product itself, this is the direction I would start with.

Repository: [https://github.com/allohamora/monorepo-example](https://github.com/allohamora/monorepo-example)
