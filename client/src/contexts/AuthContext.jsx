import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Charger l'utilisateur au démarrage
    useEffect(() => {
        const loadUser = async () => {
            try {
                const savedUser = authService.getCurrentUser();
                if (savedUser && savedUser.token) {
                    // Vérifier si le token est encore valide
                    const userData = await authService.getMe();
                    setUser(userData.donnees || userData);
                }
            } catch (error) {
                console.error('Erreur de chargement utilisateur:', error);
                localStorage.removeItem('nodyUser');
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const handleAuthResponse = responseData => {
        const userData = responseData.donnees || responseData;
        userData.nomComplet = `${userData.nom} ${userData.prenom}`;
        setUser(userData);
        localStorage.setItem('nodyUser', JSON.stringify(userData));
    };

    const login = async (email, motDePasse) => {
        try {
            const response = await authService.login(email, motDePasse);
            handleAuthResponse(response);
            return response;
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        }
    };

    const register = async userData => {
        try {
            const response = await authService.register(userData);
            handleAuthResponse(response);
            return response;
        } catch (error) {
            console.error("Erreur d'inscription:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('nodyUser');
        }
    };

    const loginAsAdmin = () => {
        const mockUser = {
            nomComplet: 'Admin',
            isAdmin: true,
            email: 'admin@nody.sn',
            id: 'admin-mock-id',
            token: 'mock-token',
        };
        setUser(mockUser);
        localStorage.setItem('nodyUser', JSON.stringify(mockUser));
    };

    const value = {
        user,
        login,
        register,
        logout,
        loginAsAdmin,
        loading,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
