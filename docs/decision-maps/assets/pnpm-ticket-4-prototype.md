# Ticket #4 prototype: pnpm for isolated XQ Fitness services

Scope: prototype pnpm in disposable worktrees for `write-service` and `read-service`, using a Node-18-compatible pnpm major so the comparison stays aligned with the services' current Docker baseline.

Prototype locations:

- `/private/tmp/xq-write-service-pnpm-proto`
- `/private/tmp/xq-read-service-pnpm-proto`

Pinned version:

- `pnpm@10.34.4`

Temporary user-level config homes used to avoid touching the real machine config:

- `/private/tmp/xq-write-service-pnpm-home`
- `/private/tmp/xq-read-service-pnpm-home`

Pinned command path used after bootstrap:

- `env HOME=/private/tmp/... node /Users/automation2/.local/share/nvim/mason/packages/basedpyright/venv/lib/python3.9/site-packages/nodejs_wheel/lib/node_modules/corepack/dist/corepack.js pnpm`

## Minimal prototype changes

Both repos needed:

- `packageManager` added to `package.json` by `corepack use pnpm@10`
- new `pnpm-lock.yaml`

Unlike the Yarn prototype, no project-local package-manager config file was required to point the private scope at GitHub Packages. However, pnpm would not trust the existing project-level token interpolation pattern in `.npmrc`, so the prototype needed a throwaway user-level auth config set via:

```bash
pnpm config set //npm.pkg.github.com/:_authToken "$GITHUB_TOKEN"
```

## What happened

### 1. Bootstrap and install

pnpm immediately surfaced a policy difference from npm and Yarn:

- it warned that project-level registry credentials in `.npmrc` are ignored when they rely on environment-variable expansion
- it required the auth token to be supplied from a trusted user-level config instead

That was solved without touching the real machine config by using temporary HOME directories and `pnpm config set`.

pnpm then hit the same `generated-clients/*` precondition as Yarn:

- fresh worktrees could not install until the generated client folders existed
- the checked-in generator scripts are still not self-contained enough for a clean-clone install because they require a globally installed `openapi-generator-cli`

After seeding the generated clients from the current working copies, installs succeeded.

Install timings:

- `write-service`: `12.82s`
- `read-service`: `13.61s`

Installed `node_modules` sizes:

- `write-service`: `144M`
- `read-service`: `144M`

### 2. Build and lint

- `write-service` build: passed
- `write-service` lint: passed
- `read-service` build: passed
- `read-service` lint: failed, but this is the same baseline ESLint typed-project coverage failure seen under npm and Yarn

### 3. Unit tests

- `write-service` unit tests: passed (`142/142`)
- `read-service` unit tests: passed (`2/2`)

### 4. pnpm-specific friction

pnpm introduced one additional behavioral wrinkle beyond the auth policy:

- installs warned that `unrs-resolver@1.12.2` build scripts were ignored
- pnpm suggested `pnpm approve-builds` to explicitly allow dependency build scripts

Even though the prototype still built and ran unit tests successfully, this is an extra migration decision and contributor workflow surface that the Yarn trial did not require.

### 5. Component tests and production images

Not completed as valid pnpm proofs.

Reason: the current component-test path still depends on `xq-infra` plus service images built from Dockerfiles that install with npm. Validating those paths under pnpm would require Dockerfile changes first, otherwise the image/runtime contract is still npm-based.

## Result

Answer to ticket #4: **No, not yet.**

pnpm can be made to install, build, lint where lint already works, and run unit tests for both services. But it is not a low-churn end-to-end migration today.

Compared with the Yarn prototype:

- pnpm produced smaller `node_modules` folders and slightly faster installs
- pnpm did not need a committed project config file like `.yarnrc.yml`
- pnpm was stricter about auth and would not accept the current committed token pattern in `.npmrc`
- pnpm introduced explicit dependency-build approval flow (`approve-builds`)
- pnpm still inherited the same generated-client and npm-shaped Docker/image blockers

## Most important evidence

- Fresh worktrees failed until generated clients were seeded in, just like Yarn.
- pnpm refused to use the current project-level token interpolation pattern as a trusted credential source.
- After trusted user-level auth was supplied, installs were faster and smaller than Yarn.
- Builds and unit tests passed, but the Docker/component path still is not pnpm-native.
