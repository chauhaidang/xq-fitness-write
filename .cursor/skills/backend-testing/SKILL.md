---
name: backend-testing
description: Guides unit, integration, and component testing for Node.js/Express backend services. Use when writing, fixing, or running unit tests, integration tests, or component tests for the write-service or similar backend APIs.
---

# Backend Testing

Guidance for unit, integration, and component tests in the write-service (Jest + TypeScript).

## Test Pyramid Overview

| Type | Scope | Mocks | Run Command |
|------|-------|-------|--------------|
| **Unit** | Single module (service, controller, model) | Yes – external deps | `npm run test:unit` |
| **Integration** | API routes + real DB (no full container stack) | No – real DB | Not yet configured |
| **Component** | Full HTTP API + real DB + containers | No – live service | `npm run test:component` |

---

## Unit Tests

### Location and Config

- **Path**: `test/unit/**/*.test.ts`
- **Config**: `jest.config.unit.js` (ts-jest, node env)
- **Run**: `npm run test:unit`

### Patterns

**1. Mock dependencies at module level**

```typescript
jest.mock('../../../src/models/exerciseModel');
jest.mock('../../../src/models/workoutDayModel');

const mockExerciseModel = ExerciseModel as jest.Mocked<typeof ExerciseModel>;
const mockWorkoutDayModel = WorkoutDayModel as jest.Mocked<typeof WorkoutDayModel>;
```

**2. Controllers – mock req/res**

```typescript
req = { params: {}, body: {} };
res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
```

**3. Services – mock models, assert calls**

```typescript
mockWorkoutDayModel.exists.mockResolvedValue(true);
mockExerciseModel.create.mockResolvedValue(created);

const result = await ExerciseService.create(input);

expect(mockWorkoutDayModel.exists).toHaveBeenCalledWith(1);
expect(mockExerciseModel.create).toHaveBeenCalledWith(input);
expect(result).toEqual(created);
```

**4. Cleanup**

```typescript
beforeEach(() => jest.clearAllMocks());
afterEach(() => consoleErrorSpy?.mockRestore());
```

### Coverage

- Excluded: `src/index.ts`, `src/config/database.ts`
- Reports: `coverage/` (lcov)

---

## Integration Tests

### Purpose

Test API routes with a real database, no mocks. Exercise request validation, DB queries, and error handling without running the full container stack.

### When to Add

- Need to verify SQL, transactions, or DB constraints
- Want faster feedback than component tests
- Component tests are too heavy for a given change

### Suggested Setup (if adding)

1. **Config**: `jest.config.integration.js` with `testMatch: ['**/test/integration/**/*.test.ts']`
2. **DB**: Use test DB (e.g. `xq_fitness` with test credentials) or Docker Compose
3. **Pattern**: Start Express app, use `supertest` against `app`, run migrations, seed if needed
4. **Cleanup**: Truncate tables or use transactions per test

### Example Pattern

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('POST /api/v1/routines', () => {
  it('creates routine and persists to DB', async () => {
    const res = await request(app)
      .post('/api/v1/routines')
      .send({ name: 'Test', isActive: true })
      .expect(201);
    expect(res.body.id).toBeDefined();
    // Optionally query DB to verify
  });
});
```

---

## Component Tests

Component tests hit the live API over HTTP with a real database. Follow the project workflow.

### Reference

**Use the component-test rule**: `.cursor/rules/component-test.mdc` (or `write-service/.cursor/rules/component-test.mdc`).

### Quick Workflow

1. **Build**: `./build-write-service.sh` (from write-service root)
2. **Client**: `npm run generate:client` then `npm install`
3. **Env**: `xq-infra generate -f ./test-env` and `xq-infra up`
4. **Run**: `npm run test:component` or `npm run test:component:ci`
5. **Teardown**: `xq-infra down`

### Structure

- **Tests**: `test/component/workflows/**/*.test.ts`
- **Helpers**: `test/component/helpers/` (api-client, test-data, cleanup, database)
- **Setup/Teardown**: `test/component/setup.ts`, `teardown.ts`
- **Config**: `jest.config.component.js` (uses `@chauhaidang/xq-test-utils`)

### Patterns

- Use `ApiClient` from `helpers/api-client.ts` (generated client wrapper)
- Use `testData` from `helpers/test-data.ts` for unique payloads
- Use `CleanupHelper` to track and delete created resources
- Use `DatabaseHelper` from `@chauhaidang/xq-test-utils` for DB assertions
- Default URLs: `API_BASE_URL`, `HEALTH_CHECK_URL` (test-env gateway on 8080)

### Port Conflicts

If startup fails, check for other stacks (e.g. read-service) using the same ports. Run `xq-infra down` in other service directories.

---

## Summary Checklist

**Unit tests**

- [ ] Mock all external modules (models, services)
- [ ] Use `jest.clearAllMocks()` in `beforeEach`
- [ ] Assert both return values and mock call arguments

**Component tests**

- [ ] Follow `.cursor/rules/component-test.mdc`
- [ ] Build image, generate client, run `xq-infra up` before tests
- [ ] Use `CleanupHelper` and unique test data

**Integration tests (if added)**

- [ ] Use real DB, no mocks
- [ ] Isolate tests (transactions or truncate)
- [ ] Use `supertest` against the Express app
