import { Routes, Route } from 'react-router-dom';
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
import MesCommandes from '../pages/MesCommandes.jsx';
import CommandeDetail from '../pages/CommandeDetail.jsx';
import Confirmation from '../pages/Confirmation.jsx';
import AdminLayout from '../components/common/layout/AdminLayout.jsx';
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import AdminProduits from '../pages/admin/Produits.jsx';
import Boutique from '../pages/Boutique.jsx'; // Import ajouté
import Nouveautes from '../pages/Nouveautes.jsx'; // Import ajouté

export default function AppRoutes() {
    return (
        <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Accueil />} />
            <Route path="/boutique" element={<Boutique />} />{' '}
            {/* Route ajoutée */}
            <Route path="/nouveautes" element={<Nouveautes />} />{' '}
            {/* Route ajoutée */}
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
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/admin-login" element={<AuthAdmin />} />
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
                        <MesCommandes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/commande-detail"
                element={
                    <ProtectedRoute>
                        <CommandeDetail />
                    </ProtectedRoute>
                }
            />
            {/* Section admin imbriquée */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<AdminDashboard />} />
                <Route path="produits" element={<AdminProduits />} />
            </Route>
        </Routes>
    );
}
