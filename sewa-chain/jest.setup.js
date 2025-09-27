import "@testing-library/jest-dom";

// Mock MiniKit for testing
global.MiniKit = {
  isInstalled: jest.fn(() => true),
  commandsAsync: {
    verify: jest.fn(),
  },
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_APP_ID = "app_test_123456789";
process.env.JWT_SECRET = "test-secret-key";
