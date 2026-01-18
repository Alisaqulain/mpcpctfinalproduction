# Testing Guide - Shared Membership System

## Running Tests

**Important:** Tests must be run using Jest, NOT directly with Node.js.

### Correct Way:
```bash
npm test
```

Or to run a specific test file:
```bash
npm test -- src/__tests__/api/shared-membership.test.js
```

### Incorrect Way (Will Fail):
```bash
node src/__tests__/api/shared-membership.test.js  # ❌ This will fail
```

## Why?

The test file uses:
1. **Jest** testing framework
2. **Next.js path aliases** (`@/app`, `@/lib`) that need Jest's module resolution
3. **ES Modules** from dependencies (jose, mongodb) that Jest transforms
4. **Jest mocks** for Next.js server modules

## Test Requirements

1. **MongoDB Test Database**: Set `MONGODB_URI` environment variable or it defaults to `mongodb://localhost:27017/mpcpct-test`

2. **JWT Secret**: Set `JWT_SECRET` environment variable or it defaults to `test-secret-key-for-jwt`

## Test Coverage

The shared membership tests cover:
- ✅ Generate share link for subscription owner
- ✅ Prevent non-owners from generating links
- ✅ Allow max 3 shared activations
- ✅ Prevent 4th user activation
- ✅ Ensure owner gets reward ONLY at 3/3
- ✅ Ensure owner gets reward only once (idempotent)
- ✅ Ensure shared users always get +1 month
- ✅ Prevent owner from activating own subscription
- ✅ Prevent duplicate activation by same user
- ✅ Return correct share progress and reward status
- ✅ Validate share tokens correctly

## Troubleshooting

### Error: "Cannot find package '@/app'"
**Solution:** Run with `npm test`, not `node` directly

### Error: "Unexpected token 'export'"
**Solution:** This is a Jest configuration issue. The `jest.config.js` should handle ES modules automatically via Next.js's Jest setup.

### Error: "MongoDB connection failed"
**Solution:** Ensure MongoDB is running and `MONGODB_URI` is set correctly

### Tests pass but you want to see more details
```bash
npm test -- --verbose
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```












