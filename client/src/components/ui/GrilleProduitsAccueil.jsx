import React from 'react';
import ProductCard from '../produits/ProduitCard';
import './GrilleProduitsAccueil.scss';

export default function GrilleProduitsAccueil({ produits, itemsPerPage = 8 }) {
    if (!produits || produits.length === 0) {
        return <div className="alert alert-info">Aucun produit disponible</div>;
    }

    return (
        <div className="grille-produits">
            <div className="row g-4">
                {produits.slice(0, itemsPerPage).map((produit) => (
                    <div key={produit.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <ProductCard produit={produit} />
                    </div>
                ))}
            </div>
            
            {produits.length > itemsPerPage && (
                <div className="text-center mt-4">
                    <button className="btn btn-outline-primary">
                        Voir plus de produits
                    </button>
                </div>
            )}
        </div>
    );
}