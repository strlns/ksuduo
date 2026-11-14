import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig(({mode}) => ({
    plugins: [react()],
    // Relative assets also work when hosted below /ksuduo/ on GitHub Pages.
    base: './',
    define: {
        IS_DEVELOPMENT: mode !== 'production',
        LOG_LEVEL: mode === 'verbose' ? 2 : 1,
    },
    server: {host: '127.0.0.1', port: 8080},
    build: {sourcemap: true},
}));
