import api from './api';

/**
 * @desc    Obtenir toutes les bannières actives
 * @param   {string} type - Type de bannière (hero|promo|pub)
 * @param   {string} position - Position (haut|milieu|bas|sidebar)
 * @returns {Promise} Liste des bannières actives
 */
export const obtenirBannieresActives = async (type = '', position = '') => {
    try {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (position) params.append('position', position);

        const queryString = params.toString();
        const url = `/bannieres/actives${queryString ? `?${queryString}` : ''}`;

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error(
            'Erreur lors de la récupération des bannières actives:',
            error
        );
        throw error.response?.data || error;
    }
};

/**
 * @desc    Obtenir toutes les bannières (Admin/Modérateur/Vendeur)
 * @param   {object} filtres - Filtres de recherche
 * @returns {Promise} Liste des bannières
 */
export const obtenirToutesBannieres = async (filtres = {}) => {
    try {
        const {
            page = 1,
            limite = 20,
            type = '',
            statut = '',
            estActif = '',
            search = '',
        } = filtres;

        const params = new URLSearchParams({
            page,
            limite,
        });

        if (type) params.append('type', type);
        if (statut) params.append('statut', statut);
        if (estActif !== '') params.append('estActif', estActif);
        if (search) params.append('search', search);

        const response = await api.get(`/bannieres?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des bannières:', error);
        throw error.response?.data || error;
    }
};

/**
 * @desc    Obtenir une bannière par ID
 * @param   {string} id - ID de la bannière
 * @returns {Promise} Données de la bannière
 */
export const obtenirBanniereParId = async id => {
    try {
        const response = await api.get(`/bannieres/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération de la bannière:', error);
        throw error.response?.data || error;
    }
};

/**
 * @desc    Créer une nouvelle bannière
 * @param   {FormData} formData - Données du formulaire avec image
 * @returns {Promise} Bannière créée
 */
export const creerBanniere = async formData => {
    try {
        const response = await api.post('/bannieres', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création de la bannière:', error);
        throw error.response?.data || error;
    }
};

/**
 * @desc    Modifier une bannière
 * @param   {string} id - ID de la bannière
 * @param   {FormData} formData - Données à modifier
 * @returns {Promise} Bannière modifiée
 */
export const modifierBanniere = async (id, formData) => {
    try {
        const response = await api.put(`/bannieres/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la modification de la bannière:', error);
        throw error.response?.data || error;
    }
};

/**
 * @desc    Supprimer une bannière
 * @param   {string} id - ID de la bannière
 * @returns {Promise} Confirmation de suppression
 */
export const supprimerBanniere = async id => {
    try {
        const response = await api.delete(`/bannieres/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression de la bannière:', error);
        throw error.response?.data || error;
    }
};

/**
 * @desc    Approuver une bannière (Modérateur/Admin)
 * @param   {string} id - ID de la bannière
 * @returns {Promise} Bannière approuvée
 */
export const approuverBanniere = async id => {
    try {
        const response = await api.put(`/bannieres/${id}/approuver`);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de l'approbation de la bannière:", error);
        throw error.response?.data || error;
    }
};

/**
 * @desc    Rejeter une bannière (Modérateur/Admin)
 * @param   {string} id - ID de la bannière
 * @param   {string} raison - Raison du rejet
 * @returns {Promise} Bannière rejetée
 */
export const rejeterBanniere = async (id, raison) => {
    try {
        const response = await api.put(`/bannieres/${id}/rejeter`, { raison });
        return response.data;
    } catch (error) {
        console.error('Erreur lors du rejet de la bannière:', error);
        throw error.response?.data || error;
    }
};

/**
 * @desc    Enregistrer une vue sur une bannière
 * @param   {string} id - ID de la bannière
 * @returns {Promise} Confirmation
 */
export const enregistrerVueBanniere = async id => {
    try {
        const response = await api.post(`/bannieres/${id}/vue`);
        return response.data;
    } catch (error) {
        // Ne pas bloquer l'affichage si l'enregistrement échoue
        console.warn("Erreur lors de l'enregistrement de la vue:", error);
        return null;
    }
};

/**
 * @desc    Enregistrer un clic sur une bannière
 * @param   {string} id - ID de la bannière
 * @returns {Promise} Confirmation
 */
export const enregistrerClicBanniere = async id => {
    try {
        const response = await api.post(`/bannieres/${id}/clic`);
        return response.data;
    } catch (error) {
        console.warn("Erreur lors de l'enregistrement du clic:", error);
        return null;
    }
};

/**
 * @desc    Obtenir les statistiques des bannières
 * @returns {Promise} Statistiques
 */
export const obtenirStatistiquesBannieres = async () => {
    try {
        const response = await api.get('/bannieres/stats');
        return response.data;
    } catch (error) {
        console.error(
            'Erreur lors de la récupération des statistiques:',
            error
        );
        throw error.response?.data || error;
    }
};

export default {
    obtenirBannieresActives,
    obtenirToutesBannieres,
    obtenirBanniereParId,
    creerBanniere,
    modifierBanniere,
    supprimerBanniere,
    approuverBanniere,
    rejeterBanniere,
    enregistrerVueBanniere,
    enregistrerClicBanniere,
    obtenirStatistiquesBannieres,
};