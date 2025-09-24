import React from 'react';
import { Link } from 'react-router-dom';
import { produitsMock } from '../data/produits.data'; // données si besoin

export default function Categories() {
    const categories = [...new Set(produitsMock.map(p => p.categories))].sort();

    return (
        <div className="container py-5">
            <h1>Catégories</h1>
            <div className="row">
                {categories.map(cat => (
                    <div key={cat} className="col-md-4 mb-3">
                        <Link 
                            to={`/categorie/${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'))}`} 
                            className="card p-3 text-decoration-none text-dark h-100"
                        >
                        <h5>{cat}</h5>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
