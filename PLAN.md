# E2E Testing Implementation Plan - Jest + PactumJS

## Overview

This document outlines the plan to implement **E2E (End-to-End) workflow testing** for the XQ Fitness Write Service using **Jest** and **PactumJS**.

**Status**: Planning Phase
**Target**: Node.js/Express/PostgreSQL stack
**Focus**: Multi-step user workflows and data flow validation

---

## 1. Testing Strategy & Separation of Concerns

### Test Pyramid

```
           /\
          /  \        E2E (Jest + PactumJS)
         /    \       - Multi-step workflows
        /------\      - Complete user journeys
       /        \     - Cross-endpoint integration
      /          \
     /------------\   Functional (Bruno)
    /              \  - Individual endpoint testing
   /                \ - API contract validation
  /------------------\ Unit (Jest)
                      - Business logic
                      - Validators, models
                      - Pure functions
```

### Layer Definitions

| Layer | Focus | Technology | Location | Test Type |
|-------|-------|------------|----------|-----------|
| **Unit** | Code logic | Jest + Sinon | `test/unit/` | Isolated functions |
| **Functional** | API contracts | Bruno | `test/functional/` | Single endpoint operations |
| **E2E** | User workflows | Jest + PactumJS | `test/e2e/` | Multi-step scenarios |

---

## 2. E2E Testing Scope

### What We Test in E2E Layer

**Focus**: Complete user workflows simulating real-world scenarios

✅ **Multi-step workflows:**
- Create routine → Add workout days → Add sets → Verify complete setup
- Update routine → Modify days → Update sets → Verify changes
- Delete workflow → Verify cascade behavior
- Bulk operations (e.g., PPL split creation)

✅ **Data flow validation:**
- Data persistence across endpoints
- State management between requests
- ID propagation through workflow steps
- Cascade delete behavior

✅ **Integration scenarios:**
- Cross-endpoint dependencies
- Transaction-like behavior
- Error recovery in multi-step workflows

### What We DON'T Test in E2E Layer

❌ Individual endpoint validation (→ Functional tests in Bruno)
❌ Request/response schema validation (→ Functional tests)
❌ 400/404 error scenarios (→ Functional tests)
❌ Performance/load testing
❌ Security penetration testing

---

## 3. Technology Stack

### Core Technologies

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Test Runner** | Jest | 30.2+ | Already in project, excellent ecosystem |
| **API Client** | PactumJS | 3.7+ | Built for API workflows, data stores, retry logic |
| **Language** | JavaScript | ES2022 | Match project (no TypeScript overhead) |
| **Assertions** | Jest matchers + PactumJS | Built-in | Comprehensive assertion library |
| **Logging** | Custom logger | - | Request/response logging for debugging |
| **Health Check** | wait-on | 8.0+ | Ensure services ready before tests |
| **CI/CD** | GitHub Actions | - | Already configured |

### Why PactumJS?

**Key Features for E2E Workflows:**
- ✅ Built-in data stores (pass IDs between requests)
- ✅ Automatic retry mechanism for flaky endpoints
- ✅ Request/response logging
- ✅ Spec reusability for common patterns
- ✅ Built-in mock server (if needed for external services)
- ✅ Fluent API for readable tests

**Comparison with Alternatives:**

| Feature | Supertest | Axios | PactumJS |
|---------|-----------|-------|----------|
| Workflow focus | ❌ | ⚠️ | ✅ |
| Data stores | ❌ | ❌ | ✅ |
| Auto retry | ❌ | ⚠️ | ✅ |
| Request logging | ❌ | ⚠️ | ✅ |
| Mock servers | ❌ | ❌ | ✅ |

---

## 4. Project Structure

### Before (Current)
```
write-service/
├── e2e/                                # Standalone Bruno E2E
│   ├── package.json                    # E2E-specific dependencies
│   ├── tsconfig.json
│   ├── .swcrc
│   ├── helpers/
│   │   ├── auth.ts
│   │   ├── validators.ts
│   │   └── test-data.ts
│   └── workflows/                      # Bruno .bru files
│       └── UpdateDeleteWorkout/
├── test/
│   ├── unit/                           # Jest unit tests
│   └── functional/                     # Bruno functional tests
└── package.json                        # Root dependencies (API server)
```

### After (Target)
```
write-service/
├── e2e/                                # Standalone Jest + PactumJS E2E
│   ├── package.json                    # E2E-specific dependencies (UPDATED)
│   ├── tsconfig.json                   # TypeScript config (UPDATED)
│   ├── jest.config.ts                  # Jest config for E2E
│   ├── README.md                       # E2E documentation (UPDATED)
│   │
│   ├── workflows/                      # Test files (TypeScript)
│   │   ├── create-complete-routine.test.ts
│   │   ├── update-delete-workflow.test.ts
│   │   ├── bulk-ppl-setup.test.ts
│   │   └── cascade-delete.test.ts
│   │
│   ├── helpers/                        # Helper utilities (TypeScript)
│   │   ├── logger.ts                   # Request/response logging
│   │   ├── test-data.ts                # Test data generators
│   │   ├── cleanup.ts                  # Database cleanup
│   │   └── api-client.ts               # PactumJS wrapper
│   │
│   ├── setup.ts                        # Global setup (PactumJS config)
│   └── teardown.ts                     # Global teardown
│
├── test/
│   ├── unit/                           # Jest unit tests (JavaScript)
│   └── functional/                     # Bruno functional tests
│
├── .github/
│   └── workflows/
│       └── e2e-tests.yml               # E2E CI workflow (UPDATED)
│
└── package.json                        # Root dependencies (API server only)
```

### Key Changes
1. ✅ **Keep** `e2e/package.json` (separate dependencies)
2. ✅ **Replace** Bruno with Jest + PactumJS
3. ✅ **Keep** TypeScript (`.ts` files)
4. ✅ **Update** `e2e/package.json` dependencies
5. ✅ **Remove** `.swcrc` (use ts-jest instead)
6. ✅ **Remove** Bruno workflows
7. ✅ **Add** Jest config in `e2e/`

---

## 5. Implementation Phases

### Phase 1: Setup & Infrastructure (Week 1)

**Objective**: Configure Jest + PactumJS for E2E testing

#### Tasks

1. **Install dependencies**
   ```bash
   npm install --save-dev pactum wait-on
   ```

2. **Create Jest E2E configuration** (`jest.e2e.config.js`)
   - Separate config from unit tests
   - Longer timeout (60s for workflows)
   - Serial execution (--runInBand)
   - Setup/teardown files
   - Coverage exclusions for E2E

3. **Create PactumJS setup** (`test/e2e/setup.js`)
   - Configure base URL
   - Setup request/response logging
   - Configure retry logic
   - Global timeout settings
   - Custom reporters

4. **Create helper utilities**
   - `logger.js` - Colored console logging for requests/responses
   - `test-data.js` - Test data generators with unique IDs
   - `cleanup.js` - Database cleanup between tests
   - `assertions.js` - Custom assertions for workflows

5. **Update package.json scripts**
   ```json
   {
     "test:e2e": "jest --config jest.e2e.config.js --runInBand",
     "test:e2e:watch": "jest --config jest.e2e.config.js --watch",
     "test:e2e:ci": "jest --config jest.e2e.config.js --runInBand --ci --coverage",
     "test:e2e:debug": "node --inspect-brk node_modules/.bin/jest --config jest.e2e.config.js --runInBand"
   }
   ```

6. **Update GitHub Actions** (`.github/workflows/e2e-tests.yml`)
   - Keep existing PostgreSQL service
   - Add step to run E2E tests: `npm run test:e2e:ci`
   - Upload test reports

#### Deliverables

- ✅ Jest + PactumJS configured
- ✅ Helper utilities ready
- ✅ npm scripts for E2E tests
- ✅ CI/CD integration updated

---

### Phase 2: Core Workflow Tests (Week 2)

**Objective**: Implement primary user workflow tests

#### 2.1 Create Complete Routine Workflow

**File**: `test/e2e/workflows/create-complete-routine.test.js`

**Workflow Steps:**
1. Create routine
2. Add workout day 1 (e.g., Push Day)
3. Add sets for day 1
4. Add workout day 2 (e.g., Pull Day)
5. Add sets for day 2
6. Verify all data persisted correctly

**Test Coverage:**
- Data flow across 3 endpoints
- ID propagation (routine → days → sets)
- Multiple entities created in sequence
- Final state verification

**Example Structure:**
```javascript
describe('E2E: Create Complete Routine Workflow', () => {
  let routineId, day1Id, day2Id;

  test('should create complete workout routine with days and sets', async () => {
    // Step 1: Create routine
    routineId = await pactum
      .spec()
      .post('/api/v1/routines')
      .withJson({ name: 'PPL Split', isActive: true })
      .expectStatus(201)
      .returns('id');

    // Step 2: Add day 1
    day1Id = await pactum
      .spec()
      .post('/api/v1/workout-days')
      .withJson({ routineId, dayNumber: 1, dayName: 'Push Day' })
      .expectStatus(201)
      .returns('id');

    // Step 3: Add sets for day 1
    await pactum
      .spec()
      .post('/api/v1/workout-day-sets')
      .withJson({ workoutDayId: day1Id, muscleGroupId: 1, numberOfSets: 4 })
      .expectStatus(201);

    // ... continue for day 2
  });
});
```

#### 2.2 Update & Delete Workflow

**File**: `test/e2e/workflows/update-delete-workflow.test.js`

**Workflow Steps:**
1. Create routine with days and sets
2. Update routine name
3. Update workout day
4. Update sets
5. Delete sets (verify cascade)
6. Delete workout day (verify orphan handling)
7. Delete routine (verify complete cleanup)

**Test Coverage:**
- Update operations across workflow
- Delete cascade behavior
- Data consistency after updates
- Cleanup verification

#### 2.3 Bulk PPL Setup Workflow

**File**: `test/e2e/workflows/bulk-ppl-setup.test.js`

**Workflow Steps:**
1. Create PPL routine
2. Add Push day with 5 exercises
3. Add Pull day with 5 exercises
4. Add Leg day with 4 exercises
5. Verify all 14 exercise sets created
6. Verify routine structure

**Test Coverage:**
- Bulk data creation
- Complex workflow with multiple entities
- Performance of sequential creates

#### 2.4 Error Recovery in Workflows

**File**: `test/e2e/workflows/error-recovery.test.js`

**Workflow Steps:**
1. Create routine
2. Attempt to add day with invalid routineId (should fail)
3. Retry with correct routineId (should succeed)
4. Verify partial failure doesn't corrupt data

**Test Coverage:**
- Error handling in multi-step workflows
- Data integrity after partial failures
- Retry logic validation

#### Deliverables

- ✅ 4 workflow test files
- ✅ 15+ end-to-end test scenarios
- ✅ Request/response logging enabled
- ✅ All tests passing locally

---

### Phase 3: Advanced Scenarios (Week 3)

**Objective**: Complex workflows and edge cases

#### 3.1 Cascade Delete Validation

**Workflow:**
- Create routine with 3 days, each with 5 sets (15 total sets)
- Delete routine
- Verify all 3 days deleted (cascade)
- Verify all 15 sets deleted (cascade)

#### 3.2 Concurrent Workflow Test

**Workflow:**
- Create 3 routines in parallel (using Promise.all)
- Verify no ID conflicts
- Verify all data isolated correctly

#### 3.3 Large Dataset Workflow

**Workflow:**
- Create routine with 7 workout days
- Add 5-8 sets per day (35-50 total sets)
- Update multiple days simultaneously
- Verify performance and data integrity

#### Deliverables

- ✅ 3 advanced workflow test files
- ✅ Edge case coverage
- ✅ Performance baseline established

---

### Phase 4: Polish & Documentation (Week 4)

**Objective**: Production-ready E2E test suite

#### Tasks

1. **Code quality**
   - Refactor common patterns into helpers
   - Add JSDoc comments
   - Consistent error handling

2. **Reporting**
   - Enhanced console output with colors
   - Request/response capture in reports
   - HTML report generation (optional: jest-html-reporters)

3. **Documentation**
   - **README.md** for E2E tests
   - How to run tests locally
   - How to add new workflow tests
   - Troubleshooting guide

4. **CI/CD optimization**
   - Parallel test execution exploration
   - Test result comments on PRs
   - Artifact retention policies

5. **Performance optimization**
   - Database connection pooling
   - Cleanup optimization
   - Test execution time < 3 minutes

#### Deliverables

- ✅ Production-ready E2E suite
- ✅ Complete documentation
- ✅ CI/CD fully integrated
- ✅ Team training complete

---

## 6. Configuration Files

### jest.e2e.config.js

```javascript
module.exports = {
  displayName: 'E2E Tests',
  testEnvironment: 'node',
  testMatch: ['**/test/e2e/**/*.test.js'],
  testTimeout: 60000, // 60 seconds for workflows
  setupFilesAfterEnv: ['<rootDir>/test/e2e/setup.js'],
  globalTeardown: '<rootDir>/test/e2e/teardown.js',
  maxWorkers: 1, // Serial execution for E2E
  verbose: true,
  bail: false, // Continue on first failure
  collectCoverageFrom: [], // No coverage for E2E
};
```

### test/e2e/setup.js

```javascript
const pactum = require('pactum');
const { logger } = require('./helpers/logger');

// Configure base URL
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
pactum.request.setBaseUrl(BASE_URL);

// Enable request/response logging
pactum.request.setDefaultTimeout(30000);

// Configure retry for transient failures
pactum.handler.addSpecHandler('withRetry', (ctx) => {
  const { spec } = ctx;
  spec.retry({ count: 3, delay: 1000, strategy: 'linear' });
});

// Custom logging
pactum.reporter.add({
  afterSpec(spec) {
    logger.logRequest(spec.request);
    logger.logResponse(spec.response);
  },
});

// Global setup
beforeAll(async () => {
  logger.info('🚀 Starting E2E test suite');

  // Wait for API to be ready
  const waitOn = require('wait-on');
  await waitOn({ resources: [`${BASE_URL}/api/v1/health`], timeout: 30000 });

  logger.success('✅ API server ready');
});
```

### test/e2e/helpers/logger.js

```javascript
const chalk = require('chalk'); // Optional: install for colors

const logger = {
  info: (msg) => console.log(chalk.blue(`ℹ️  ${msg}`)),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
  error: (msg) => console.log(chalk.red(`❌ ${msg}`)),

  logRequest: (req) => {
    console.log(chalk.cyan('\n→ REQUEST'));
    console.log(`  ${req.method} ${req.url}`);
    if (req.body) console.log('  Body:', JSON.stringify(req.body, null, 2));
  },

  logResponse: (res) => {
    const color = res.statusCode >= 400 ? 'red' : 'green';
    console.log(chalk[color]('\n← RESPONSE'));
    console.log(`  Status: ${res.statusCode}`);
    console.log('  Body:', JSON.stringify(res.body, null, 2));
  },
};

module.exports = { logger };
```

### test/e2e/helpers/test-data.js

```javascript
const { v4: uuidv4 } = require('uuid'); // Optional: for unique IDs

const testData = {
  generateRoutine: () => ({
    name: `E2E-Routine-${Date.now()}`,
    description: 'Generated for E2E testing',
    isActive: true,
  }),

  generateWorkoutDay: (routineId, dayNumber) => ({
    routineId,
    dayNumber,
    dayName: `Day-${dayNumber}`,
  }),

  generateSets: (workoutDayId, muscleGroupId = 1) => ({
    workoutDayId,
    muscleGroupId,
    numberOfSets: 4,
  }),
};

module.exports = { testData };
```

---

## 7. Dependencies

### New Dependencies to Install

```bash
npm install --save-dev pactum wait-on
```

**Optional (for enhanced logging):**
```bash
npm install --save-dev chalk
```

### Dependency Breakdown

| Package | Version | Purpose | Size Impact |
|---------|---------|---------|-------------|
| pactum | ^3.7.1 | API testing & workflows | ~500KB |
| wait-on | ^8.0.1 | Service health checks | ~200KB |
| chalk | ^4.1.2 | Colored console output | ~50KB |

**Total Size**: ~750KB (dev dependencies only)

---

## 8. Example E2E Test

### Complete Workflow Test

```javascript
// test/e2e/workflows/create-complete-routine.test.js

const pactum = require('pactum');
const { testData } = require('../helpers/test-data');
const { logger } = require('../helpers/logger');

describe('E2E Workflow: Create Complete Routine', () => {
  let routineId, pushDayId, pullDayId;

  test('should create complete PPL routine with all days and sets', async () => {
    logger.info('Starting PPL routine creation workflow');

    // Step 1: Create routine
    logger.info('Step 1: Creating PPL routine');
    const routine = await pactum
      .spec()
      .post('/api/v1/routines')
      .withJson(testData.generateRoutine())
      .expectStatus(201)
      .expectJsonLike({ id: /.+/, isActive: true })
      .returns('res.body');

    routineId = routine.id;
    logger.success(`Routine created with ID: ${routineId}`);

    // Step 2: Create Push Day
    logger.info('Step 2: Adding Push Day');
    const pushDay = await pactum
      .spec()
      .post('/api/v1/workout-days')
      .withJson(testData.generateWorkoutDay(routineId, 1))
      .expectStatus(201)
      .returns('res.body');

    pushDayId = pushDay.id;
    logger.success(`Push Day created with ID: ${pushDayId}`);

    // Step 3: Add sets to Push Day
    logger.info('Step 3: Adding sets to Push Day');
    const exercises = [
      { muscleGroupId: 1, numberOfSets: 4 }, // Chest
      { muscleGroupId: 2, numberOfSets: 3 }, // Shoulders
      { muscleGroupId: 3, numberOfSets: 3 }, // Triceps
    ];

    for (const exercise of exercises) {
      await pactum
        .spec()
        .post('/api/v1/workout-day-sets')
        .withJson({ workoutDayId: pushDayId, ...exercise })
        .expectStatus(201);
    }
    logger.success('Push Day sets created (3 exercises)');

    // Step 4: Create Pull Day
    logger.info('Step 4: Adding Pull Day');
    const pullDay = await pactum
      .spec()
      .post('/api/v1/workout-days')
      .withJson(testData.generateWorkoutDay(routineId, 2))
      .expectStatus(201)
      .returns('res.body');

    pullDayId = pullDay.id;
    logger.success(`Pull Day created with ID: ${pullDayId}`);

    // Step 5: Add sets to Pull Day
    logger.info('Step 5: Adding sets to Pull Day');
    const pullExercises = [
      { muscleGroupId: 4, numberOfSets: 4 }, // Back
      { muscleGroupId: 5, numberOfSets: 3 }, // Biceps
    ];

    for (const exercise of pullExercises) {
      await pactum
        .spec()
        .post('/api/v1/workout-day-sets')
        .withJson({ workoutDayId: pullDayId, ...exercise })
        .expectStatus(201);
    }
    logger.success('Pull Day sets created (2 exercises)');

    // Step 6: Verify complete routine structure
    logger.info('Step 6: Verifying complete routine structure');

    // Note: This would require a GET endpoint (read-service)
    // For now, we verify by checking IDs exist
    expect(routineId).toBeTruthy();
    expect(pushDayId).toBeTruthy();
    expect(pullDayId).toBeTruthy();

    logger.success('✅ Complete PPL routine workflow successful!');
  });

  afterAll(async () => {
    // Cleanup: Delete created test data
    if (routineId) {
      await pactum
        .spec()
        .delete(`/api/v1/routines/${routineId}`)
        .expectStatus(200);
      logger.info(`Cleaned up routine ${routineId}`);
    }
  });
});
```

---

## 9. Success Criteria

### Phase 1 (Setup)
- [ ] Jest E2E config created and working
- [ ] PactumJS configured with retry logic
- [ ] Helper utilities implemented
- [ ] npm scripts functional
- [ ] CI/CD updated to run E2E tests

### Phase 2 (Core Workflows)
- [ ] Create complete routine workflow test passing
- [ ] Update/delete workflow test passing
- [ ] Bulk PPL setup workflow test passing
- [ ] Error recovery workflow test passing
- [ ] All tests complete in < 2 minutes locally

### Phase 3 (Advanced)
- [ ] Cascade delete validation working
- [ ] Concurrent workflow test passing
- [ ] Large dataset workflow test passing

### Phase 4 (Polish)
- [ ] Documentation complete (README.md)
- [ ] Code refactored and clean
- [ ] CI/CD optimized
- [ ] Team trained on adding new tests

---

## 10. Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Setup** | 3-5 days | Jest + PactumJS configured, helpers ready |
| **Phase 2: Core Workflows** | 5-7 days | 4 workflow test files, 15+ scenarios |
| **Phase 3: Advanced** | 3-5 days | Edge cases, performance tests |
| **Phase 4: Polish** | 2-3 days | Documentation, optimization |

**Total**: 2-3 weeks to production-ready E2E suite

---

## 11. Migration from Bruno E2E to Jest E2E

### Current State
- E2E workflows in `e2e/workflows/` using Bruno + TypeScript helpers
- Functional tests in `test/functional/` using Bruno
- Separate `e2e/package.json` with standalone dependencies

### Target State
- **E2E workflows** REPLACED with Jest + PactumJS in `e2e/` (root level)
- **Functional tests** remain in Bruno (`test/functional/`)
- **Separate `e2e/package.json`** maintained (keeps E2E dependencies isolated)

### Migration Strategy

#### Step 1: Archive Existing E2E
```bash
# Backup current E2E implementation
mv e2e e2e-bruno-archive
```

#### Step 2: Remove E2E Dependencies from Root
- Remove Bruno CLI installation step from CI
- Keep Bruno only for functional tests in `test/functional/`

#### Step 3: Implement Jest + PactumJS E2E
- Create `test/e2e/` directory structure
- Install `pactum` and `wait-on` in root `package.json`
- Create Jest E2E configuration
- Migrate existing workflows to Jest tests

#### Step 4: Update CI/CD
Replace in `.github/workflows/e2e-tests.yml`:
```yaml
# OLD: Bruno-based E2E
- name: Install Bruno CLI
  run: npm install -g @usebruno/cli

- name: Run E2E workflow tests
  working-directory: ./e2e
  run: npm run test:ci

# NEW: Jest + PactumJS E2E
- name: Run E2E workflow tests
  run: npm run test:e2e:ci
```

### Workflow Migration Mapping

Map existing Bruno workflows to new Jest tests:

| Current Bruno Workflow | New Jest Test File | Status |
|------------------------|-------------------|--------|
| `e2e/workflows/UpdateDeleteWorkout/` | `test/e2e/workflows/update-delete-workflow.test.js` | To migrate |
| Future workflow 2 | `test/e2e/workflows/create-complete-routine.test.js` | New |
| Future workflow 3 | `test/e2e/workflows/bulk-ppl-setup.test.js` | New |

### Benefits of Migration

| Aspect | Bruno E2E | Jest + PactumJS E2E |
|--------|-----------|---------------------|
| Workflow complexity | ⚠️ Limited scripting | ✅ Full JavaScript |
| Debugging | ⚠️ Limited | ✅ Full Node.js debugging with breakpoints |
| Programmatic control | ⚠️ Basic | ✅ Complete control (loops, conditionals, etc.) |
| IDE support | ⚠️ Basic | ✅ Full IntelliSense, autocomplete |
| Dependency management | ⚠️ Separate package.json | ✅ Single package.json |
| CI/CD integration | ✅ Good | ✅ Excellent (native Jest reporters) |
| Data manipulation | ⚠️ Limited | ✅ Flexible (full JS capabilities) |
| Assertions | ✅ Good | ✅ Excellent (Jest matchers + PactumJS) |
| TypeScript overhead | ⚠️ Requires compilation | ✅ No compilation needed |
| Maintenance | ⚠️ Separate framework | ✅ Unified with unit tests |

### Migration Checklist

#### Phase 0: Pre-Migration
- [x] Review existing Bruno E2E workflows
- [ ] Document current workflow coverage
- [ ] Archive `e2e/` directory → `e2e-bruno-archive/`

#### Phase 1: Setup (Replace)
- [ ] Create `test/e2e/` directory structure
- [ ] Install Jest + PactumJS dependencies in root
- [ ] Create `jest.e2e.config.js`
- [ ] Create helper utilities (logger, test-data, cleanup)
- [ ] Update `.gitignore` to exclude `e2e-bruno-archive/`

#### Phase 2: Migrate Workflows
- [ ] Migrate UpdateDeleteWorkout workflow to Jest
- [ ] Add new create-complete-routine workflow
- [ ] Add new bulk-ppl-setup workflow
- [ ] Verify all scenarios covered

#### Phase 3: Update CI/CD
- [ ] Update `.github/workflows/e2e-tests.yml`
- [ ] Remove Bruno CLI installation
- [ ] Remove `e2e/` working directory steps
- [ ] Add Jest E2E test execution
- [ ] Test CI/CD pipeline

#### Phase 4: Cleanup
- [ ] Remove `e2e/` directory (after verification)
- [ ] Update documentation (README.md, CLAUDE.md)
- [ ] Remove unused Bruno helpers
- [ ] Update team documentation

---

## 12. Next Steps

1. **Review and approve plan** ✋
2. **Phase 1: Setup infrastructure** 🔧
3. **Phase 2: Implement core workflows** 🚀
4. **Phase 3: Add advanced scenarios** 📈
5. **Phase 4: Polish and document** 📝
6. **Team handoff** 🤝

---

**Document Version**: 2.0
**Created**: 2025-11-15
**Last Updated**: 2025-11-15
**Status**: Ready for Implementation