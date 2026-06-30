Goal: retire `read-service` as a separately deployed/read API service while preserving current mobile and backend behavior through `write-service` at `/xq-fitness-write-service/api/v1`.

Current facts:
- Root guidance already marks `read-service/` deprecated and says read APIs are served by `write-service`.
- `write-service` exposes the former read endpoints: `/muscle-groups`, `/routines`, `/routines/{routineId}`, `/routines/{routineId}/days`, `/routines/{routineId}/weekly-report`, and `/exercises`.
- Mobile still constructs a separate `READ_SERVICE_URL` pointing at `/xq-fitness-read-service/api/v1`.
- Local/test environment files still reference the read-service image and gateway path.
- `read-service/` contains a nested Git repo and service-specific build/deploy/test artifacts, so physical deletion should be a final step after client and environment cutover.

## #1: What Is The Deprecation Target State?

Blocked by: none
Type: Discuss

### Question

Should `read-service` remain as archived reference code in this repository, or should it be removed from the active workspace after clients and environments stop using it?

### Answer

Proposed target: stop deploying and stop using `read-service`; keep the read API surface in `write-service`; keep `read-service/` temporarily as archived reference during soak; remove it from the active workspace only after the mobile app, test environments, deployment spec, and docs no longer depend on it.

## #2: Is Write-Service Contract Parity Complete?

Blocked by: #1
Type: Research

### Question

Does `write-service/api/write-service-api.yaml` fully cover the live `read-service/api/read-service-api.yaml` contract, including paths, query params, response shapes, status codes, and error payloads used by mobile/integration tests?

### Answer

Open. Initial repo scan shows all read paths exist in `write-service`, but parity still needs a contract diff and targeted component/integration checks before the read-service endpoint can be treated as rollback-only.

## #3: How Should Mobile Cut Over?

Blocked by: #2
Type: Discuss

### Question

Should mobile collapse `readApi` and `writeApi` into one axios client now, or keep both exported clients temporarily while both point at `WRITE_SERVICE_URL`?

### Answer

Open. Recommended default: point read calls at `WRITE_SERVICE_URL` first with minimal churn, then collapse naming/logging in a cleanup pass. That lowers behavioral risk and makes rollback easier during soak.

## #4: Which Local/Test Environments Still Need The Read-Service Container?

Blocked by: #2
Type: Research

### Question

Which `test-env`, E2E, database, and mobile integration workflows still launch or expect `xq-fitness-read-service`, and can each be moved to the unified write-service image/path?

### Answer

Open. Known references exist in `mobile/e2e/test-env`, `mobile/test-env`, `database/test-env`, `read-service/test-env`, and mobile integration helper docs/tests.

## #5: What Is The Deployment Retirement Sequence?

Blocked by: #2, #3, #4
Type: Discuss

### Question

What production sequence safely retires the DigitalOcean read-service component and optional `/xq-fitness-read-service/` nginx alias?

### Answer

Open. Existing `write-service/README.md` recommends manual retirement after soak. The sequence should define health checks, rollback criteria, how long the read-service component stays running, and when to remove or retain the nginx alias.

## #6: When Can Read-Service Code Be Removed Or Archived?

Blocked by: #5
Type: Discuss

### Question

After production retirement, should this repo delete `read-service/`, move it under an archive path, or leave it read-only with stronger documentation?

### Answer

Open. Deletion is cleanest long-term, but it should wait until no test, mobile, database, docs, generated client, or deployment reference points at `read-service`.

