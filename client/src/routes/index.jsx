import { Routes, Route, Outlet } from 'react-router-dom';
import Accueil from '../pages/accueil.jsx';
import Connexion from '../pages/auth/connexion.jsx';
import Inscription from '../pages/auth/inscription.jsx';
import MotDePasseOublie from '../pages/auth/MotDePasseOublie.jsx';
import PageDetailProduit from '../pages/PageDetailProduit.jsx';
import Panier from '../pages/panier.jsx';
import Paiement from '../pages/paiement.jsx';
import Produit from '../pages/produit.jsx';
import AuthAdmin from '../pages/auth/AuthAdmin.jsx';
import ProtectedRoute from '../contexts/ProtectedRoute';
import Categories from '../pages/Categories.jsx';
import MesCommandesClient from '../pages/MesCommandes.jsx';
import CommandeDetail from '../pages/CommandeDetail.jsx';
import Confirmation from '../pages/Confirmation.jsx';
import AdminLayout from '../components/common/layout/AdminLayout.jsx';
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import Demandes from '../pages/admin/Demandes.jsx';
import Statistiques from '../pages/admin/Statistiques.jsx';
import Clients from '../pages/admin/Clients.jsx';
import Commandes from '../pages/admin/Commandes.jsx';
import Boutique from '../pages/Boutique.jsx';
import Nouveautes from '../pages/Nouveautes.jsx';
import Profil from '../pages/profil';
import Moderateurs from '../pages/admin/Moderateurs.jsx';
import Vendeurs from '../pages/admin/Vendeurs.jsx';
import AdminProduits from '../pages/admin/Produits/Produits.jsx';
import CategoriesAdmin from '../pages/admin/Categories/Categories.jsx';
import Parametres from '../pages/admin/Parametres/Parametres.jsx';
import Messages from '../pages/admin/Messages/Messages.jsx';

// Import des pages modérateur
import DashboardModerateur from '../pages/moderateur/DashboardModerateur.jsx';
import DemandesValidation from '../pages/moderateur/DemandesValidation.jsx';

// Import des pages Vendeur
import DashboardVendeur from '../pages/vendeur/DashboardVendeur';
import MesProduits from '../pages/vendeur/MesProduits';
import MesCommandesVendeur from '../pages/vendeur/MesCommandes';
import StatistiquesVendeur from '../pages/vendeur/StatistiquesVendeur';
import MessagesVendeur from '../pages/vendeur/Messages';
import AjouterProduit from '../pages/vendeur/AjouterProduit';
import ModifierProduit from '../pages/vendeur/ModifierProduit';
import MaBoutique from '../pages/vendeur/MaBoutique';

// ✅ CORRECTION 3 : Créer un Layout Vendeur qui rend <Outlet />
const VendeurLayout = () => {
    return (
        <div className="vendeur-layout">
            {/* Vous pouvez ajouter un sidebar, navbar, etc. ici */}
            <Outlet />
        </div>
    );
};

export default function AppRoutes() {
    return (
        <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Accueil />} />
            <Route path="/boutique" element={<Boutique />} />
            <Route path="/nouveautes" element={<Nouveautes />} />
            <Route path="/produit/:id" element={<PageDetailProduit />} />
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/panier" element={<Panier />} />
            <Route
                path="/auth/MotDePasseOublie"
                element={<MotDePasseOublie />}
            />
            <Route path="/produits" element={<Produit />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:categorySlug" element={<Categories />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/admin-login" element={<AuthAdmin />} />

            {/* Routes protégées générales (Clients) */}
            <Route
                path="/profil"
                element={
                    <ProtectedRoute>
                        <Profil />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/paiement"
                element={
                    <ProtectedRoute>
                        <Paiement />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/mes-commandes"
                element={
                    <ProtectedRoute>
                        <MesCommandesClient />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/commande/:id"
                element={
                    <ProtectedRoute>
                        <CommandeDetail />
                    </ProtectedRoute>
                }
            />

            {/* SECTION ADMIN */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute rolesAutorisés={['admin']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<AdminDashboard />} />
                <Route path="produits" element={<AdminProduits />} />
                <Route path="categories" element={<CategoriesAdmin />} />
                <Route path="parametres" element={<Parametres />} />
                <Route path="messages" element={<Messages />} />
                <Route path="demandes" element={<Demandes />} />
                <Route path="statistiques" element={<Statistiques />} />
                <Route path="clients" element={<Clients />} />
                <Route path="commandes" element={<Commandes />} />
                <Route path="vendeurs" element={<Vendeurs />} />
                <Route path="moderateurs" element={<Moderateurs />} />
            </Route>

            {/* SECTION MODÉRATEUR */}
            <Route
                path="/moderateur/dashboard"
                element={
                    <ProtectedRoute rolesAutorisés={['moderateur']}>
                        <DashboardModerateur />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/moderateur/demandes"
                element={
                    <ProtectedRoute rolesAutorisés={['moderateur']}>
                        <DemandesValidation />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/moderateur/utilisateurs"
                element={
                    <ProtectedRoute rolesAutorisés={['moderateur']}>
                        <div className="container py-5">
                            <h2>Gestion des Utilisateurs</h2>
                            <p className="text-muted">
                                Page en construction...
                            </p>
                        </div>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/moderateur/historique"
                element={
                    <ProtectedRoute rolesAutorisés={['moderateur']}>
                        <div className="container py-5">
                            <h2>Historique des Actions</h2>
                            <p className="text-muted">
                                Page en construction...
                            </p>
                        </div>
                    </ProtectedRoute>
                }
            />

            {/* ✅ SECTION VENDEUR CORRIGÉE */}
            <Route
                path="/vendeur"
                element={
                    <ProtectedRoute rolesAutorisés={['vendeur']}>
                        <VendeurLayout />
                    </ProtectedRoute>
                }
            >
                {/* Index: /vendeur redirige vers /vendeur/dashboard */}
                <Route index element={<DashboardVendeur />} />
                <Route path="dashboard" element={<DashboardVendeur />} />

                {/* Produits */}
                <Route path="produits" element={<MesProduits />} />
                <Route path="produits/nouveau" element={<AjouterProduit />} />
                <Route
                    path="produits/:id/modifier"
                    element={<ModifierProduit />}
                />

                {/* Commandes */}
                <Route path="commandes" element={<MesCommandesVendeur />} />

                {/* Boutique */}
                <Route path="boutique" element={<MaBoutique />} />

                {/* Statistiques */}
                <Route path="statistiques" element={<StatistiquesVendeur />} />

                {/* Messages */}
                <Route path="messages" element={<MessagesVendeur />} />
            </Route>

            {/* Route 404 */}
            <Route
                path="*"
                element={
                    <div className="container text-center py-5">
                        <h2>Page non trouvée</h2>
                        <p>La page que vous recherchez n'existe pas.</p>
                        <a href="/" className="btn btn-primary">
                            Retour à l'accueil
                        </a>
                    </div>
                }
            />
        </Routes>
    );
}
