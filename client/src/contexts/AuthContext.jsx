import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

// Création du contexte d'authentification
const AuthContext = createContext();

// Hook personnalisé pour accéder au contexte
export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    // État pour stocker les informations de l'utilisateur
    const [user, setUser] = useState(null);

    // Effet pour charger l'utilisateur au montage du composant
    useEffect(() => {
        const loadUser = () => {
            try {
                // Le nom de la clé dans localStorage doit être cohérent
                const saved = localStorage.getItem('nodyUser');
                if (saved) setUser(JSON.parse(saved));
            } catch (error) {
                console.error("Erreur de chargement de l'utilisateur:", error);
            }
        };
        loadUser();
    }, []);

    // Fonction pour mettre à jour l'état de l'utilisateur et le localStorage
    const handleAuthResponse = responseData => {
        // Le serveur renvoie les données dans `donnees`
        const userData = responseData.donnees;
        // Ajout d'un nom complet pour un accès facile
        userData.nomComplet = `${userData.prenom} ${userData.nom}`;
        setUser(userData);
        localStorage.setItem('nodyUser', JSON.stringify(userData));
    };

    /**
     * Connexion standard utilisateur
     * @param {string} email
     * @param {string} password
     */
    const login = async (email, motDePasse) => {
        try {
            const reponse = await api.post('/auth/connexion', {
                email,
                motDePasse,
            });
            // Utiliser la fonction centralisée pour traiter la réponse
            handleAuthResponse(reponse.data);
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        }
    };

    /**
     * Inscription d'un nouvel utilisateur
     * @param {Object} data - Données d'inscription
     */
    const register = async data => {
        try {
            const reponse = await api.post('/auth/inscription', data);
            handleAuthResponse(reponse.data);
            return reponse.data;
        } catch (error) {
            console.error("Erreur d'inscription:", error);
            throw error;
        }
    };

    /**
     * Connexion en tant qu'admin (mock pour développement)
     */
    const loginAsAdmin = () => {
        const mockUser = {
            nomComplet: 'Admin',
            isAdmin: true,
            email: 'admin@nody.sn',
            id: 'admin-mock-id',
        };
        setUser(mockUser);
        localStorage.setItem('nodyUser', JSON.stringify(mockUser));
    };

    /**
     * Déconnexion de l'utilisateur
     */
    const logout = () => {
        setUser(null);
        localStorage.removeItem('nodyUser');
    };

    // Valeurs exposées par le contexte
    const value = {
        user,
        login,
        register,
        logout,
        loginAsAdmin, // Bien inclus dans les valeurs fournies
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
