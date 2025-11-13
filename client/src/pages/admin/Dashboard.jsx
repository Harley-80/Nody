import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const AdminDashboard = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtreStatut, setFiltreStatut] = useState('tous');
    const [filtreRecherche, setFiltreRecherche] = useState('');

    // Données mockées pour les statuts
    const statutsCommandes = [
        {
            id: 'en_attente',
            nom: 'Commande en attente de traitement',
            couleur: 'warning',
        },
        { id: 'en_traitement', nom: 'En traitement', couleur: 'info' },
        {
            id: 'en_cours',
            nom: 'Commande en cours de traitement',
            couleur: 'primary',
        },
        { id: 'expedie', nom: 'Expédiée', couleur: 'secondary' },
        {
            id: 'expedie_client',
            nom: 'Commande expédiée au client',
            couleur: 'success',
        },
        { id: 'livre', nom: 'Commande livrée avec succès', couleur: 'success' },
        { id: 'annule', nom: 'Commande annulée', couleur: 'danger' },
        { id: 'rembourse', nom: 'Commande remboursée', couleur: 'dark' },
    ];

    useEffect(() => {
        // Simulation de chargement des données
        const chargerCommandes = async () => {
            try {
                setLoading(true);
                // TODO: Remplacer par appel API réel
                const commandesMock = [
                    {
                        id: 'CMD-001',
                        client: 'Jean Dupont',
                        email: 'jean@example.com',
                        date: '2024-01-15',
                        statut: 'en_attente',
                        produits: ['Produit A', 'Produit B'],
                        total: 15000,
                        adresse: '123 Rue Example, Dakar',
                    },
                ];
                setCommandes(commandesMock);
            } catch (error) {
                console.error('Erreur chargement commandes:', error);
                addToast({
                    type: 'error',
                    title: 'Erreur',
                    message: 'Impossible de charger les commandes',
                });
            } finally {
                setLoading(false);
            }
        };

        chargerCommandes();
    }, [addToast]);

    const commandesFiltrees = commandes.filter(commande => {
        const correspondStatut =
            filtreStatut === 'tous' || commande.statut === filtreStatut;
        const correspondRecherche =
            filtreRecherche === '' ||
            commande.client
                .toLowerCase()
                .includes(filtreRecherche.toLowerCase()) ||
            commande.email
                .toLowerCase()
                .includes(filtreRecherche.toLowerCase()) ||
            commande.adresse
                .toLowerCase()
                .includes(filtreRecherche.toLowerCase()) ||
            commande.produits.some(prod =>
                prod.toLowerCase().includes(filtreRecherche.toLowerCase())
            );

        return correspondStatut && correspondRecherche;
    });

    const getCouleurStatut = statutId => {
        const statut = statutsCommandes.find(s => s.id === statutId);
        return statut ? statut.couleur : 'secondary';
    };

    const getNomStatut = statutId => {
        const statut = statutsCommandes.find(s => s.id === statutId);
        return statut ? statut.nom : 'Statut inconnu';
    };

    return (
        <div className="container-fluid">
            {/* En-tête du dashboard */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1">Dashboard Admin</h1>
                    <p className="text-muted mb-0">
                        Bienvenue, {user?.prenom} {user?.nom}
                    </p>
                </div>
                <div className="text-end">
                    <div className="badge bg-primary fs-6">
                        {commandes.length} commande(s)
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="row mb-4">
                <div className="col-md-8">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Filtrer par texte (client, email, adresse, date, statut, produits)..."
                        value={filtreRecherche}
                        onChange={e => setFiltreRecherche(e.target.value)}
                    />
                </div>
                <div className="col-md-4">
                    <select
                        className="form-select"
                        value={filtreStatut}
                        onChange={e => setFiltreStatut(e.target.value)}
                    >
                        <option value="tous">Tous les statuts</option>
                        {statutsCommandes.map(statut => (
                            <option key={statut.id} value={statut.id}>
                                {statut.nom}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Légende des statuts */}
            <div className="card mb-4">
                <div className="card-header">
                    <h5 className="card-title mb-0">Légende des statuts</h5>
                </div>
                <div className="card-body">
                    <div className="row">
                        {statutsCommandes.map(statut => (
                            <div
                                key={statut.id}
                                className="col-md-6 col-lg-4 mb-2"
                            >
                                <span
                                    className={`badge bg-${statut.couleur} me-2`}
                                >
                                    ●
                                </span>
                                {statut.nom}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Liste des commandes */}
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">Commandes récentes</h5>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-4">
                            <div
                                className="spinner-border text-primary"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Chargement...
                                </span>
                            </div>
                            <p className="mt-2">Chargement des commandes...</p>
                        </div>
                    ) : commandesFiltrees.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="text-muted mb-3">
                                <i className="fas fa-box-open fa-3x"></i>
                            </div>
                            <h5>Aucune commande enregistrée</h5>
                            <p className="text-muted">
                                {filtreStatut !== 'tous' ||
                                filtreRecherche !== ''
                                    ? 'Aucune commande ne correspond aux filtres sélectionnés.'
                                    : "Aucune commande n'a été passée pour le moment."}
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>ID Commande</th>
                                        <th>Client</th>
                                        <th>Email</th>
                                        <th>Date</th>
                                        <th>Produits</th>
                                        <th>Total</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commandesFiltrees.map(commande => (
                                        <tr key={commande.id}>
                                            <td>
                                                <strong>{commande.id}</strong>
                                            </td>
                                            <td>{commande.client}</td>
                                            <td>{commande.email}</td>
                                            <td>{commande.date}</td>
                                            <td>
                                                <small>
                                                    {commande.produits
                                                        .slice(0, 2)
                                                        .join(', ')}
                                                    {commande.produits.length >
                                                        2 && '...'}
                                                </small>
                                            </td>
                                            <td>
                                                <strong>
                                                    {commande.total.toLocaleString()}{' '}
                                                    FCFA
                                                </strong>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge bg-${getCouleurStatut(commande.statut)}`}
                                                >
                                                    {getNomStatut(
                                                        commande.statut
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => {
                                                        addToast({
                                                            type: 'info',
                                                            title: 'Détails commande',
                                                            message: `Détails de la commande ${commande.id}`,
                                                        });
                                                    }}
                                                >
                                                    Voir détails
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Statistiques rapides */}
            <div className="row mt-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h4>{commandes.length}</h4>
                                    <p className="mb-0">Total Commandes</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-shopping-cart fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h4>
                                        {
                                            commandes.filter(
                                                c => c.statut === 'livre'
                                            ).length
                                        }
                                    </h4>
                                    <p className="mb-0">Commandes Livrées</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-check-circle fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-warning text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h4>
                                        {
                                            commandes.filter(c =>
                                                [
                                                    'en_attente',
                                                    'en_traitement',
                                                ].includes(c.statut)
                                            ).length
                                        }
                                    </h4>
                                    <p className="mb-0">En Attente</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-clock fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-danger text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h4>
                                        {
                                            commandes.filter(
                                                c => c.statut === 'annule'
                                            ).length
                                        }
                                    </h4>
                                    <p className="mb-0">Annulées</p>
                                </div>
                                <div className="align-self-center">
                                    <i className="fas fa-times-circle fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
