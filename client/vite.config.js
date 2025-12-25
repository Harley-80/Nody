import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig(({ mode }) => {
    // Chargement des variables d'environnement
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],

        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
                '@components': fileURLToPath(
                    new URL('./src/components', import.meta.url)
                ),
                '@assets': fileURLToPath(
                    new URL('./src/assets', import.meta.url)
                ),
            },
        },

        server: {
            port: 5173,
            strictPort: true,
            proxy: {
                // FORCE la redirection pour toutes les requêtes commençant par /api
                '/api': {
                    // Utilise la variable d'env ou le fallback localhost:5000
                    target: env.VITE_BACKEND_URL || 'http://localhost:5000',
                    changeOrigin: true,
                    secure: false,
                    ws: true,
                    configure: proxy => {
                        proxy.on('error', (err, req, res) => {
                            console.error('Erreur du proxy:', err);
                            res.writeHead(500, {
                                'Content-Type': 'text/plain',
                            });
                            res.end(
                                'Le serveur backend semble indisponible (Vérifiez XAMPP/Node)'
                            );
                        });
                    },
                },
            },
            hmr: {
                clientPort: env.HMR_PORT ? parseInt(env.HMR_PORT) : 5173,
                overlay: false,
            },
            open: env.NODE_ENV !== 'test',
        },

        build: {
            outDir: 'dist',
            assetsDir: 'assets',
            sourcemap: env.NODE_ENV !== 'production',
            minify: 'terser',
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            return 'vendor';
                        }
                    },
                },
            },
        },

        define: {
            __APP_ENV__: JSON.stringify(env.NODE_ENV),
            'process.env': JSON.stringify({
                NODE_ENV: env.NODE_ENV,
                ...env,
            }),
        },

        css: {
            devSourcemap: true,
            modules: { localsConvention: 'camelCaseOnly' },
        },
    };
}); // Super 