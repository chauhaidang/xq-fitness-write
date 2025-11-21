# Component Tests

Component tests for XQ Fitness Write Service using **Jest** + **TypeScript** + **Generated API Client**.

Tests are managed from the root package.json with centralized dependencies and configuration.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- Write Service running on port 3000

### Setup

```bash
# From write-service root directory:

# 1. Install dependencies (if not already done)
npm install

# 2. Start Write Service (in separate terminal)
npm start

# 3. Run component tests
npm run test:component
```

---

## Commands

```bash
# From write-service root:
npm run test:component          # Run all component tests
npm run test:component:watch    # Watch mode for development
npm run test:component:ci       # Run with CI reporters (JUnit XML)
npm run format                  # Format all code with Prettier
npm run lint                    # Lint all code with ESLint
```

---

## Directory Structure

```
write-service/                   # Root directory
├── package.json                 # Centralized dependencies
├── jest.config.component.js     # Component test Jest config
├── tsconfig.json                # TypeScript configuration
├── .prettierrc.json             # Prettier configuration
├── .eslintrc.json               # ESLint configuration
├── test-env/                    # Test environment configs
│
└── test/component/
    ├── README.md                # This file
    │
    ├── workflows/               # Test files
    │   └── create-complete-routine.test.ts
    │
    ├── helpers/                 # Utility modules
    │   ├── test-data.ts         # Test data generators
    │   ├── api-client.ts        # Write Service API client wrapper
    │   └── cleanup.ts           # Test cleanup utilities
    │
    ├── setup.ts                 # Global setup (runs before all tests)
    ├── teardown.ts              # Global teardown (runs after all tests)
    └── tsr/                     # Test reports output
```

---

## Environment Variables

| Variable           | Default                        | Description                |
| ------------------ | ------------------------------ | -------------------------- |
| `API_BASE_URL`     | `http://localhost:3000/api/v1` | Base URL for API endpoints |
| `HEALTH_CHECK_URL` | `http://localhost:3000/health` | Health check endpoint      |

### Example

```bash
# Run tests against different environment
API_BASE_URL=http://localhost:3000/api/v1 npm test

# Run tests via nginx gateway
API_BASE_URL=http://localhost/xq-fitness-write-service/api/v1 \
HEALTH_CHECK_URL=http://localhost/xq-fitness-write-service/health \
npm test
```

---

## Writing Tests

### Basic Workflow Test

```typescript
// workflows/my-workflow.test.ts

import { testData } from '../helpers/test-data';
import { ApiClient } from '../helpers/api-client';
import { Logger } from '@chauhaidang/xq-js-common-kit';

const logger = new Logger('MyWorkflow');
const apiClient = new ApiClient(process.env.API_BASE_URL || 'http://localhost:3000/api/v1');

describe('E2E: My Workflow', () => {
  test('should complete workflow successfully', async () => {
    logger.info('Starting workflow');

    // Step 1: Create routine
    const routine = await apiClient.createRoutine(testData.generateRoutine('My PPL Split'));
    expect(routine.id).toBeDefined();

    // Step 2: Add workout day
    const day = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Push Day'));
    expect(day.id).toBeDefined();

    // Step 3: Add sets
    const sets = await apiClient.createWorkoutDaySets(testData.generateSets(day.id, testData.muscleGroups.CHEST, 4));
    expect(sets.id).toBeDefined();

    logger.info('✅ Workflow completed');
  });

  afterAll(async () => {
    // Cleanup test data if needed
  });
});
```

### Using PactumJS Directly

```typescript
import pactum from 'pactum';

test('should create routine with custom assertions', async () => {
  await pactum
    .spec()
    .post('/routines')
    .withJson({ name: 'Test Routine', isActive: true })
    .expectStatus(201)
    .expectJsonLike({
      id: /.+/,
      name: 'Test Routine',
      isActive: true,
    })
    .stores('routineId', 'id'); // Store ID for later use
});
```

### Using Cleanup Helper

```typescript
import { CleanupHelper } from '../helpers/cleanup';

describe('My Test Suite', () => {
  let cleanup: CleanupHelper;

  beforeEach(() => {
    cleanup = new CleanupHelper(apiClient);
  });

  test('my test', async () => {
    const routine = await apiClient.createRoutine(testData.generateRoutine());
    cleanup.trackRoutine(routine.id); // Track for cleanup

    // ... rest of test
  });

  afterEach(async () => {
    await cleanup.cleanupAll(); // Clean up all tracked resources
  });
});
```

---

## Test Reports

### Local Development

Test results are printed to console with colored output.

### CI/CD

- **JUnit XML**: `./test-reports/e2e-workflows-junit.xml`
- Uploaded as GitHub Actions artifact
- Available for 7 days after workflow run

---

## Debugging

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug E2E Tests",
  "program": "${workspaceFolder}/e2e/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache", "--watchAll=false"],
  "cwd": "${workspaceFolder}/e2e",
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Command Line Debugging

```bash
npm run test:debug
```

Then attach your debugger to the Node process.

---

## Troubleshooting

| Issue                  | Solution                                        |
| ---------------------- | ----------------------------------------------- |
| "Cannot find module"   | Run `npm install` in `e2e/` directory           |
| "API server not ready" | Ensure API server is running on port 3000       |
| "Connection refused"   | Check `API_BASE_URL` environment variable       |
| "Tests timeout"        | Increase timeout in `jest.config.ts`            |
| TypeScript errors      | Run `npx tsc --noEmit` to check for type errors |

---

## CI/CD Integration

Tests run automatically on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

See `.github/workflows/e2e-tests.yml` for workflow configuration.

---

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `afterEach` or `afterAll`
3. **Unique Data**: Use `testData.generateRoutine()` for unique names
4. **Logging**: Use logger from `@chauhaidang/xq-js-common-kit`
5. **Assertions**: Verify all critical workflow steps
6. **Error Handling**: Handle expected failures gracefully

---

## Technology Stack

- **Jest 30.2+** - Test runner
- **PactumJS 3.7+** - API testing framework
- **TypeScript 5.5+** - Type safety
- **ts-jest 29.2+** - TypeScript compilation
- **wait-on 8.0+** - Service health checks
- **@chauhaidang/xq-js-common-kit** - Internal logging utilities

---

## Contributing

### Adding New Workflows

1. Create new test file in `workflows/`
2. Follow naming convention: `{workflow-name}.test.ts`
3. Use helpers from `helpers/` directory
4. Add cleanup logic in `afterAll` or `afterEach`
5. Run tests locally before committing

### Updating Helpers

Helper utilities are shared across all tests. Update carefully and test thoroughly.

---

**Status**: ✅ Ready to Use
**Framework**: Jest + PactumJS + TypeScript
**Node**: 18+
**Last Updated**: 2025-11-15
