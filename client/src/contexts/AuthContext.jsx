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
                const saved = localStorage.getItem('nodyUser');
                if (saved) setUser(JSON.parse(saved));
            } catch (error) {
                console.error("Erreur de chargement de l'utilisateur:", error);
            }
        };
        loadUser();
    }, []);

    /**
     * Connexion standard utilisateur
     * @param {string} email 
     * @param {string} password 
     */
    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            setUser(res.data.user);
            localStorage.setItem('nodyUser', JSON.stringify(res.data.user));
        } catch (error) {
            console.error("Erreur de connexion:", error);
            throw error;
        }
    };

    /**
     * Inscription d'un nouvel utilisateur
     * @param {Object} data - Données d'inscription 
     */
    const register = async (data) => {
        try {
            const res = await api.post('/auth/register', data);
            setUser(res.data.user);
            localStorage.setItem('nodyUser', JSON.stringify(res.data.user));
            return res.data;
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
            name: 'Admin', 
            isAdmin: true,
            email: 'admin@nody.sn',
            id: 'admin-mock-id'
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
        loginAsAdmin // Bien inclus dans les valeurs fournies
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}