import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

export default defineConfig(({mode}) => ({
    root: fileURLToPath(new URL('.', import.meta.url)),
    define: {IS_DEVELOPMENT: true, LOG_LEVEL: mode === 'verbose' ? 2 : 1},
    server: {host: '127.0.0.1', port: 8081},
}));
