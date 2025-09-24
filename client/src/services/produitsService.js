import { produitsMock } from '../data/produits.data';

/**
 * Simule un appel API vers la liste des produits.
 * @param {string|null} category - catégorie à filtrer
 * @returns {Promise<{produits: Array, categories: Array}>}
 */
export async function fakeApiGetProduits(category = null) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                produits: category
                ? produitsMock.filter(p => p.categories?.includes(category))
                : produitsMock,
                categories: [
                    { id: 'homme', name: 'Mode Homme' },
                    { id: 'femme', name: 'Mode Femme' },
                    { id: 'enfant', name: 'Mode Enfant' },
                    { id: 'montres', name: 'Montres' }
                ]
            });
        }, 800); // délai simulé
    });
}
