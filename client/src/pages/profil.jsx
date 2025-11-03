import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigate, useNavigate } from 'react-router-dom';
import './Profil.scss';

/**
 * Page Profil - Affiche l'historique des commandes de l'utilisateur
 * Protégée par une vérification d'authentification
 */
export default function Profil() {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Redirection si non connecté
    if (!user) {
        return <Navigate to="/connexion" replace />;
    }

    // Chargement des commandes depuis le localStorage
    useEffect(() => {
        try {
            const sauvegarde = localStorage.getItem('nodyCommandes');
            if (sauvegarde) {
                // Filtrage pour ne montrer que les commandes de l'utilisateur actuel
                const toutesCommandes = JSON.parse(sauvegarde);
                const commandesUtilisateur = toutesCommandes.filter(
                    cmd => cmd.client && cmd.client.email === user.email
                );
                setCommandes(commandesUtilisateur);
            }
        } catch (e) {
            console.warn('Erreur chargement commandes', e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const handleDeactivate = () => {
        logout();
        addToast({
            type: 'info',
            title: 'Compte désactivé',
            message: 'Votre compte a été déconnecté temporairement.',
        });
        navigate('/');
    };

    const handleLogout = () => {
        logout();
        addToast({
            type: 'success',
            title: 'Déconnexion réussie',
            message: 'À bientôt sur Nody !',
        });
        navigate('/');
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-3">Chargement de votre profil...</p>
            </div>
        );
    }

    return (
        <div className="container py-5">
            {/* En-tête du profil */}
            <div className="row mb-5">
                <div className="col-md-8">
                    <h2 className="mb-3">
                        Bonjour, {user.prenom} {user.nom} 👋
                    </h2>
                    <p className="text-muted">
                        Bienvenue sur votre espace personnel Nody
                    </p>
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">
                                Informations personnelles
                            </h5>
                            <p>
                                <strong>Email :</strong> {user.email}
                            </p>
                            <p>
                                <strong>Téléphone :</strong>{' '}
                                {user.telephone || 'Non renseigné'}
                            </p>
                            <p>
                                <strong>Membre depuis :</strong>{' '}
                                {new Date(
                                    user.createdAt || Date.now()
                                ).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="d-grid gap-2">
                        <button
                            className="btn btn-outline-primary"
                            onClick={() => navigate('/commandes')}
                        >
                            Mes commandes
                        </button>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => navigate('/parametres')}
                        >
                            Paramètres
                        </button>
                        <button
                            className="btn btn-outline-danger"
                            onClick={handleLogout}
                        >
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>

            {/* Section historique des commandes */}
            <div className="row">
                <div className="col-12">
                    <h3 className="mb-4">Historique de vos commandes</h3>

                    {commandes.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="mb-4">
                                <i className="fas fa-shopping-bag fa-3x text-muted"></i>
                            </div>
                            <h5 className="text-muted">
                                Aucune commande pour le moment
                            </h5>
                            <p className="text-muted">
                                Vos commandes apparaîtront ici après vos
                                premiers achats.
                            </p>
                            <button
                                className="btn btn-primary mt-3"
                                onClick={() => navigate('/boutique')}
                            >
                                Découvrir la boutique
                            </button>
                        </div>
                    ) : (
                        <div className="accordion" id="commandesAccordion">
                            {commandes.map((commande, index) => (
                                <div className="accordion-item" key={index}>
                                    <h2
                                        className="accordion-header"
                                        id={`heading${index}`}
                                    >
                                        <button
                                            className="accordion-button collapsed"
                                            type="button"
                                            data-bs-toggle="collapse"
                                            data-bs-target={`#collapse${index}`}
                                            aria-expanded="false"
                                            aria-controls={`collapse${index}`}
                                        >
                                            <div className="d-flex justify-content-between w-100 me-3">
                                                <span>
                                                    Commande du{' '}
                                                    {commande.date ||
                                                        new Date().toLocaleDateString(
                                                            'fr-FR'
                                                        )}
                                                </span>
                                                <span className="badge bg-primary">
                                                    {commande.total
                                                        ? commande.total.toLocaleString() +
                                                            ' XOF'
                                                        : 'Prix non disponible'}
                                                </span>
                                            </div>
                                        </button>
                                    </h2>
                                    <div
                                        id={`collapse${index}`}
                                        className="accordion-collapse collapse"
                                        aria-labelledby={`heading${index}`}
                                        data-bs-parent="#commandesAccordion"
                                    >
                                        <div className="accordion-body">
                                            {/* Informations client */}
                                            {commande.client && (
                                                <div className="mb-3">
                                                    <h6>
                                                        Informations de
                                                        livraison :
                                                    </h6>
                                                    <p>
                                                        <strong>Nom :</strong>{' '}
                                                        {commande.client.nom ||
                                                            'Non spécifié'}
                                                    </p>
                                                    <p>
                                                        <strong>Email :</strong>{' '}
                                                        {commande.client
                                                            .email ||
                                                            'Non spécifié'}
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Téléphone :
                                                        </strong>{' '}
                                                        {commande.client
                                                            .telephone ||
                                                            'Non spécifié'}
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Adresse :
                                                        </strong>{' '}
                                                        {commande.client
                                                            .adresse ||
                                                            'Non spécifié'}
                                                    </p>
                                                </div>
                                            )}

                                            <hr />

                                            {/* Produits commandés */}
                                            <h6>Produits commandés :</h6>
                                            {commande.produits &&
                                            commande.produits.length > 0 ? (
                                                <ul className="list-group">
                                                    {commande.produits.map(
                                                        (
                                                            produit,
                                                            produitIndex
                                                        ) => (
                                                            <li
                                                                key={
                                                                    produitIndex
                                                                }
                                                                className="list-group-item"
                                                            >
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <div>
                                                                        <strong>
                                                                            {produit.nom ||
                                                                                'Produit sans nom'}
                                                                        </strong>
                                                                        <br />
                                                                        <small className="text-muted">
                                                                            Quantité:{' '}
                                                                            {produit.quantite ||
                                                                                1}
                                                                            {produit.options &&
                                                                                Object.keys(
                                                                                    produit.options
                                                                                )
                                                                                    .length >
                                                                                    0 && (
                                                                                    <>
                                                                                        {' '}
                                                                                        |
                                                                                        Options:{' '}
                                                                                        {Object.entries(
                                                                                            produit.options
                                                                                        )
                                                                                            .map(
                                                                                                ([
                                                                                                    key,
                                                                                                    value,
                                                                                                ]) =>
                                                                                                    `${key}: ${value}`
                                                                                            )
                                                                                            .join(
                                                                                                ', '
                                                                                            )}
                                                                                    </>
                                                                                )}
                                                                        </small>
                                                                    </div>
                                                                    <span className="badge bg-secondary">
                                                                        {produit.prix
                                                                            ?   (
                                                                                    produit.prix *
                                                                                    (produit.quantite ||
                                                                                        1)
                                                                                ).toLocaleString() +
                                                                                    ' XOF'
                                                                                    : 'Prix non disponible'}
                                                                    </span>
                                                                </div>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            ) : (
                                                <p className="text-muted">
                                                    Aucun détail de produit
                                                    disponible.
                                                </p>
                                            )}

                                            {/* Statut de la commande */}
                                            {commande.statut && (
                                                <div className="mt-3">
                                                    <strong>Statut : </strong>
                                                    <span
                                                        className={`badge ${
                                                            commande.statut ===
                                                            'livrée'
                                                                ? 'bg-success'
                                                                : commande.statut ===
                                                                    'en cours'
                                                                    ? 'bg-warning'
                                                                    : commande.statut ===
                                                                        'annulée'
                                                                    ?   'bg-danger'
                                                                    :   'bg-secondary'
                                                        }`}
                                                    >
                                                        {commande.statut}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Section actions du compte */}
            <div className="row mt-5">
                <div className="col-12">
                    <div className="card border-warning">
                        <div className="card-header bg-warning text-dark">
                            <h5 className="mb-0">Actions du compte</h5>
                        </div>
                        <div className="card-body">
                            <p className="card-text">
                                Vous pouvez temporairement désactiver votre
                                compte. Vos données seront conservées mais vous
                                serez déconnecté.
                            </p>
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-outline-warning"
                                    onClick={handleDeactivate}
                                >
                                    Désactiver temporairement
                                </button>
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={() =>
                                        addToast({
                                            type: 'warning',
                                            title: 'Fonctionnalité à venir',
                                            message:
                                                'La suppression de compte sera bientôt disponible.',
                                        })
                                    }
                                >
                                    Supprimer le compte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
