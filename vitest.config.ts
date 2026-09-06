import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['tests/claims/**', 'node_modules/**', 'dist/**'],
  },
});
