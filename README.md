# XQ Fitness Write Service

Unified backend for XQ Fitness read and write APIs. All endpoints are defined in [`api/write-service-api.yaml`](api/write-service-api.yaml).

Gateway path: `/xq-fitness-write-service/api/v1`

## Local development

```bash
corepack enable
export GITHUB_TOKEN=...   # required for private packages
./scripts/generate-api-client.sh write-service
yarn install --immutable
yarn build
yarn dev
```

## Tests

```bash
yarn test:unit
yarn test:component:local   # requires xq-infra
yarn test:all
```

## Deployment

DigitalOcean App Platform via `.github/workflows/ci.yml`. Updates **write-service** component only; read-service on DO is retired manually after soak.

### Manual read-service retirement (post-soak)

After merged write-service is deployed and mobile reads use `/xq-fitness-write-service`:

1. Verify component tests pass on the write path (`yarn test:component:local` or CI).
2. Smoke production: `GET .../xq-fitness-write-service/api/v1/muscle-groups`, weekly report, create routine, snapshot.
3. Keep the read-service DO component running during soak for rollback.
4. Remove read-service from the `xq-fitness` app in the DO console (or `doctl apps update` with an edited spec). **Do not** automate this in CI.
5. Optionally archive `xq-fitness-read` GitHub repo and disable read-service CI.

The nginx `/xq-fitness-read-service/` alias can remain as a safety net until all clients are updated.
