// Récupérer les catégories depuis le backend
export async function getCategories() {
    const response = await api.get('/categories');
    // On suppose que la réponse a la forme { succes: true, donnees: [...] }
    return response.data.donnees;
}
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
    baseURL: `${apiUrl}/api`,
    withCredentials: true, // pour cookie JWT si backend le fait
    headers: {
        'Content-Type': 'application/json',
    },
});
