import { vi } from 'vitest';

// Global mocks and setup for tests

// Mock console methods to avoid noise in test output
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock import.meta.env for testing
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_EMAILJS_SERVICE_ID: 'test_service_id',
    VITE_EMAILJS_TEMPLATE_ID: 'test_template_id',
    VITE_EMAILJS_PUBLIC_KEY: 'test_public_key',
  },
  writable: true,
});

// Mock fetch for any HTTP requests
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as any;