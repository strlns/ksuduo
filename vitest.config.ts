import react from '@vitejs/plugin-react';
import {defineConfig} from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    define: {IS_DEVELOPMENT: false, LOG_LEVEL: 0},
    // Generated logical fixtures are CPU intensive; avoid competing searches and
    // allow complete deduction/uniqueness checks on slower development machines.
    test: {maxWorkers: 1, testTimeout: 30000, include: ['tests/**/*.test.{ts,tsx}'], environment: 'node'},
});
