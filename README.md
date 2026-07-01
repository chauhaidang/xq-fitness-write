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

DigitalOcean App Platform via `.github/workflows/ci.yml`. Updates the unified **write-service** component only.

### Read-service decommission status

`read-service` is decommissioned. Former read endpoints are served by this service at `/xq-fitness-write-service/api/v1`.

Production smoke checks should target the write-service gateway path: `GET .../xq-fitness-write-service/api/v1/muscle-groups`, weekly report, create routine, and snapshot.
