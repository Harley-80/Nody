import React from 'react';
import './StickyCartButton.scss';

export default function StickyCartButton({
    produit,
    selectedQuantity,
    onAddToCart,
}) {
    return (
        <div className="sticky-cart-button">
            <div className="container">
                <div className="sticky-content">
                    {/* Informations produit */}
                    <div className="sticky-info">
                        <div className="sticky-image">
                            {produit.images && produit.images[0] ? (
                                <img
                                    src={produit.images[0]}
                                    alt={produit.nom}
                                    onError={e => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <i className="fas fa-image"></i>
                            )}
                        </div>
                        <div className="sticky-details">
                            <div className="sticky-nom">{produit.nom}</div>
                            <div className="sticky-prix">
                                {parseFloat(
                                    produit.prixPromo || produit.prix
                                ).toLocaleString()}{' '}
                                XOF
                            </div>
                        </div>
                    </div>

                    {/* Bouton d'ajout */}
                    <button
                        className="sticky-btn-add"
                        onClick={onAddToCart}
                        disabled={produit.stock === 0}
                    >
                        <i className="fas fa-cart-plus me-2"></i>
                        Ajouter ({selectedQuantity})
                    </button>
                </div>
            </div>
        </div>
    );
}