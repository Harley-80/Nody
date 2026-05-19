import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProduitsSimilaires.scss';

export default function ProduitsSimilaires({ produits }) {
    const navigate = useNavigate();

    if (!produits || produits.length === 0) {
        return null;
    }

    return (
        <div className="produits-similaires mt-5">
            <div className="similaires-header">
                <h3 className="mb-4">
                    <i className="fas fa-th-large me-2"></i>
                    Produits similaires
                </h3>
            </div>

            <div className="similaires-grid">
                {produits.slice(0, 4).map(produit => (
                    <div
                        key={produit._id || produit.id}
                        className="similaire-card"
                        onClick={() => {
                            navigate(`/produit/${produit._id || produit.id}`);
                            window.scrollTo(0, 0);
                        }}
                    >
                        {/* Image */}
                        <div className="similaire-image">
                            {produit.images && produit.images.length > 0 ? (
                                <img
                                    src={produit.images[0]}
                                    alt={produit.nom}
                                    onError={e => {
                                        e.target.src =
                                            '/images/placeholder.jpg';
                                    }}
                                />
                            ) : (
                                <div className="image-placeholder">
                                    <i className="fas fa-image"></i>
                                </div>
                            )}

                            {/* Badges */}
                            <div className="similaire-badges">
                                {produit.estNouveau && (
                                    <span className="badge badge-nouveau">
                                        Nouveau
                                    </span>
                                )}
                                {produit.prixPromo && (
                                    <span className="badge badge-promo">
                                        -
                                        {Math.round(
                                            ((produit.prix -
                                                produit.prixPromo) /
                                                produit.prix) *
                                                100
                                        )}
                                        %
                                    </span>
                                )}
                            </div>

                            {/* Quick actions */}
                            <div className="similaire-actions">
                                <button
                                    className="btn-action"
                                    onClick={e => {
                                        e.stopPropagation();
                                        // TODO: Ajouter aux favoris
                                    }}
                                    title="Ajouter aux favoris"
                                >
                                    <i className="far fa-heart"></i>
                                </button>
                                <button
                                    className="btn-action"
                                    onClick={e => {
                                        e.stopPropagation();
                                        navigate(
                                            `/produit/${produit._id || produit.id}`
                                        );
                                    }}
                                    title="Voir les détails"
                                >
                                    <i className="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        {/* Informations */}
                        <div className="similaire-info">
                            {/* Catégorie */}
                            {produit.categorie && (
                                <div className="similaire-categorie">
                                    {produit.categorie.nom || produit.categorie}
                                </div>
                            )}

                            {/* Nom */}
                            <h5 className="similaire-nom">{produit.nom}</h5>

                            {/* Note */}
                            {produit.noteMoyenne > 0 && (
                                <div className="similaire-note">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <i
                                            key={star}
                                            className={`fas fa-star ${star <= Math.round(produit.noteMoyenne) ? 'filled' : ''}`}
                                        ></i>
                                    ))}
                                    <span className="note-text">
                                        ({produit.nombreAvis || 0})
                                    </span>
                                </div>
                            )}

                            {/* Prix */}
                            <div className="similaire-prix">
                                {produit.prixPromo ? (
                                    <>
                                        <span className="prix-promo">
                                            {parseFloat(
                                                produit.prixPromo
                                            ).toLocaleString()}{' '}
                                            XOF
                                        </span>
                                        <span className="prix-original">
                                            {parseFloat(
                                                produit.prix
                                            ).toLocaleString()}{' '}
                                            XOF
                                        </span>
                                    </>
                                ) : (
                                    <span className="prix-normal">
                                        {parseFloat(
                                            produit.prix
                                        ).toLocaleString()}{' '}
                                        XOF
                                    </span>
                                )}
                            </div>

                            {/* Stock */}
                            <div className="similaire-stock">
                                {produit.stock > 0 ? (
                                    <span className="stock-available">
                                        <i className="fas fa-check-circle"></i>
                                        En stock
                                    </span>
                                ) : (
                                    <span className="stock-unavailable">
                                        <i className="fas fa-times-circle"></i>
                                        Rupture
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Voir plus */}
            {produits.length > 4 && (
                <div className="text-center mt-4">
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => navigate('/boutique')}
                    >
                        Voir plus de produits similaires
                        <i className="fas fa-arrow-right ms-2"></i>
                    </button>
                </div>
            )}
        </div>
    );
}