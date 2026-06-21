# Yarn vs pnpm for XQ Fitness services

Goal: choose and plan a package-manager migration for the independently versioned `read-service` and `write-service` repositories.

Current constraints: both use npm lockfiles; CI runs Node 20 with npm caching; Docker builds run Node 18 and currently omit lockfiles; private `@chauhaidang` packages require GitHub Packages authentication; generated API clients are local `file:` dependencies created before dependency installation. Global CI tools may remain installed with npm unless the chosen approach benefits from changing them.

## #1: What outcomes and operating model should drive the choice?

Blocked by: None
Type: Discuss

### Question

Rank determinism, CI/Docker speed, local disk use, security, contributor ergonomics, and maintenance burden. Should the services remain independent projects with separate lockfiles, or is a shared workspace part of this migration?

### Answer

Resolved. Primary optimization is the simplest safe migration, not maximum package-manager capability. `read-service` and `write-service` must remain isolated repositories with their own lockfiles and lifecycle, regardless of where they sit on disk. Shared workspace/monorepo options are out of scope. Other factors still matter, but only after they preserve low migration complexity for two independent services.

## #2: How do current Yarn and pnpm compare against those constraints?

Blocked by: #1
Type: Research

### Question

Using current official documentation, compare supported Node versions, Corepack/version pinning, immutable installs, GitHub Packages authentication, local `file:` packages, CI caching, Docker deployment patterns, security controls, and operational maintenance, with the recommendation framed around the least disruptive migration for two isolated repositories.

### Answer

Resolved in [ticket-2 research asset](./assets/yarn-vs-pnpm-ticket-2-research.md). Recommendation hypothesis: prototype modern Yarn first, pinned via Corepack and `packageManager`, using `nodeLinker: node-modules` to stay closest to the current npm/Docker model. pnpm remains viable, but likely with higher migration churn because its default store/layout is more opinionated and the current pnpm 11 compatibility matrix excludes Node 18, which the service Dockerfiles still use. Key unknowns for prototyping: generated-client `file:` behavior, private-registry auth shape, Docker lockfile strategy, and whether pnpm would require a prerequisite Node baseline change.

## #3: Does Yarn work end-to-end for both services?

Blocked by: #1, #2
Type: Prototype

### Question

In disposable branches/worktrees, can one pinned Yarn configuration install private and generated-client dependencies, build, lint, run unit and component tests, build production images, and reproduce installs in CI for both isolated services with low migration churn?

### Answer

Resolved in [ticket-3 prototype asset](./assets/yarn-ticket-3-prototype.md). Answer: not yet. A pinned modern Yarn setup can be made to install, build, and run unit tests for both services, but it is not a low-churn end-to-end migration. It needed new Yarn-specific private-registry config, fresh worktrees were missing the generated-client folders required by `file:` dependencies, and the current component-test/image path still validates npm because both service Dockerfiles install with npm. Read-service lint still fails, but that is baseline behavior under npm too, not a Yarn regression.

## #4: Does pnpm work end-to-end for both services?

Blocked by: #1, #2
Type: Prototype

### Question

Run the same disposable acceptance matrix as #3 with a pinned pnpm version, including its symlinked dependency layout and production-image strategy, and measure whether that adds migration complexity relative to Yarn for isolated services.

### Answer

Resolved in [ticket-4 prototype asset](./assets/pnpm-ticket-4-prototype.md). Answer: not yet. Using `pnpm@10` to stay compatible with the current Node 18 Docker baseline, both services could install, build, and run unit tests once generated clients were seeded in. Compared with Yarn, pnpm had smaller `node_modules` folders and slightly faster installs, but it added stricter auth friction because it would not trust the current project-level token interpolation pattern in `.npmrc`, and it introduced dependency build-script approval warnings (`pnpm approve-builds`). Like Yarn, it also inherited the same generated-client precondition and the same npm-shaped Docker/component-test blocker.

## #5: Which package manager should we adopt for the isolated services?

Blocked by: #2, #3, #4
Type: Discuss

### Question

Choose Yarn or pnpm, pin its version and linker/install mode, keep separate lockfiles per repo, and document why the alternative was rejected.

### Answer

Resolved. Adopt Yarn `4.17.0`, pinned independently in each service through the `packageManager` field and Corepack. Each repository will own its own `yarn.lock` and `.yarnrc.yml`; use `nodeLinker: node-modules` and immutable installs in CI/Docker so the migration stays close to the current npm dependency layout while enforcing the lockfile.

Yarn was chosen because the primary goal is the simplest safe migration. Both prototypes passed service builds and unit tests after the shared generated-client precondition was satisfied, so pnpm's modest install-speed improvement (roughly 2.9 seconds per service in this trial) and smaller `node_modules` footprint do not decide the choice. pnpm would additionally require a new trusted user-level/CI authentication pattern for GitHub Packages and an explicit dependency build-script approval policy. Yarn needs a committed scope/auth configuration, but keeps that configuration local and reproducible within each isolated repository and did not introduce the build-script approval workflow.

pnpm remains a technically viable future option, but is rejected for this migration because its measured efficiency gains come with more contributor, CI-secret, and dependency-policy churn than Yarn under the current constraints.

## #6: How should the migration roll out safely?

Blocked by: #5, #7
Type: Discuss

### Question

Define service order, lockfile cutover, CI and Docker updates, private-token handling, documentation changes, acceptance gates, rollback, and whether npm-based global tooling remains intentionally unchanged.

### Answer

Resolved in the [ticket-6 rollout asset](./assets/yarn-ticket-6-rollout.md). Migrate `write-service` first as the higher-confidence pilot, require a successful clean-clone install, build/unit/component suite, Yarn-native image, deployment health check, and representative write workflow, then apply the same isolated-repository template to `read-service`. Each cutover replaces `package-lock.json` with its own `yarn.lock` atomically; dual-lockfile states are forbidden.

CI and Docker move to pinned Yarn and Node 20, generated clients are bootstrapped before immutable installation, and registry credentials become ephemeral BuildKit secrets for images. npm remains intentionally limited to external global infrastructure such as `xq-infra`. Rollback is service-local: redeploy the previous immutable npm image, and revert the lockfile, CI, Docker, scripts, and documentation together rather than operating a mixed package-manager state.

## #7: How should generated clients and service images be normalized before migration?

Blocked by: #3, #4
Type: Discuss

### Question

Before rolling out Yarn, should `generated-clients/*` become tracked/generated in a reproducible preinstall step, and should service Dockerfiles stop depending on npm-specific install behavior so component tests and image builds can validate Yarn directly?

### Answer

Resolved. Keep `generated-clients/` ignored and untracked; do not make generated source a second checked-in representation of the OpenAPI contracts. Instead, make client generation a deterministic bootstrap script that works before dependency installation: invoke `@openapitools/openapi-generator-cli@2.25.2` through the Corepack-pinned Yarn binary (`yarn dlx`) from a temporary directory, retain generator engine `7.17.0` in `openapitools.json`, and remove the requirement for a globally installed `openapi-generator-cli`. Running outside the project is necessary because Yarn resolves the project lockfile before package scripts and the local `file:` dependency does not exist yet. Both local setup and CI must run this script before `yarn install --immutable`.

Normalize both Dockerfiles around the same contract. Use Node 20 for builder and runtime to match CI; enable the repository-pinned Yarn through Corepack; copy the API specification, generator configuration/script, `package.json`, `.yarnrc.yml`, and `yarn.lock`; generate the local client; then run `yarn install --immutable` and build with Yarn. Supply GitHub Packages credentials with a BuildKit secret or equivalent ephemeral mechanism, not persisted `ARG`/`ENV`, and ensure the final image contains no registry token. Component tests must build and exercise this Yarn-native image, so they become migration evidence rather than continuing to validate npm.

The generated client remains a development dependency for component-test compilation. Production-dependency pruning may be added if it can be verified without changing runtime behavior, but it is not a prerequisite for the package-manager cutover. npm may remain only for intentionally external/global infrastructure tooling; service dependency installation, scripts, CI caching, and image builds must use pinned Yarn.
