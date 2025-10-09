import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/api';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getCategories()
            .then(data => {
                setCategories(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Erreur lors du chargement des catégories');
                setLoading(false);
            });
    }, []);

    return (
        <div className="container py-5">
            <h1>Catégories</h1>
            {loading && <p>Chargement...</p>}
            {error && <p className="text-danger">{error}</p>}
            <div className="row">
                {categories.map(cat => (
                    <div
                        key={cat._id || cat.id || cat.nom}
                        className="col-md-4 mb-3"
                    >
                        <Link
                            to={`/categorie/${encodeURIComponent((cat.slug || cat.nom || cat.name || '').toLowerCase().replace(/\s+/g, '-'))}`}
                            className="card p-3 text-decoration-none text-dark h-100"
                        >
                            <h5>{cat.nom || cat.name}</h5>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
