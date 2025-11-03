import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

// Configuration principale de Vite
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],

        // Configuration de la résolution des imports
        resolve: {
            alias: {
                // Utilisation de fileURLToPath pour remplacer __dirname
                '@': fileURLToPath(new URL('./src', import.meta.url)),
                '@components': fileURLToPath(
                    new URL('./src/components', import.meta.url)
                ),
                '@assets': fileURLToPath(
                    new URL('./src/assets', import.meta.url)
                ),
            },
        },

        // Configuration du serveur de développement
        server: {
            port: 5173,
            strictPort: true, // Empêche le changement automatique de port si occupé

            proxy: {
                [env.VITE_API_URL || '/api']: {
                    target: env.VITE_BACKEND_URL || 'http://localhost:5000',
                    changeOrigin: true,
                    secure: false,
                    ws: true, // Activation des WebSockets

                    // Gestion des erreurs de connexion au backend
                    configure: proxy => {
                        proxy.on('error', (err, req, res) => {
                            console.error('Erreur du proxy:', err);
                            res.writeHead(500, {
                                'Content-Type': 'text/plain',
                            });
                            res.end('Le serveur backend semble indisponible');
                        });
                    },
                },
            },

            hmr: {
                clientPort: env.HMR_PORT ? parseInt(env.HMR_PORT) : 5173,
                overlay: false, // Désactive l'overlay d'erreur en cas de besoin
            },

            open: env.NODE_ENV !== 'test', // Ne pas ouvrir le navigateur en mode test
        },

        // Configuration de la construction (build)
        build: {
            outDir: 'dist',
            assetsDir: 'assets',
            sourcemap: env.NODE_ENV !== 'production', // Pas de sourcemap en production
            minify: 'terser', // Minification agressive pour la production
            emptyOutDir: true, // Vide le dossier avant chaque nouvelle construction

            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            return 'vendor'; // Crée un chunk séparé pour les dépendances
                        }
                    },
                },
            },
        },

        // Définition des variables globales
        define: {
            __APP_ENV__: JSON.stringify(env.NODE_ENV),

            // Correction pour process.env dans l'application cliente
            'process.env': JSON.stringify({
                NODE_ENV: env.NODE_ENV,
                ...env,
            }),
        },

        // Configuration CSS supplémentaire
        css: {
            devSourcemap: true,
            modules: { localsConvention: 'camelCaseOnly' },
        },
    };
});
