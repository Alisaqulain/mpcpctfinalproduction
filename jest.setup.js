// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key-for-jwt'
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mpcpct-test'

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

