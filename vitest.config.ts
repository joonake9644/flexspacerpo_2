import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./utils/__tests__/setup.ts'],
    include: ['utils/**/*.test.ts', 'functions/src/**/*.test.ts'],
    exclude: ['tests/**', 'mcp-shrimp-task-manager/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});