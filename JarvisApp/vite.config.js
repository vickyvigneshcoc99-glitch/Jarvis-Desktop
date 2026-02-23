import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        strictPort: true,
    },
    resolve: {
        alias: {
            'react-native': 'react-native-web',
        },
        extensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx'],
    },
    define: {
        global: 'window',
        __DEV__: JSON.stringify(true),
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: [],
        include: ['__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
});
