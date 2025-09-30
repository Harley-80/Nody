import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

/**
 * Page MesCommandes - Affiche l'historique des commandes de l'utilisateur
 * Protégée par une vérification d'authentification
 */
export default function MesCommandes() {
    const { user, token } = useAuth();
    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    // Redirection si non connecté
    if (!user) {
        return <Navigate to="/connexion" replace />;
    }

    // Chargement des commandes depuis l'API
    useEffect(() => {
        const fetchCommandes = async () => {
            if (!token) return;
            setLoading(true);
            try {
                // Utilisation de la route GET /api/orders/my-orders
                const response = await fetch('/api/orders/my-orders', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Impossible de récupérer les commandes.');
                }
                const data = await response.json();
                setCommandes(data.data || []);
            } catch (e) {
                console.error('Erreur chargement commandes:', e);
                addToast({
                    type: 'error',
                    title: 'Erreur',
                    message:
                        e.message ||
                        'Une erreur est survenue lors du chargement de vos commandes.',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCommandes();
    }, [user, token, addToast]);

    if (loading) {
        return (
            <div className="container py-5 text-center">
                Chargement de vos commandes...
            </div>
        );
    }

    if (!loading && commandes.length === 0) {
        return (
            <div className="container py-5 text-center">
                <h2>Mes Commandes 📦</h2>
                <p className="lead">
                    Vous n'avez pas encore passé de commande.
                </p>
                <Link to="/produits" className="btn btn-primary">
                    Commencer mes achats
                </Link>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <h2 className="mb-4">Historique de vos commandes</h2>
            <div className="accordion" id="commandesAccordion">
                {commandes.map((commande, index) => (
                    <div className="accordion-item" key={index}>
                        <h2 className="accordion-header" id={`heading${index}`}>
                            <button
                                className="accordion-button collapsed"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#collapse${index}`}
                            >
                                Commande #{commande.numeroCommande} du{' '}
                                {new Date(
                                    commande.createdAt
                                ).toLocaleDateString()}
                                <span className="ms-auto me-3 badge bg-info">
                                    {commande.statut}
                                </span>
                                <span className="fw-bold">
                                    {commande.total.toLocaleString()}{' '}
                                    {commande.devise}
                                </span>
                            </button>
                        </h2>
                        <div
                            id={`collapse${index}`}
                            className="accordion-collapse collapse"
                            data-bs-parent="#commandesAccordion"
                        >
                            <div className="accordion-body">
                                <p>
                                    <strong>Adresse de livraison :</strong>{' '}
                                    {commande.adresseLivraison.rue},{' '}
                                    {commande.adresseLivraison.ville},{' '}
                                    {commande.adresseLivraison.pays}
                                </p>
                                <p>
                                    <strong>Total :</strong>{' '}
                                    {commande.total.toLocaleString()}{' '}
                                    {commande.devise}
                                </p>
                                <p>
                                    <strong>Statut du paiement :</strong>{' '}
                                    <span
                                        className={`badge bg-${commande.paiement.statut === 'paye' ? 'success' : 'warning'}`}
                                    >
                                        {commande.paiement.statut}
                                    </span>
                                </p>
                                <hr />
                                <h6>Produits commandés :</h6>
                                <ul>
                                    {commande.articles.map((p, i) => (
                                        <li key={i}>
                                            {p.quantite} x {p.nom} (
                                            {p.prix.toLocaleString()}{' '}
                                            {commande.devise})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
