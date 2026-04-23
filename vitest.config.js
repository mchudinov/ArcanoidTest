import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['Tests/Game/**/*.test.js'],
    passWithNoTests: true,
  },
});
