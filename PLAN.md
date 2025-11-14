# E2E API Testing Implementation Plan

## Overview

This document outlines the plan to implement E2E (End-to-End) testing for the XQ Fitness Write Service. The focus is on **API layer testing** with emphasis on **data flow and data correctness** validation across complete workflows.

**Status**: Planning Phase
**Target**: Node.js/Express/PostgreSQL stack
**Scope**: Write Service mutations (POST, PUT, DELETE operations)

---

## 1. Testing Strategy

### Objectives

- ✅ Validate complete workflows (e.g., create routine → add workout day → add sets)
- ✅ Ensure data correctness and persistence in PostgreSQL
- ✅ Verify request/response contract adherence
- ✅ Detect transient failures and implement automatic retry logic
- ✅ Generate comprehensive reports for CI/CD and manual review
- ✅ Integrate with GitHub Actions for automated testing on push/PR

### Test Scope

**What We Test:**
- POST /routines - Create routine
- PUT /routines/{id} - Update routine
- DELETE /routines/{id} - Delete routine
- POST /workout-days - Create workout day
- PUT /workout-days/{id} - Update workout day
- DELETE /workout-days/{id} - Delete workout day
- POST /workout-day-sets - Create sets
- PUT /workout-day-sets/{id} - Update sets
- DELETE /workout-day-sets/{id} - Delete sets
- Multi-step workflows (create routine → add day → add sets)

**Out of Scope (Phase 2):**
- Performance/load testing
- Security/authentication testing
- Read service integration tests

---

## 2. Technology Stack Selection

### Recommended Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Test Runner** | Jest 29.7+ | Industry standard, excellent ecosystem, great reporting |
| **API Testing** | PactumJS 3.7+ | Purpose-built for API E2E testing, built-in retry, superior logging |
| **Language** | TypeScript 5.5+ | Type safety, better DX, easier refactoring |
| **TS Compilation** | @swc/jest | 5-20x faster than ts-jest, production-ready |
| **HTML Reports** | jest-html-reporters | Single-page report with logs, request/response capture |
| **JUnit Reports** | jest-junit | CI/CD standard, GitHub Actions native support |
| **Logging** | chalk 4.1+ | Colored terminal output, beautiful formatting |
| **Service Health** | wait-on | Health checks before test execution |
| **CI/CD** | GitHub Actions | Native integration, artifact upload, test result comments |

### Why PactumJS Over Supertest?

**Comparison:**

| Feature | Supertest | PactumJS | Winner |
|---------|-----------|----------|--------|
| API-focused | Basic | Comprehensive | **PactumJS** |
| Built-in retry | ❌ Manual | ✅ Native | **PactumJS** |
| Request logging | ❌ No | ✅ Yes | **PactumJS** |
| Response logging | ❌ No | ✅ Yes | **PactumJS** |
| Workflow testing | ⚠️ Limited | ✅ Excellent | **PactumJS** |
| Data storage/reuse | ❌ No | ✅ Yes | **PactumJS** |
| Mock servers | ❌ No | ✅ Yes | **PactumJS** |
| TypeScript support | ✅ Good | ⚠️ Adequate | Supertest |
| Community | ✅ Large (7.3M/week) | ⚠️ Small (135k/week) | Supertest |

**Decision**: PactumJS wins for **data flow and correctness validation** use case

---

## 3. Project Structure

```
write-service/
├── tests/
│   ├── e2e/
│   │   ├── routines.test.ts                 # Routine CRUD tests
│   │   ├── workout-days.test.ts             # Workout day CRUD tests
│   │   ├── workout-day-sets.test.ts         # Sets CRUD tests
│   │   └── workflows.test.ts                # Multi-step workflow tests
│   ├── helpers/
│   │   ├── logger.ts                        # Chalk logging setup
│   │   ├── test-data.ts                     # Test data fixtures
│   │   └── db-cleanup.ts                    # Database cleanup utilities
│   ├── setup.ts                             # Jest/Pactum setup
│   └── teardown.ts                          # Cleanup hooks
├── jest.config.js                           # Jest configuration
├── .swcrc                                   # SWC TypeScript compiler config
├── PLAN.md                                  # This file
├── .github/
│   └── workflows/
│       └── e2e-tests.yml                    # GitHub Actions workflow
├── test-reports/                            # Generated reports (gitignored)
│   ├── html/
│   ├── junit/
│   └── coverage/
└── package.json                             # Updated with E2E scripts
```

---

## 4. Implementation Phases

### Phase 1: Setup & Infrastructure (Week 1)

**Objective**: Configure testing framework and CI/CD pipeline

**Tasks:**
1. ✅ Research and select technology stack (COMPLETED)
2. Install dependencies
   - `jest`, `@swc/jest`, `@swc/core`
   - `pactum`
   - `jest-html-reporters`, `jest-junit`
   - `@types/jest`, `typescript`
   - `chalk`, `wait-on`
3. Create Jest configuration
   - Configure `jest.config.js` with SWC transformer
   - Configure `.swcrc` for TypeScript
   - Add reporter plugins (HTML + JUnit)
   - Set timeouts appropriately (30s for E2E)
4. Create test setup files
   - `tests/setup.ts` - Pactum configuration, global retry setup, logging
   - `tests/helpers/logger.ts` - Chalk-based logging for requests/responses
   - `tests/helpers/test-data.ts` - Shared test fixtures
5. Create GitHub Actions workflow
   - Database service setup
   - Service health checks
   - Test execution
   - Report artifacts upload
   - Test result comments on PRs
6. Update `package.json` scripts
   - `test:e2e` - Run all tests
   - `test:e2e:watch` - Development mode
   - `test:e2e:ci` - CI-optimized run
   - `test:e2e:debug` - Debug mode

**Deliverables:**
- Working Jest + PactumJS setup
- GitHub Actions workflow
- Test report structure (HTML + JUnit)

---

### Phase 2: Core Tests (Week 2)

**Objective**: Write comprehensive E2E tests for all CRUD operations

**Tests to Implement:**

#### 2.1 Routines Tests (`tests/e2e/routines.test.ts`)
- ✅ Create routine - valid request
- ✅ Create routine - validation errors (missing name, invalid data)
- ✅ Create routine - response schema validation
- ✅ Update routine - successful update
- ✅ Update routine - non-existent routine (404)
- ✅ Delete routine - successful delete
- ✅ Delete routine - non-existent routine (404)

#### 2.2 Workout Days Tests (`tests/e2e/workout-days.test.ts`)
- ✅ Create workout day - valid request
- ✅ Create workout day - validation errors
- ✅ Create workout day - verify data persisted
- ✅ Update workout day - successful update
- ✅ Update workout day - non-existent day (404)
- ✅ Delete workout day - successful delete
- ✅ Delete workout day - with associated sets

#### 2.3 Workout Day Sets Tests (`tests/e2e/workout-day-sets.test.ts`)
- ✅ Create sets - valid request
- ✅ Create sets - validation errors
- ✅ Create sets - verify data persisted
- ✅ Update sets - successful update
- ✅ Update sets - non-existent sets (404)
- ✅ Delete sets - successful delete

**Features:**
- Request/response logging with chalk
- Response schema validation
- Data extraction for reuse across tests
- Retry mechanism for transient 503 errors

**Deliverables:**
- 20+ passing E2E tests
- HTML report with logs
- JUnit XML for CI

---

### Phase 3: Workflow Tests (Week 3)

**Objective**: Test complete workflows combining multiple operations

**Workflows to Test:**

#### 3.1 Create Routine with Complete Setup
```
1. POST /routines (create routine) → Store ID
2. POST /workout-days (add day 1) → Store ID
3. POST /workout-day-sets (add sets for day 1) → Store ID
4. POST /workout-days (add day 2) → Store ID
5. POST /workout-day-sets (add sets for day 2) → Store ID
6. Verify all data in database
```

#### 3.2 Update and Delete Workflow
```
1. Create routine with days and sets
2. UPDATE routine (name change)
3. Verify update reflected in reads
4. DELETE sets
5. Verify deletion cascade behavior
6. DELETE day
7. Verify orphaned sets handling
```

#### 3.3 Validation Cascade Testing
```
1. Create routine
2. Create day with invalid routineId → Should fail
3. Create day with valid routineId → Should succeed
4. Verify relationships persist correctly
```

**Features:**
- Multi-step test scenarios
- Data extraction between steps
- Automatic retry on 503 errors
- Comprehensive logging of each step
- Database state verification between steps

**Deliverables:**
- 10+ workflow tests
- Enhanced reporting showing test flow
- Documented workflow patterns

---

### Phase 4: CI/CD Integration & Polish (Week 4)

**Objective**: Production-ready testing pipeline

**Tasks:**
1. GitHub Actions workflow refinement
   - Database service dependency management
   - Health check implementation
   - Artifact retention policies
   - Test result reporting
   - PR comment integration
2. Error handling and reporting
   - Clear error messages for failed requests
   - Response body logging on failures
   - Request/response capture in HTML reports
3. Documentation
   - README for test execution
   - Contributing guide for adding new tests
   - Troubleshooting guide
4. Test coverage analysis
   - Coverage configuration in Jest
   - Coverage reporting in artifacts
5. Performance optimization
   - Parallel test execution considerations
   - Test ordering and dependencies
   - Database cleanup between tests

**Deliverables:**
- Production-ready CI/CD pipeline
- Comprehensive documentation
- Test execution metrics

---

## 5. Feature Requirements Checklist

### ✅ Test Execution
- [x] Jest as test runner
- [x] TypeScript support via @swc/jest
- [x] Watch mode for development
- [x] CI mode for GitHub Actions
- [x] Debug mode support

### ✅ API Testing
- [x] PactumJS for API requests
- [x] Request/response logging
- [x] Response schema validation
- [x] Data extraction and reuse across tests
- [x] Workflow/integration testing support

### ✅ Retry Mechanism
- [x] Automatic retry on 503 errors
- [x] Exponential backoff support
- [x] Configurable retry counts and delays
- [x] Retry status code configuration

### ✅ Reporting
- [x] One-page HTML report (`jest-html-reporters`)
  - Request/response logs included
  - Detailed failure information
  - Expandable/collapsible test output
- [x] JUnit XML report (`jest-junit`)
  - GitHub Actions native support
  - CI tool integration
- [x] Console logging with chalk
  - Color-coded output
  - Visual hierarchy
  - Request/response formatting

### ✅ CI/CD Integration
- [x] GitHub Actions workflow
  - PostgreSQL service dependency
  - Service health checks
  - Test artifact uploads
  - Test result comments on PRs
  - Failed test detection
- [x] Report artifacts
  - HTML reports stored and accessible
  - JUnit XML for CI tool parsing
  - Coverage reports (optional)

---

## 6. Configuration Files Overview

### jest.config.js
```javascript
- SWC transformer for TypeScript
- Node.js test environment
- 30 second timeout for E2E tests
- HTML + JUnit reporters
- Coverage collection
- Setup files for initialization
```

### .swcrc
```json
- TypeScript parsing
- ES2022 target
- CommonJS module output
```

### package.json Scripts
```json
"test:e2e": "jest --runInBand --forceExit"
"test:e2e:watch": "jest --watch"
"test:e2e:ci": "jest --ci --coverage"
"test:e2e:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
```

### .github/workflows/e2e-tests.yml
```yaml
- PostgreSQL service
- Node.js setup with npm caching
- Wait-on health checks
- Test execution
- Artifact upload
- Test result reporting
```

---

## 7. Dependencies

### Core Testing
```json
{
  "jest": "^29.7.0",
  "@swc/jest": "^0.2.36",
  "@swc/core": "^1.7.0",
  "pactum": "^3.7.1"
}
```

### TypeScript
```json
{
  "typescript": "^5.5.4",
  "@types/jest": "^29.5.12",
  "@types/node": "^22.5.0"
}
```

### Reporting
```json
{
  "jest-html-reporters": "^3.1.7",
  "jest-junit": "^16.0.0",
  "chalk": "^4.1.2"
}
```

### Utilities
```json
{
  "wait-on": "^8.0.1"
}
```

**Total Additional Packages**: 11 dev dependencies
**Installation**: `npm install --save-dev <packages>`

---

## 8. Example Test Structure

```typescript
// tests/e2e/routines.test.ts

import pactum from 'pactum';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

describe('Routines API - CRUD Operations', () => {
  beforeAll(() => {
    pactum.request.setBaseUrl(BASE_URL);
  });

  describe('POST /routines', () => {
    test('should create routine with valid data', async () => {
      await pactum
        .spec()
        .post('/routines')
        .withJson({
          name: 'Full Body Workout',
          description: 'Complete workout routine',
          isActive: true,
        })
        .retry({ count: 3, delay: 1000, status: [503] })
        .expectStatus(201)
        .expectJsonLike({ name: 'Full Body Workout' })
        .stores('routineId', 'id');
    });

    test('should reject invalid request', async () => {
      await pactum
        .spec()
        .post('/routines')
        .withJson({ description: 'Missing name' })
        .expectStatus(400)
        .expectJsonLike({ code: 'VALIDATION_ERROR' });
    });
  });

  describe('Workflow: Complete routine setup', () => {
    test('should create routine with days and sets', async () => {
      // Step 1: Create routine
      const routineId = await pactum
        .spec()
        .post('/routines')
        .withJson({ name: 'PPL Split', isActive: true })
        .expectStatus(201)
        .returns('id');

      // Step 2: Add workout day
      const dayId = await pactum
        .spec()
        .post('/workout-days')
        .withJson({
          routineId,
          dayNumber: 1,
          dayName: 'Push Day',
        })
        .expectStatus(201)
        .returns('id');

      // Step 3: Add sets
      await pactum
        .spec()
        .post('/workout-day-sets')
        .withJson({
          workoutDayId: dayId,
          muscleGroupId: 1,
          numberOfSets: 4,
        })
        .expectStatus(201);
    });
  });
});
```

---

## 9. GitHub Actions Workflow Overview

### Triggers
- Every push to `main` and `develop` branches
- Every pull request to `main` and `develop`

### Jobs
1. **Setup**: Node.js, dependencies, PostgreSQL service
2. **Health Checks**: Verify DB and API readiness
3. **Test Execution**: Run full E2E test suite
4. **Reporting**: Generate HTML and JUnit reports
5. **Artifacts**: Upload reports with 7-day retention
6. **Notifications**: Comment on PRs with test results

### Failure Handling
- Tests marked as failure if any suite fails
- Artifacts uploaded even on failure for debugging
- Service logs captured for troubleshooting

---

## 10. Success Criteria

### Immediate (Phase 1-2)
- [ ] All CRUD tests passing (20+ tests)
- [ ] HTML report generated with request/response logs
- [ ] JUnit XML report generated
- [ ] GitHub Actions workflow executing successfully
- [ ] Automatic retry on 503 errors working
- [ ] All tests run in < 2 minutes

### Medium-term (Phase 3-4)
- [ ] All workflow tests passing (10+ tests)
- [ ] Test documentation complete
- [ ] PR integration working (test comments)
- [ ] Coverage reporting enabled
- [ ] Team can easily add new tests

### Long-term Metrics
- [ ] 100% coverage of write service endpoints
- [ ] Zero flaky tests (all retries successful)
- [ ] <30 minute CI/CD execution
- [ ] Zero test-related PR blocks

---

## 11. Timeline & Milestones

| Phase | Duration | Start | End | Deliverables |
|-------|----------|-------|-----|--------------|
| **Phase 1: Setup** | 1 week | Week 1 | Week 1 | Config files, GitHub Actions, npm scripts |
| **Phase 2: Core Tests** | 1 week | Week 2 | Week 2 | CRUD tests for all 3 resources |
| **Phase 3: Workflows** | 1 week | Week 3 | Week 3 | Multi-step integration tests |
| **Phase 4: Polish** | 1 week | Week 4 | Week 4 | Documentation, optimization, handoff |

**Total Timeline**: 4 weeks to production-ready E2E testing

---

## 12. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Database setup complexity in CI | High | Use published Docker image, health checks |
| Test flakiness (timing issues) | High | Implement retry, wait-on health checks |
| Slow test execution | Medium | Use --runInBand, optimize queries, parallel suites |
| PactumJS learning curve | Low | Good documentation, simple API, examples provided |
| Report storage costs | Low | 7-day retention policy, compress artifacts |

---

## 13. Next Steps

1. **Approve this PLAN.md** - Review and confirm approach
2. **Phase 1 Implementation** - Set up Jest, PactumJS, GitHub Actions
3. **Phase 2 Implementation** - Write core CRUD tests
4. **Phase 3 Implementation** - Add workflow tests
5. **Phase 4 Polish** - Documentation and optimization
6. **Team Training** - Show team how to add new tests
7. **Maintenance** - Keep tests updated as API evolves

---

## 14. References

- **PactumJS**: https://pactumjs.github.io/
- **Jest**: https://jestjs.io/
- **SWC**: https://swc.rs/
- **jest-html-reporters**: https://www.npmjs.com/package/jest-html-reporters
- **jest-junit**: https://www.npmjs.com/package/jest-junit
- **GitHub Actions Testing**: https://docs.github.com/en/actions/use-cases-and-examples/testing-code-in-your-repository

---

## Approval

- [ ] Product Manager: _____________________ Date: _____
- [ ] Tech Lead: _____________________ Date: _____
- [ ] QA Lead: _____________________ Date: _____

---

**Document Version**: 1.0
**Created**: 2025-11-10
**Last Updated**: 2025-11-10
**Status**: Ready for Review
