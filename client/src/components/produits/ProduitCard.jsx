import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ProduitCard({ produit }) {
    const [addedToCart, setAddedToCart] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleToggleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsFavorite(!isFavorite);
    };

    let badgeClass = 'bg-primary';
    if (produit.status === 'Nouveau') badgeClass = 'bg-info';
    else if (produit.status === 'Promo') badgeClass = 'bg-danger';
    else if (produit.status === 'Exclusif') badgeClass = 'bg-warning text-dark';

    return (
        <Link to={`/produit/${produit.id}`} className="text-decoration-none text-dark">
            <div className="card h-100 shadow-sm card-hover overflow-hidden position-relative">
                {produit.status && (
                    <span className={`badge ${badgeClass} position-absolute top-0 start-0 m-2`}>
                        {produit.status}
                    </span>
                )}

                {/* Image avec lazy loading */}
                <img
                    src={produit.image}
                    alt={produit.nom}
                    className="card-img-top"
                    loading="lazy"
                    style={{ objectFit: 'cover', height: '250px' }}
                />

                <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{produit.nom}</h5>
                    <p className="card-text small text-muted mb-2">
                        {produit.description.length > 70
                            ? `${produit.description.substring(0, 70)}...`
                            : produit.description}
                    </p>

                    <div className="d-flex justify-content-between align-items-center mt-auto">
                        <p className="text-primary fw-bold mb-0">
                            {produit.prix.toLocaleString()} XOF
                        </p>
                        <button
                            className={`btn btn-link ${isFavorite ? 'text-danger' : 'text-secondary'} p-0`}
                            onClick={handleToggleFavorite}
                        >
                            <i className={`fas fa-heart ${isFavorite ? 'fa-beat' : ''}`}></i>
                        </button>
                    </div>

                    <button
                        className={`btn ${addedToCart ? 'btn-success' : 'btn-dark'} mt-3`}
                        onClick={handleAddToCart}
                    >
                        <i className={`fas ${addedToCart ? 'fa-check' : 'fa-cart-plus'} me-2`}></i>
                        {addedToCart ? 'Ajouté !' : 'Ajouter au panier'}
                    </button>
                </div>
            </div>
        </Link>
    );
}