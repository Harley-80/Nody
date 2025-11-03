import { api } from './api.js';

export async function testServerConnection() {
    try {
        const response = await api.get('/health');
        console.log('✅ Serveur accessible:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Serveur inaccessible:', error.message);
        return false;
    }
}

export async function testAuthEndpoints() {
    try {
        // Test des routes auth
        const health = await api.get('/health');
        console.log('Health check:', health.data);

        // Test des catégories
        const categories = await api.get('/categories');
        console.log('Catégories:', categories.data);

        return true;
    } catch (error) {
        console.error('Test échoué:', error.response?.data || error.message);
        return false;
    }
}
