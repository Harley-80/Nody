import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './CommandeDetail.scss';

const CommandeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [commande, setCommande] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        chargerCommande();
    }, [id]);

    const chargerCommande = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/connexion');
                return;
            }

            // Charger la commande depuis l'API
            const response = await api.get(`/commandes/${id}`);
            setCommande(response.data);
        } catch (err) {
            console.error('Erreur chargement commande:', err);
            setError('Impossible de charger les détails de la commande');

            if (err.response?.status === 401) {
                navigate('/connexion');
            } else if (err.response?.status === 403) {
                setError("Vous n'avez pas accès à cette commande");
            } else if (err.response?.status === 404) {
                setError('Commande introuvable');
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = statut => {
        const statusMap = {
            en_attente: 'warning',
            confirmee: 'info',
            en_preparation: 'primary',
            expediee: 'secondary',
            livree: 'success',
            annulee: 'danger',
        };
        return statusMap[statut] || 'secondary';
    };

    const getStatusText = statut => {
        const statusText = {
            en_attente: 'En attente',
            confirmee: 'Confirmée',
            en_preparation: 'En préparation',
            expediee: 'Expédiée',
            livree: 'Livrée',
            annulee: 'Annulée',
        };
        return statusText[statut] || statut;
    };

    if (loading) {
        return (
            <div className="commande-detail-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Chargement des détails...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="commande-detail-page">
                <div className="error-container">
                    <i className="fas fa-exclamation-circle"></i>
                    <h3>{error}</h3>
                    <button
                        onClick={() => navigate('/profil')}
                        className="btn-primary"
                    >
                        Retour au profil
                    </button>
                </div>
            </div>
        );
    }

    if (!commande) {
        return null;
    }

    return (
        <div className="commande-detail-page">
            <div className="container">
                <button
                    onClick={() => navigate('/profil')}
                    className="btn-back"
                >
                    <i className="fas fa-arrow-left"></i>
                    Retour au profil
                </button>

                <div className="commande-header">
                    <div>
                        <h1>
                            Commande #
                            {commande.numeroCommande || commande._id.slice(-6)}
                        </h1>
                        <p className="date">
                            Passée le{' '}
                            {new Date(commande.createdAt).toLocaleDateString(
                                'fr-FR',
                                {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }
                            )}
                        </p>
                    </div>
                    <span
                        className={`badge badge-${getStatusClass(commande.statut)}`}
                    >
                        {getStatusText(commande.statut)}
                    </span>
                </div>

                <div className="commande-content">
                    <div className="section produits-section">
                        <h2>Produits commandés</h2>
                        <div className="produits-list">
                            {commande.produits?.map((item, index) => (
                                <div key={index} className="produit-item">
                                    <div className="produit-image">
                                        {item.produit?.images?.[0] ? (
                                            <img
                                                src={item.produit.images[0]}
                                                alt={item.produit.nom}
                                            />
                                        ) : (
                                            <div className="no-image">
                                                <i className="fas fa-image"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="produit-info">
                                        <h3>
                                            {item.produit?.nom || 'Produit'}
                                        </h3>
                                        <p>Quantité: {item.quantite}</p>
                                        <p className="prix-unitaire">
                                            {item.prix?.toLocaleString()} XOF /
                                            unité
                                        </p>
                                    </div>
                                    <div className="produit-total">
                                        <strong>
                                            {(
                                                item.prix * item.quantite
                                            )?.toLocaleString()}{' '}
                                            XOF
                                        </strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="section infos-section">
                        <h2>Informations de livraison</h2>
                        <div className="info-card">
                            <div className="info-item">
                                <i className="fas fa-user"></i>
                                <div>
                                    <label>Nom</label>
                                    <p>
                                        {commande.adresseLivraison?.nom ||
                                            commande.utilisateur?.nom ||
                                            'Non renseigné'}
                                    </p>
                                </div>
                            </div>
                            <div className="info-item">
                                <i className="fas fa-phone"></i>
                                <div>
                                    <label>Téléphone</label>
                                    <p>
                                        {commande.adresseLivraison?.telephone ||
                                            commande.utilisateur?.telephone ||
                                            'Non renseigné'}
                                    </p>
                                </div>
                            </div>
                            <div className="info-item">
                                <i className="fas fa-map-marker-alt"></i>
                                <div>
                                    <label>Adresse</label>
                                    <p>
                                        {commande.adresseLivraison?.adresse ||
                                            'Non renseignée'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <h2>Résumé de la commande</h2>
                        <div className="resume-card">
                            <div className="resume-item">
                                <span>Sous-total</span>
                                <span>
                                    {commande.montantTotal?.toLocaleString()}{' '}
                                    XOF
                                </span>
                            </div>
                            <div className="resume-item">
                                <span>Livraison</span>
                                <span>
                                    {commande.fraisLivraison?.toLocaleString() ||
                                        0}{' '}
                                    XOF
                                </span>
                            </div>
                            <div className="resume-item total">
                                <strong>Total</strong>
                                <strong>
                                    {(
                                        commande.montantTotal +
                                        (commande.fraisLivraison || 0)
                                    )?.toLocaleString()}{' '}
                                    XOF
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandeDetail;
