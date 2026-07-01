Goal: retire `read-service` as a separately deployed/read API service while preserving current mobile and backend behavior through `write-service` at `/xq-fitness-write-service/api/v1`.

Current facts:
- Root guidance already marks `read-service/` deprecated and says read APIs are served by `write-service`.
- `write-service` exposes the former read endpoints: `/muscle-groups`, `/routines`, `/routines/{routineId}`, `/routines/{routineId}/days`, `/routines/{routineId}/weekly-report`, and `/exercises`.
- Mobile read calls use `/xq-fitness-write-service/api/v1`.
- Local/test environment files no longer need a read-service container.
- `read-service/` contains a nested Git repo and is kept as archived reference code only.

## #1: What Is The Deprecation Target State?

Blocked by: none
Type: Discuss

### Question

Should `read-service` remain as archived reference code in this repository, or should it be removed from the active workspace after clients and environments stop using it?

### Answer

Resolved target: stop deploying and stop using `read-service`; keep the read API surface in `write-service`; keep `read-service/` as archived reference code only.

## #2: Is Write-Service Contract Parity Complete?

Blocked by: #1
Type: Research

### Question

Does `write-service/api/write-service-api.yaml` fully cover the live `read-service/api/read-service-api.yaml` contract, including paths, query params, response shapes, status codes, and error payloads used by mobile/integration tests?

### Answer

Resolved. `write-service/api/write-service-api.yaml` covers every operation from `read-service/api/read-service-api.yaml`:

- `GET /muscle-groups`
- `GET /routines`
- `GET /exercises`
- `GET /routines/{routineId}`
- `GET /routines/{routineId}/days`
- `GET /routines/{routineId}/weekly-report`

For those operations, path/method coverage, `operationId`, path/query parameters, response status codes, and response schema references match. Shared schema definitions are compatible: no read-service schema is missing, no read-service property is missing in the write-service schemas, and write-service adds no new required fields. Differences are documentation/example changes plus the additive optional `Error.details` field.

## #3: How Should Mobile Cut Over?

Blocked by: none
Type: Discuss

### Question

Should mobile collapse `readApi` and `writeApi` into one axios client now, or keep both exported clients temporarily while both point at `WRITE_SERVICE_URL`?

### Answer

Resolved. Mobile read calls now point at `WRITE_SERVICE_URL` and use `/xq-fitness-write-service/api/v1`.

## #4: Which Local/Test Environments Still Need The Read-Service Container?

Blocked by: #2
Type: Research

### Question

Which `test-env`, E2E, database, and mobile integration workflows launched or expected the old read-service container, and have they been moved to the unified write-service image/path?

### Answer

Resolved. Active mobile and database test environments do not launch the old read-service container. The remaining read-service test environment lives inside the archived `read-service/` repo only.

## #5: What Is The Deployment Retirement Sequence?

Blocked by: #2, #3, #4
Type: Discuss

### Question

What production sequence safely retires the DigitalOcean read-service component and legacy gateway alias?

### Answer

Resolved. Production should target only `/xq-fitness-write-service/api/v1`; `read-service` CI/deploy is manual-only and the DigitalOcean read-service component should remain removed.

## #6: When Can Read-Service Code Be Removed Or Archived?

Blocked by: #5
Type: Discuss

### Question

After production retirement, should this repo delete `read-service/`, move it under an archive path, or leave it read-only with stronger documentation?

### Answer

Resolved. Keep `read-service/` as archived reference code. Do not deploy it or add new API behavior there.
