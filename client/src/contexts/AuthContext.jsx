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
                    try {
                        const userData = await authService.getMe();
                        const userWithRole = userData.donnees || userData;
                        userWithRole.isAdmin = userWithRole.role === 'admin';
                        setUser(userWithRole);
                    } catch (error) {
                        console.error('Token invalide:', error);
                        authService.clearAuth();
                    }
                }
            } catch (error) {
                console.error('Erreur de chargement utilisateur:', error);
                authService.clearAuth();
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const handleAuthResponse = responseData => {
        const userData = responseData.donnees || responseData;
        userData.nomComplet = `${userData.nom} ${userData.prenom}`;
        userData.isAdmin = userData.role === 'admin';
        setUser(userData);
        localStorage.setItem('nodyUser', JSON.stringify(userData));
        return userData;
    };

    const login = async (email, motDePasse) => {
        try {
            const response = await authService.login(email, motDePasse);
            const userData = handleAuthResponse(response);
            return { ...response, userData };
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
            authService.clearAuth();
        }
    };

    const updateUser = newUserData => {
        setUser(prevUser => {
            const updatedUser = { ...prevUser, ...newUserData };
            updatedUser.isAdmin = updatedUser.role === 'admin';
            localStorage.setItem('nodyUser', JSON.stringify(updatedUser));
            return updatedUser;
        });
    };

    const value = {
        user,
        login,
        register,
        logout,
        updateUser,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
