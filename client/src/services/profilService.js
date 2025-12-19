import { api } from './api';

// Service pour la gestion du profil utilisateur

const profilService = {
    // Obtenir le profil complet
    obtenirProfil: async () => {
        const response = await api.get('/auth/profil');
        return response.data;
    },

    // Mettre à jour les informations personnelles
    mettreAJourInfos: async donnees => {
        const response = await api.put('/auth/moi', donnees);
        return response.data;
    },

    // Changer le mot de passe
    changerMotDePasse: async donnees => {
        const response = await api.put('/auth/changer-mot-de-passe', donnees);
        return response.data;
    },

    // Upload de l'avatar
    uploadAvatar: async fichier => {
        const formData = new FormData();
        formData.append('avatar', fichier);

        const response = await api.post('/auth/upload-avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Gestion des adresses
    obtenirAdresses: async () => {
        const response = await api.get('/auth/adresses');
        return response.data;
    },

    ajouterAdresse: async adresse => {
        const response = await api.post('/auth/adresses', adresse);
        return response.data;
    },

    modifierAdresse: async (id, adresse) => {
        const response = await api.put(`/auth/adresses/${id}`, adresse);
        return response.data;
    },

    supprimerAdresse: async id => {
        const response = await api.delete(`/auth/adresses/${id}`);
        return response.data;
    },

    definirAdresseParDefaut: async id => {
        const response = await api.put(`/auth/adresses/${id}/par-defaut`);
        return response.data;
    },
};

export default profilService;
