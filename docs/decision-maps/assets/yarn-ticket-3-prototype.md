# Ticket #3 prototype: modern Yarn for isolated XQ Fitness services

Scope: prototype modern Yarn in disposable worktrees for `write-service` and `read-service` without touching the user's active working copies.

Prototype locations:

- `/private/tmp/xq-write-service-yarn-proto`
- `/private/tmp/xq-read-service-yarn-proto`

Pinned tool path used for repeatable commands after bootstrap:

- `node /Users/automation2/.local/share/nvim/mason/packages/basedpyright/venv/lib/python3.9/site-packages/nodejs_wheel/lib/node_modules/corepack/dist/corepack.js yarn`

## Minimal prototype changes

Both repos needed:

- `packageManager` added to `package.json` by `corepack use yarn@stable` (resolved to Yarn `4.17.0`)
- new `.yarnrc.yml`
- new `yarn.lock`
- new `.yarn/install-state.gz`

Prototype `.yarnrc.yml`:

```yml
nodeLinker: node-modules
enableScripts: true

npmScopes:
  chauhaidang:
    npmRegistryServer: 'https://npm.pkg.github.com'
    npmAlwaysAuth: true
    npmAuthToken: '${GITHUB_TOKEN}'
```

## What happened

### 1. Bootstrap and install

Initial `corepack use yarn@stable` failed in both repos because Yarn tried to resolve `@chauhaidang/xq-common-kit` from the public Yarn registry. Adding `.yarnrc.yml` with `npmScopes.chauhaidang` fixed that.

Then `yarn install` still failed in both repos because fresh worktrees did not contain:

- `generated-clients/write-service`
- `generated-clients/read-service`

Those folders are required by the local `file:` dependencies in each `package.json`, but they are not present in a clean detached worktree. The checked-in generator scripts are not self-contained enough to solve that during install because they require a globally installed `openapi-generator-cli`.

After copying the existing generated clients from the current working copies into the disposable worktrees, installs succeeded.

Install timings:

- `write-service`: `15.714s`
- `read-service`: `16.023s`

Installed `node_modules` sizes:

- `write-service`: `214M`
- `read-service`: `217M`

### 2. Build and lint

- `write-service` build: passed
- `write-service` lint: passed
- `read-service` build: passed
- `read-service` lint: failed, but the same failure also occurs with the current npm workflow in the original repo

Read-service lint failure is baseline, not a Yarn-specific regression. It comes from ESLint typed-project coverage not including `test/**` and `generated-clients/**`.

### 3. Unit tests

- `write-service` unit tests: passed (`142/142`)
- `read-service` unit tests: passed (`2/2`) when rerun outside the sandbox listener restriction

The first read-service unit-test failure was environmental (`listen EPERM 0.0.0.0` inside the sandbox), not a Yarn issue.

### 4. Component tests and production images

Not completed as valid Yarn proofs.

Reason: the current component-test path depends on `xq-infra` plus service images built from Dockerfiles that still install with npm. That means a component-test or image-build run would need Dockerfile changes first, otherwise the runtime path is still validating npm, not Yarn.

This is already enough to answer the ticket's actual question about low-churn end-to-end migration: modern Yarn does **not** currently fit end-to-end with low churn.

## Result

Answer to ticket #3: **No, not yet.**

Modern Yarn can support the local dev loop for both repos once configured, but the migration is not low-churn end-to-end because it currently requires all of the following:

1. Yarn-specific registry/auth config for `@chauhaidang`.
2. A plan for `generated-clients/*` before install.
3. Dockerfile changes before component tests or production-image validation can count as Yarn validation.
4. CI workflow changes to invoke pinned Yarn instead of npm, which could not be revalidated from this workspace snapshot because `.github/workflows` files were absent here.

## Most important evidence

- Fresh worktrees failed install until private-registry config was added.
- Fresh worktrees still failed until generated clients were copied in.
- After those fixes, builds and unit tests worked.
- The remaining component-image path is still npm-shaped, so Yarn is not an end-to-end drop-in replacement today.
