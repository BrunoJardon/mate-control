import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
