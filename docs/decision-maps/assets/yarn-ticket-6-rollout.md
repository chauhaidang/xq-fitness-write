# Ticket #6 rollout: Yarn 4 for isolated services

This is the implementation checklist for migrating `write-service` and then `read-service` from npm to Yarn without coupling their repositories.

## Fixed choices

- Yarn version: `4.17.0`, pinned in each repository's `packageManager` field.
- Dependency layout: `nodeLinker: node-modules`.
- Reproducible install: `yarn install --immutable`.
- Runtime baseline: Node 20 in CI and both Docker stages.
- Lockfiles: one independent `yarn.lock` per service; no root/shared lockfile and no retained `package-lock.json` after cutover.
- Generated clients: ignored and regenerated before install with `@openapitools/openapi-generator-cli@2.25.2` plus generator engine `7.17.0`.
- Registry credentials: environment interpolation for CI/local Yarn and ephemeral BuildKit secrets for images; never committed or persisted in an image layer.

## Rollout order

1. Migrate `write-service` as the pilot. Its build, lint, and 142 unit tests already passed in the Yarn prototype, giving the stronger regression signal.
2. Merge/deploy only after all pilot gates below pass against the Yarn-built image.
3. Observe one successful production deployment and verify health plus a representative write workflow before starting the second service.
4. Apply the same reviewed template to `read-service`. Do not share configuration or lockfiles between repositories.
5. Verify the read health endpoint and a representative report/query workflow after deployment.

Do not combine both service migrations into one release. A failure in the pilot must not block npm-based operation of `read-service`.

## Per-service change set

### Package manager and lockfile

1. Add `"packageManager": "yarn@4.17.0"` to `package.json`.
2. Add `.yarnrc.yml` with `nodeLinker: node-modules` and the `chauhaidang` GitHub Packages scope. Read the token from `GITHUB_TOKEN`; commit no credential.
3. Update package scripts that invoke npm internally, notably `test:all`, to invoke Yarn.
4. From a clean generated-client bootstrap, create and commit `yarn.lock`.
5. Prove `yarn install --immutable` succeeds, then remove `package-lock.json`. Never merge with both lockfiles.
6. Keep `generated-clients/`, `node_modules/`, Yarn install state, and cache artifacts ignored. Cache content is CI state, not source.

### Client generation

1. Change `scripts/generate-api-client.sh` so it invokes the exact wrapper through pinned Yarn, equivalent to `yarn dlx @openapitools/openapi-generator-cli@2.25.2 generate ...`.
2. Keep generator engine `7.17.0` in `openapitools.json`.
3. Remove the global `openapi-generator-cli` check and installation instructions.
4. Keep the public command `yarn generate:client`; it must work in a clean clone before dependency installation.
5. CI, Docker, and contributor docs must all use the same order: enable Corepack, run the generator script directly, then perform the immutable install. The bootstrap runs `yarn dlx` from a temporary directory because invoking a project-level Yarn script would resolve the missing `file:` dependency first.
6. Compile the generated client explicitly before component tests. Yarn does not run the local `file:` package's generated `prepare` lifecycle in this layout, so tests must not depend on npm's implicit lifecycle behavior.

### CI

1. Keep Node 20, enable Corepack, and assert `yarn --version` reports `4.17.0`.
2. Start without a custom Yarn cache step in CI. Let Yarn use its default cache location, then add explicit caching later only if CI timing justifies it.
3. Remove global OpenAPI Generator installation. Keep `xq-infra` installed with npm as intentionally external infrastructure tooling.
4. Run the generator bootstrap script, `yarn install --immutable`, and all installed service scripts through Yarn.
5. Build the service image before component tests and make `xq-infra` use that exact Yarn-built image.
6. Add `package.json`, `yarn.lock`, `.yarnrc.yml`, `api/**`, generator scripts, and `Dockerfile` to workflow path filters so dependency/tooling changes cannot skip CI.
7. Pass the package-read token only as `GITHUB_TOKEN` for Yarn steps. Do not print Yarn config or token-bearing environment values.

### Docker and local image scripts

1. Use `node:20-alpine` in builder and runtime stages.
2. Enable Corepack and rely on the committed `packageManager` version.
3. Copy the minimal generation inputs and lock/config files before dependency installation: `package.json`, `yarn.lock`, `.yarnrc.yml`, `openapitools.json`, the service API specification, and the generator script.
4. Generate the client, then run `yarn install --immutable`; copy source/config and run `yarn build`.
5. Replace `ARG GITHUB_TOKEN` plus `ENV GITHUB_TOKEN` with a BuildKit secret mount. The secret may exist only for generation/install commands and must not enter image metadata or filesystem layers.
6. Update `build-*-service.sh` to pass `--secret id=GITHUB_TOKEN,env=GITHUB_TOKEN` and fail clearly when the token is absent.
7. Update `docker/build-push-action` from `build-args` to its `secrets` input.
8. Preserve the current runtime layout for the first cutover. Production-dependency pruning is optional follow-up work and must not be mixed into the migration unless runtime equivalence is demonstrated.

### Documentation

Update the service README, component-test README, and script help text to show Node 20, Corepack, Yarn generation/install/run commands, GitHub Packages token setup, and the BuildKit requirement. State explicitly that npm remains supported only for installing external global infrastructure such as `xq-infra`.

## Acceptance gates per service

All gates apply from a clean clone with no `node_modules` or `generated-clients` directory:

1. `corepack enable` selects Yarn `4.17.0` from `package.json`.
2. `./scripts/generate-api-client.sh <service-name>` succeeds without a globally installed OpenAPI Generator or an existing project lockfile.
3. `yarn install --immutable` succeeds twice without changing `yarn.lock`.
4. Build and unit tests pass. For the pilot, retain the established `142/142` write-service result; for read-service, retain `2/2`.
5. `write-service` lint passes. The known read-service typed-project lint failure is not a Yarn regression, but must not broaden; fixing that baseline is separate from this migration.
6. The production image builds through BuildKit, starts, and passes `/health`.
7. Component workflows pass against the newly built image through the gateway/test environment.
8. Image inspection finds no `GITHUB_TOKEN`, `.npmrc`, `.yarnrc.yml`, Yarn cache, generated client source, or other build-only credential/configuration in the final stage.
9. CI proves a lockfile/config-only change triggers the workflow and an intentionally modified lockfile causes the immutable install to fail.
10. The deployed image passes the service-specific representative workflow before the next repository begins migration.

## Rollback

- Keep each migration in a focused service-local change set so it can be reverted as one unit.
- Before merge, retain the last known-good npm image tag/digest. Deployment rollback means redeploying that immutable image, not rebuilding from a moving branch.
- Source rollback restores `package-lock.json`, npm CI/cache commands, the npm Dockerfile, and npm documentation together. Do not attempt a mixed npm/Yarn state.
- A `write-service` rollback leaves `read-service` untouched. A later `read-service` rollback does not revert the already-proven write migration.
- Package or generated-client contract changes made after cutover require their own compatibility assessment; do not assume reverting only the package manager is sufficient after unrelated releases.

## Completion condition

The migration is complete only when both repositories independently own a pinned Yarn configuration and lockfile, their clean-clone and immutable-install gates pass, component tests exercise Yarn-built images, and both deployed services pass health plus representative API workflows.
