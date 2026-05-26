import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/health-calculator.ts',
        'src/lib/state-machine.ts',
        'src/services/lineage.service.ts',
        'src/actions/**/*.ts',
        'src/schemas/**/*.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
});
