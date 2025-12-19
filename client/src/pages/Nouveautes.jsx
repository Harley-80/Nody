import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProduits } from '../contexts/ProduitsContext';
import './Nouveautes.scss';

// Page des nouveautés
const Nouveautes = () => {
    const { getNouveauxProduits } = useProduits();
    const [nouveautes, setNouveautes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Charger les nouveautés au montage
    useEffect(() => {
        const chargerNouveautes = async () => {
            try {
                setLoading(true);
                const produits = await getNouveauxProduits();
                setNouveautes(produits);
            } catch (err) {
                console.error('Erreur chargement nouveautés:', err);
                setError('Impossible de charger les nouveautés');
            } finally {
                setLoading(false);
            }
        };

        chargerNouveautes();
    }, []);

    // Affichage conditionnel
    if (loading) {
        return (
            <div className="nouveautes-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Chargement des nouveautés...</p>
                </div>
            </div>
        );
    }

    // Gestion des erreurs
    if (error) {
        return (
            <div className="nouveautes-page">
                <div className="error-container">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="nouveautes-page">
            <div className="container">
                <div className="page-header">
                    <h1>Nouveautés</h1>
                    <p>Découvrez nos derniers produits ajoutés</p>
                </div>

                {nouveautes.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-box-open"></i>
                        <h3>Aucune nouveauté pour le moment</h3>
                        <p>
                            Revenez bientôt pour découvrir nos nouveaux produits
                            !
                        </p>
                        <Link to="/boutique" className="btn-primary">
                            Voir tous les produits
                        </Link>
                    </div>
                ) : (
                    <div className="produits-grid">
                        {nouveautes.map(produit => (
                            <Link
                                to={`/produit/${produit._id}`}
                                key={produit._id}
                                className="produit-card"
                            >
                                <div className="produit-image">
                                    {produit.images &&
                                    produit.images.length > 0 ? (
                                        <img
                                            src={produit.images[0]}
                                            alt={produit.nom}
                                        />
                                    ) : (
                                        <div className="no-image">
                                            <i className="fas fa-image"></i>
                                        </div>
                                    )}
                                    <span className="badge-new">Nouveau</span>
                                </div>

                                <div className="produit-info">
                                    <h3>{produit.nom}</h3>
                                    <p className="description">
                                        {produit.description?.substring(0, 80)}
                                        ...
                                    </p>
                                    <div className="produit-footer">
                                        <span className="prix">
                                            {produit.prix?.toLocaleString()} XOF
                                        </span>
                                        {produit.stock > 0 ? (
                                            <span className="stock disponible">
                                                En stock
                                            </span>
                                        ) : (
                                            <span className="stock rupture">
                                                Rupture
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Nouveautes;
