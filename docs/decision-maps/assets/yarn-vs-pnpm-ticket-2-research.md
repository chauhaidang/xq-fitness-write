# Ticket #2 research: Yarn vs pnpm for isolated XQ Fitness services

Scope: compare modern Yarn and pnpm for `read-service` and `write-service`, assuming the primary goal is the simplest safe migration and both repositories remain isolated.

Current local facts verified in this session:

- both services still declare generated clients as local `file:` dependencies in `package.json`
- both Dockerfiles still copy `package.json` and `.npmrc`, omit the lockfile, and run `npm install --no-audit`
- the current machine has Node `v25.6.1`, npm `11.9.0`, Yarn Classic `1.22.22`, and no `pnpm` binary installed
- no local GitHub Actions workflow files were present in this workspace snapshot, so earlier CI details should be revalidated during prototyping

## Recommendation hypothesis

Prototype Yarn first.

Why: Yarn can be pinned per project through Corepack and configured to produce a regular `node_modules` install via `nodeLinker: node-modules`, which keeps the migration closer to the current npm mental model. pnpm remains viable, but its strongest model is more opinionated around its store and symlinked layout, and its current major-version docs add an immediate compatibility wrinkle with the services' Node 18 Docker builders.

## Comparison

| Topic                        | Yarn                                                                                                                                                     | pnpm                                                                                                                                                            | Migration impact for these services                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Version pinning              | Corepack can manage Yarn per project, and `packageManager` can pin an exact version plus hash.                                                           | Corepack can manage pnpm per project, and pnpm docs recommend `corepack use pnpm@...`.                                                                          | Roughly equal in principle. Both are stronger than relying on a globally installed CLI.                                                                      |
| Install model                | `yarn install --immutable` is the CI-safe path, and Yarn can install with `nodeLinker: node-modules` for an npm-like layout.                             | `pnpm install --frozen-lockfile` is the CI-safe path. Default layout relies on a content-addressable store plus links.                                          | Yarn has the lower-churn path because we can stay close to today's plain `node_modules` expectations.                                                        |
| Private GitHub Packages auth | Yarn supports registry and scope auth in `.yarnrc.yml` via `npmRegistries`, `npmScopes`, and `npmAuthToken`.                                             | pnpm uses `.npmrc` auth and supports URL-scoped credentials and `tokenHelper` safeguards. GitHub Packages still documents `~/.npmrc` token auth.                | pnpm fits the existing `.npmrc` pattern more directly. Yarn would likely mean choosing between keeping `.npmrc` or migrating auth config into `.yarnrc.yml`. |
| Local `file:` dependencies   | Yarn supports standard `node_modules` installs, so local generated clients are conceptually close to current behavior.                                   | pnpm explicitly checks `file:` dependency freshness unless `--frozen-lockfile` is used, and warns production installs can fail if the `file:` target is absent. | Both can work, but pnpm is less forgiving if generated-client timing is wrong.                                                                               |
| Docker path                  | Yarn can stay close to a conventional `node_modules` image build, especially with `nodeLinker: node-modules`.                                            | pnpm's Docker guidance is good, but it is different: BuildKit cache mounts are recommended, and hardlink/reflink behavior changes inside Docker builds.         | Yarn looks less disruptive for the first migration pass because the current Dockerfiles are already conventional and intentionally avoid lockfiles.          |
| Security controls            | Yarn offers immutable installs, cache checks, hardened mode, network disablement, checksum behavior, git dependency allowlists, and `npmMinimalAgeGate`. | pnpm offers frozen lockfiles, strict auth handling for `tokenHelper`, and a stricter dependency layout where only real dependencies are accessible.             | Both are strong. pnpm has the stricter dependency model; Yarn exposes more knobs without forcing a layout change.                                            |
| Node support pressure        | The docs reviewed focus on Corepack and configuration, not a simple compatibility matrix.                                                                | pnpm 11 docs show Node 18 and Node 20 as unsupported, while pnpm 10 still supports Node 18.                                                                     | This is the biggest immediate risk for pnpm: adopting the latest major would force a Node baseline discussion before or during migration.                    |
| Team ergonomics              | Requires adopting modern Yarn instead of the globally installed Yarn 1, but can preserve `node_modules`.                                                 | Requires introducing pnpm to a machine that does not currently have it, plus teaching its store and layout behavior.                                            | Yarn is likely easier for a low-drama first cut.                                                                                                             |

## What the docs most strongly suggest

1. Pin whichever tool we choose with Corepack and `packageManager`; do not rely on ambient global installs.
2. If we optimize for least disruption, Yarn should be tested in `nodeLinker: node-modules` mode before we test pnpm.
3. If pnpm is still attractive after ticket `#3`, prototype it with a Node-compatible major for the current Docker baseline instead of assuming the newest major fits `node:18-alpine`.

## Unknowns to prove in tickets #3 and #4

- whether Yarn with `nodeLinker: node-modules` can preserve the current generated-client flow without extra lockfile or Docker surprises
- whether either tool can keep the current "omit lockfile in Docker because of `file:` deps" workaround, or whether the migration should deliberately change that contract
- whether the private `@chauhaidang` package auth should stay in `.npmrc` for both tools or move into tool-specific config
- whether pnpm 10 versus pnpm 11 changes the real comparison enough that pnpm needs a prerequisite Node-version decision

## Official sources

- [Yarn install](https://yarnpkg.com/cli/install)
- [Yarn configuration](https://yarnpkg.com/configuration/yarnrc)
- [Yarn installation](https://yarnpkg.com/getting-started/install)
- [Corepack README](https://github.com/nodejs/corepack#readme)
- [pnpm installation](https://pnpm.io/installation)
- [pnpm install](https://pnpm.io/cli/install)
- [pnpm CI](https://pnpm.io/continuous-integration)
- [pnpm auth settings](https://pnpm.io/npmrc)
- [pnpm symlinked node_modules structure](https://pnpm.io/symlinked-node-modules-structure)
- [pnpm production](https://pnpm.io/production)
- [pnpm Docker](https://pnpm.io/docker)
- [GitHub Packages npm registry auth](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
