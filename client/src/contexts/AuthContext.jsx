import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Charger l'utilisateur au démarrage
    useEffect(() => {
        const loadUser = async () => {
            try {
                const savedUser = authService.getCurrentUser();
                const token = authService.getToken();

                console.log('[AuthContext] Chargement utilisateur...');
                console.log('[AuthContext] User sauvegardé:', savedUser);
                console.log(
                    '[AuthContext] Token présent:',
                    token ? 'OUI' : 'NON'
                );

                if (savedUser && token) {
                    // Vérifier si le token est encore valide
                    try {
                        const userData = await authService.getMe();
                        const userWithRole = userData.donnees || userData;
                        userWithRole.isAdmin = userWithRole.role === 'admin';
                        userWithRole.isModerateur =
                            userWithRole.role === 'moderateur';
                        userWithRole.isVendeur =
                            userWithRole.role === 'vendeur';
                        userWithRole.isClient = userWithRole.role === 'client';
                        setUser(userWithRole);
                        console.log(
                            '[AuthContext] Utilisateur chargé:',
                            userWithRole
                        );
                    } catch (error) {
                        console.error('[AuthContext] Token invalide:', error);
                        authService.clearAuth();
                    }
                }
            } catch (error) {
                console.error('[AuthContext] Erreur de chargement:', error);
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
        userData.isModerateur = userData.role === 'moderateur';
        userData.isVendeur = userData.role === 'vendeur';
        userData.isClient = userData.role === 'client';
        setUser(userData);

        localStorage.setItem('user', JSON.stringify(userData));

        return userData;
    };

    const login = async (email, motDePasse) => {
        try {
            console.log('[AuthContext] Tentative de connexion...');
            const response = await authService.login(email, motDePasse);
            const userData = handleAuthResponse(response);
            console.log('[AuthContext] Connexion réussie:', userData);

            // REDIRECTION SELON LE RÔLE
            if (userData.role === 'admin') {
                console.log('Redirection vers /admin');
                navigate('/admin');
            } else if (userData.role === 'moderateur') {
                console.log('Redirection vers /moderateur/dashboard');
                navigate('/moderateur/dashboard');
            } else if (userData.role === 'vendeur') {
                console.log('Redirection vers /vendeur/dashboard');
                navigate('/vendeur/dashboard');
            } else {
                console.log('Redirection vers /');
                navigate('/');
            }

            return { ...response, userData };
        } catch (error) {
            console.error('[AuthContext] Erreur de connexion:', error);
            throw error;
        }
    };

    const register = async userData => {
        try {
            const response = await authService.register(userData);
            const registeredUser = handleAuthResponse(response);

            // Redirection après inscription
            if (registeredUser.role === 'vendeur') {
                navigate('/vendeur/dashboard');
            } else {
                navigate('/');
            }

            return response;
        } catch (error) {
            console.error("[AuthContext] Erreur d'inscription:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('[AuthContext] Erreur de déconnexion:', error);
        } finally {
            setUser(null);
            authService.clearAuth();
            navigate('/connexion');
        }
    };

    const updateUser = newUserData => {
        setUser(prevUser => {
            const updatedUser = { ...prevUser, ...newUserData };
            updatedUser.isAdmin = updatedUser.role === 'admin';
            updatedUser.isModerateur = updatedUser.role === 'moderateur';
            updatedUser.isVendeur = updatedUser.role === 'vendeur';
            updatedUser.isClient = updatedUser.role === 'client';

            localStorage.setItem('user', JSON.stringify(updatedUser));

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
        isModerateur: user?.isModerateur || false,
        isVendeur: user?.isVendeur || false,
        isClient: user?.isClient || false,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
