---
name: xq-infra
description: Guides use of the xq-infra CLI for spinning up local test environments (database, services, gateway). Use when running component tests, integration tests, troubleshooting test environment startup, or working with xq-test-infra, xq-infra generate, xq-infra up, or xq-infra down.
---

# xq-infra CLI

CLI for running local test environments: database, backend services, and gateway. Required for component and integration tests that hit real APIs.

## Installation

```bash
npm install -g @chauhaidang/xq-test-infra@1.0.3
```

Requires GitHub Packages access (`registry-url: https://npm.pkg.github.com/`, scope `@chauhaidang`). Set `NODE_AUTH_TOKEN` or `.npmrc` if auth fails.

## Core Commands

| Command | Purpose |
|---------|---------|
| `xq-infra generate -f ./test-env` | Generate config from `test-env/` (e.g. nginx-gateway.conf) |
| `xq-infra up` | Start all services (DB, services, gateway) |
| `xq-infra down` | Stop and remove containers |
| `xq-infra logs` | Show container logs (useful when debugging) |

**Important**: Run `xq-infra` from the directory that contains `test-env/`. Do not use a different path.

---

## Workflow: Write-Service Component Tests

From **write-service/** (same directory as `test-env/`):

```bash
# 1. Build the service container image
./build-write-service.sh

# 2. Generate API client and install dependencies
npm run generate:client
npm install

# 3. Start test environment
xq-infra generate -f ./test-env
xq-infra up

# 4. Run component tests
npm run test:component:ci
# or: npm run test:component

# 5. Tear down (when done)
xq-infra down
```

Defaults: `API_BASE_URL=http://localhost:8080/xq-fitness-write-service/api/v1`, `HEALTH_CHECK_URL=http://localhost:8080/xq-fitness-write-service/health`.

---

## Workflow: Other Services (e.g. Mobile)

From the directory that contains `test-env/` (e.g. **mobile/**):

```bash
xq-infra generate -f ./test-env
xq-infra up
# Run tests...
xq-infra down
```

---

## test-env Structure

Typical files:

| File | Purpose |
|------|---------|
| `xq.config.yml` | Port range, dependency groups (e.g. `database`) |
| `xq-fitness-db.service.yml` | PostgreSQL (port 5432) |
| `xq-fitness-write-service.service.yml` | Write API container |
| `xq-fitness-read-service.service.yml` | Read API (if present) |
| `xq-gateway` | Auto-injected by xq-infra; exposes services on port 8080 |

Write-service test-env: `xq.config.yml`, `xq-fitness-db.service.yml`, `xq-fitness-write-service.service.yml`.

---

## Gateway URLs

Tests use the gateway on port 8080:

- Write: `${GATEWAY_URL}/xq-fitness-write-service/api/v1`
- Read: `${GATEWAY_URL}/xq-fitness-read-service/api/v1` (if present)

---

## Port Conflicts

If startup fails or you see "address already in use":

1. Check for other stacks (read-service, write-service, mobile) using the same ports
2. Run `xq-infra down` in those project directories
3. Avoid running multiple test envs that share ports (5432, 8080)

---

## CI Usage

```yaml
- run: npm install -g @chauhaidang/xq-test-infra@1.0.3
- run: xq-infra generate -f ./test-env && xq-infra up
- run: npm run test:component:ci
- if: always()
  run: |
    xq-infra logs
    xq-infra down
```

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| `xq-infra` not found | Run `npm install -g @chauhaidang/xq-test-infra@1.0.3` |
| Port in use | Run `xq-infra down` in other project dirs; stop conflicting containers |
| Services not ready | Wait a few seconds after `xq-infra up` before running tests |
| Auth errors (npm) | Ensure `NODE_AUTH_TOKEN` or `.npmrc` for GitHub Packages |
