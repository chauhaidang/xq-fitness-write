# E2E Workflow Tests

Standalone E2E testing framework for XQ Fitness Write Service using **Bruno** + **TypeScript helpers**.

This is a **completely independent framework** with its own `package.json`, dependencies, and configuration.

---

## Quick Start
Make sure working directory is e2e/
Start up test environment using `xq-infra generate -f test-env`
then `xq-infra up`

```bash
# 1. Install Bruno CLI (global, one-time)
npm install -g @usebruno/cli

# 2. Navigate to E2E directory
cd e2e

# 3. Install dependencies
npm install

# 4. Build and run tests
npm run build
npm test
```

---

## Commands

```bash
npm install              Install dependencies (first time)
npm run build            Build TypeScript helpers once
npm run watch            Watch & auto-compile (development)
npm test                 Run tests locally
npm run test:local       Run against local API
npm run test:ci          Run with CI reports (HTML + JUnit)
npm run test:debug       Stop on first failure
```

---

## Directory Structure

```
e2e/
├── 📄 Configuration
│   ├── package.json      E2E dependencies & scripts
│   ├── tsconfig.json     TypeScript config
│   ├── .swcrc           SWC compiler config
│   └── .gitignore       Ignore generated .js files
│
├── 📚 Documentation
│   └── README.md        This file
│
├── 🔧 Helpers (TypeScript utilities - compiled to JS)
│   ├── auth.ts / auth.js
│   ├── validators.ts / validators.js
│   └── test-data.ts / test-data.js
│
└── 🧪 Workflows (Bruno collections)
    ├── bruno.json
    ├── environments/
    │   ├── local.bru
    │   └── ci.bru
    ├── 01-create-routine-complete/ (6 requests)
    ├── 02-update-delete-workflow/ (5 requests)
    └── 03-bulk-ppl-setup/ (5 requests)
```

---

## Available Workflows

### 1. Create Routine Complete
Create a complete workout routine with multiple days and exercise sets.

**Flow**: Create routine → Add day 1 → Add sets → Add day 2 → Add sets → Verify

**Tests**: 18 assertions across 6 requests

---

### 2. Update and Delete
CRUD operations on routine and associated data.

**Flow**: Create routine → Add day → Add sets → Update routine → Delete routine

**Tests**: 12 assertions across 5 requests

---

### 3. Bulk PPL Setup
Create a Push/Pull/Legs training split with three workout days.

**Flow**: Create PPL → Add push day → Add pull day → Add leg day → Verify

**Tests**: 12 assertions across 5 requests

---

## Helper Functions

### auth.js
```javascript
generateAuthToken(secret, userId)  // Generate JWT token
setAuthHeader(req, token)           // Set Authorization header
```

### validators.js
```javascript
validateResponse(res, status, schema)           // Validate response
extractValue(res, path)                         // Extract from response
storeValue(bru, varName, res, path)            // Extract & store variable
storeMultipleValues(bru, res, mappings)        // Extract multiple values
```

### test-data.js
```javascript
generateTestData()                  // Generate unique test data
getMuscleGroupId(name, data)       // Get muscle group ID
getAllMuscleGroupIds(data)         // Get all muscle group IDs
getRandomMuscleGroup(data)         // Get random muscle group
getWorkoutDay(dayNumber, data)     // Get workout day by number
```

---

## Writing Tests

### Using Helpers in Pre-Request

```javascript
script:pre-request {
  const { generateAuthToken, setAuthHeader } = require('./auth.js');
  const { generateTestData } = require('./test-data.js');

  const testData = generateTestData();
  const token = generateAuthToken(bru.getEnvVar('authSecret'), testData.userId);
  setAuthHeader(req, token);

  bru.setVar('routineName', testData.routine.name);
}
```

### Using Helpers in Post-Response

```javascript
script:post-response {
  const { validateResponse, storeValue } = require('./validators.js');

  validateResponse(res, 201, {
    id: 'number',
    name: 'string',
    isActive: 'boolean'
  });

  storeValue(bru, 'routineId', res, 'id');
}
```

### Writing Assertions

```javascript
tests {
  test('Routine created successfully', function () {
    const chai = require('chai');
    const expect = chai.expect;
    expect(res.getStatus()).to.equal(201);
    expect(res.getBody().name).to.contain('Routine-');
  });
}
```

---

## Adding New Workflows

1. **Create directory**
   ```bash
   mkdir -p workflows/04-workflow-name
   ```

2. **Create numbered `.bru` files**
   ```
   04-workflow-name/
   ├── 1.Setup.bru
   ├── 2.Create.bru
   └── 3.Verify.bru
   ```

3. **Use helpers in scripts** (see "Writing Tests" section above)

4. **Run tests**
   ```bash
   npm test
   ```

---

## Built-in Libraries

Available in Bruno scripts (no installation needed):
- `chai` - Assertions
- `axios` - HTTP client
- `lodash` - Utilities
- `uuid` - ID generation
- `crypto` - Cryptographic functions
- `moment` - Date/time handling

---

## Environments

### Local (`environments/local.bru`)
```bru
vars {
  baseUrl: http://localhost:3000/api/v1
  authSecret: local-dev-secret-key-12345
}
```

### CI (`environments/ci.bru`)
```bru
vars {
  baseUrl: http://localhost:3000/api/v1
  authSecret: ci-secret-key-98765
}
```

Use with: `bru run workflows --env local` or `--env ci`

---

## Configuration

### package.json
E2E-specific dependencies only:
- `@swc/cli` - TypeScript compiler
- `@swc/core` - SWC core
- `typescript` - Type definitions
- `@types/node` - Node types

Root project has NO E2E dependencies.

### tsconfig.json
TypeScript strict mode, source maps, CommonJS output.

### .swcrc
SWC compiler config, fast TypeScript compilation (5-20x faster than ts-jest).

---

## Compilation

TypeScript helpers are compiled to JavaScript for Bruno:

```bash
npm run build         # Build once
npm run watch         # Auto-compile on changes
```

Generated `.js` files are in same directory as `.ts` sources for clean imports:
```javascript
const { generateAuthToken } = require('./auth.js');
```

---

## CI/CD Integration

GitHub Actions workflow (`.github/workflows/e2e-tests.yml`):
1. Installs root dependencies (API server)
2. Installs E2E dependencies (this framework)
3. Builds TypeScript helpers
4. Starts API server
5. Runs E2E tests
6. Generates reports (HTML + JUnit XML)

**Triggers**: Push to main/develop, PR to main/develop

---

## Git Workflow

**Commit to git**:
- ✅ `*.ts` (TypeScript sources)
- ✅ `*.bru` (Bruno collections)
- ✅ Configuration files (package.json, tsconfig.json, .swcrc)
- ✅ README.md

**Do NOT commit**:
- ❌ `*.js` (generated from TypeScript)
- ❌ `test-reports/` (generated)
- ❌ `node_modules/` (installed)

(Handled by `.gitignore`)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "command not found: bru" | `npm install -g @usebruno/cli` |
| Compilation errors | `npm run build` to see errors, check `.ts` syntax |
| "Cannot find module" | Run `npm run build` to compile helpers |
| Tests pass locally but fail in CI | Check environment variables in `environments/ci.bru` |
| Port already in use | Change port in environment file or kill process |

---

## Dependencies

### Root Project
- express, pg, pg-pool, dotenv, cors, joi, nodemon
- **No testing overhead** ✅

### E2E Framework
- @swc/cli, @swc/core, typescript, @types/node
- **Completely separate** ✅

---

## Key Points

✨ **Standalone** - Own package.json, configuration, dependencies
⚡ **Fast** - SWC compilation, no testing overhead in root
📦 **Simple** - Straightforward directory structure
🔧 **Flexible** - Easy to add more workflows
🔄 **Independent** - Can upgrade E2E deps without affecting root
📈 **Scalable** - Pattern for adding other test frameworks later

---

## Documentation

- **Architecture & Design**: See root `E2E-PLAN.md`
- **GitHub Actions**: See `.github/workflows/e2e-tests.yml`
- **Write Service API**: See root `write-service-api.yaml`

---

**Framework**: Bruno + TypeScript + SWC
**Node**: 18+
**npm**: 8+
**Status**: Ready to use ✅
