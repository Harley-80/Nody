import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.scss'; 

export default function ProduitCard({ produit }) {
    const [addedToCart, setAddedToCart] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const handleAddToCart = e => {
        e.preventDefault();
        e.stopPropagation();
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
        // TODO: Ajouter au panier via contexte
    };

    const handleToggleFavorite = e => {
        e.preventDefault();
        e.stopPropagation();
        setIsFavorite(!isFavorite);
        // TODO: Gérer les favoris
    };

    // Formater le prix
    const formatPrix = prix => {
        return new Intl.NumberFormat('fr-FR').format(prix) + ' XOF';
    };

    // Obtenir l'URL de l'image
    const getImageUrl = () => {
        if (!produit.images || produit.images.length === 0) {
            return '/images/placeholder.jpg';
        }
        // Les images sont déjà des URLs complètes depuis le backend
        return produit.images[0];
    };

    // Vérifier si produit est nouveau (moins de 7 jours)
    const isNewProduct = () => {
        if (!produit.createdAt) return false;
        const createdDate = new Date(produit.createdAt);
        const now = new Date();
        const diffDays = Math.floor(
            (now - createdDate) / (1000 * 60 * 60 * 24)
        );
        return diffDays < 7;
    };

    return (
        <Link
            to={`/produit/${produit._id || produit.id}`}
            className="produit-card-link"
        >
            <div className="produit-card">
                {/* Badges */}
                <div className="card-badges">
                    {isNewProduct() && (
                        <span className="badge new">Nouveau</span>
                    )}
                    {produit.prixComparaison &&
                        produit.prixComparaison > produit.prix && (
                            <span className="badge discount">
                                -
                                {Math.round(
                                    ((produit.prixComparaison - produit.prix) /
                                        produit.prixComparaison) *
                                        100
                                )}
                                %
                            </span>
                        )}
                    {produit.quantite === 0 && (
                        <span className="badge out-of-stock">Rupture</span>
                    )}
                </div>

                {/* Image */}
                <div className="card-image">
                    <img
                        src={getImageUrl()}
                        alt={produit.nom}
                        loading="lazy"
                        onError={e => {
                            e.target.src = '/images/placeholder.jpg';
                        }}
                    />
                </div>

                {/* Infos */}
                <div className="card-content">
                    <h3 className="product-title">{produit.nom}</h3>
                    <p className="product-description">
                        {produit.description?.substring(0, 70)}...
                    </p>

                    <div className="product-meta">
                        <div className="price-section">
                            <span className="current-price">
                                {formatPrix(produit.prix)}
                            </span>
                            {produit.prixComparaison &&
                                produit.prixComparaison > produit.prix && (
                                    <span className="old-price">
                                        {formatPrix(produit.prixComparaison)}
                                    </span>
                                )}
                        </div>

                        <div className="stock-info">
                            {produit.quantite > 0 ? (
                                <span className="in-stock">
                                    {produit.quantite} en stock
                                </span>
                            ) : (
                                <span className="out-of-stock">
                                    Rupture de stock
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="card-actions">
                        <button
                            className={`btn-add-to-cart ${addedToCart ? 'added' : ''}`}
                            onClick={handleAddToCart}
                        >
                            {addedToCart ? '✓ Ajouté' : 'Ajouter au panier'}
                        </button>
                        <button
                            className={`btn-favorite ${isFavorite ? 'active' : ''}`}
                            onClick={handleToggleFavorite}
                        >
                            {isFavorite ? '❤️' : '🤍'}
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}