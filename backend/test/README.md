# Testing with Firebase Emulators

This directory contains integration tests for the Mechanic Shop API using Firebase Emulators.

## Prerequisites

1. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Node.js** version 20 or higher

3. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

## Running Tests

### 1. Start Firebase Emulators

In one terminal, start the Firebase emulators:

```bash
cd backend
npm run serve
```

This will start:
- **Functions emulator** on port 5001
- **Firestore emulator** on port 8080
- **Emulator UI** on port 4000

Wait for the message: `✔  All emulators ready!`

### 2. Run Tests

In another terminal, run the tests:

```bash
cd backend
npm test
```

Or run in watch mode for development:

```bash
npm run test:watch
```

## Test Structure

```
backend/test/
├── setup.js              # Test configuration and utilities
├── customers.test.js     # Customer endpoint tests
├── mechanics.test.js     # Mechanic endpoint tests
├── inventory.test.js     # Inventory endpoint tests
└── serviceTickets.test.js # Service ticket endpoint tests
```

## What's Being Tested

### Customer Tests
- ✅ Create, read, update, delete customers
- ✅ Customer login and JWT authentication
- ✅ Protected routes (my-tickets)
- ✅ Validation and error handling
- ✅ Duplicate email detection

### Mechanic Tests
- ✅ Create, read, update, delete mechanics
- ✅ Email validation
- ✅ Duplicate email detection
- ✅ Error handling

### Inventory Tests
- ✅ Create, read, update, delete inventory parts
- ✅ Price validation
- ✅ Empty/null field handling
- ✅ Error handling

### Service Ticket Tests
- ✅ Create, read, update, delete service tickets
- ✅ Assign/remove mechanics
- ✅ Add/remove inventory parts
- ✅ Filter by customer or mechanic
- ✅ Status updates and timestamps
- ✅ Relationship validation

## Test Configuration

The test configuration is in `setup.js`:

```javascript
const EMULATOR_CONFIG = {
  projectId: 'mechanicshopapi',
  firestoreHost: 'localhost',
  firestorePort: 8080,
  functionsHost: 'localhost',
  functionsPort: 5001
};
```

## Viewing Emulator UI

While the emulators are running, you can view the Emulator UI at:

```
http://localhost:4000
```

This provides:
- Real-time Firestore data viewer
- Function logs and execution history
- Request/response inspection

## Troubleshooting

### Tests fail with "ECONNREFUSED"

Make sure the Firebase emulators are running:
```bash
cd backend
npm run serve
```

### Port already in use

If ports 5001, 8080, or 4000 are already in use, you can change them in `firebase.json`:

```json
{
  "emulators": {
    "functions": { "port": 5002 },
    "firestore": { "port": 8081 },
    "ui": { "port": 4001 }
  }
}
```

Don't forget to update `test/setup.js` with the new ports.

### Firestore data persists between tests

The test setup automatically clears all data after each test. If you notice stale data, check that `afterEach()` hooks are running properly.

## CI/CD Integration

To run tests in CI/CD pipelines:

```bash
# Install dependencies
npm install

# Start emulators in background
firebase emulators:exec --only functions,firestore "npm test"
```

This command starts the emulators, runs the tests, and automatically stops the emulators when complete.

## Writing New Tests

When writing new tests, follow this pattern:

```javascript
const { expect } = require('chai');
const axios = require('axios');
const { BASE_URL, getDb, setupTests, teardownTests, afterEachTest } = require('./setup');

describe('Your Feature', function() {
  this.timeout(10000);

  before(async () => {
    await setupTests();
  });

  after(async () => {
    await teardownTests();
  });

  afterEach(async () => {
    await afterEachTest();
  });

  it('should do something', async () => {
    const response = await axios.get(`${BASE_URL}/your-endpoint`);
    expect(response.status).to.equal(200);
  });
});
```

## Test Coverage

Current test coverage includes:
- ✅ Positive test cases (happy paths)
- ✅ Negative test cases (error scenarios)
- ✅ Authentication and authorization
- ✅ Data validation
- ✅ Relationship management
- ✅ Edge cases

## Additional Resources

- [Firebase Emulator Suite Documentation](https://firebase.google.com/docs/emulator-suite)
- [Mocha Testing Framework](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
