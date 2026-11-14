import react from '@vitejs/plugin-react';
import {defineConfig} from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    define: {IS_DEVELOPMENT: false, LOG_LEVEL: 0},
    test: {include: ['tests/**/*.test.{ts,tsx}'], environment: 'node'},
});
