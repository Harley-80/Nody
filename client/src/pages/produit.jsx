import React, { useState, useEffect } from 'react';
import ProduitCard from '../components/produits/ProduitCard';
import { useProduits } from '../contexts/ProduitsContext';

export default function PageProduits() {
    // États pour les filtres
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');

    // États pour la pagination
    const [page, setPage] = useState(1);
    const perPage = 8;

    // État pour le bouton "Retour en haut"
    const [showTop, setShowTop] = useState(false);

    // Utiliser le contexte des produits
    const { produits, loading, error, categories, refreshProduits } =
        useProduits();

    // Récupération des catégories uniques depuis l'API ou le contexte
    const categoriesUniques = categories || [];

    // Filtrage des produits basé sur la recherche et la catégorie
    const produitsFiltres = produits.filter(p => {
        const matchTexte =
            p.nom.toLowerCase().includes(query.toLowerCase()) ||
            p.description?.toLowerCase().includes(query.toLowerCase());
        const matchCategorie = category
            ? p.categorie?._id === category ||
              p.categorie === category ||
              p.categorie?.nom?.toLowerCase().includes(category.toLowerCase())
            : true;

        // Filtrer seulement les produits actifs
        const estActif = p.estActif !== false;

        return matchTexte && matchCategorie && estActif;
    });

    // Pagination des produits
    const produitsPage = produitsFiltres.slice(
        (page - 1) * perPage,
        page * perPage
    );
    const totalPages = Math.ceil(produitsFiltres.length / perPage);

    // Gestion du bouton "Retour en haut"
    useEffect(() => {
        const handleScroll = () => {
            setShowTop(window.scrollY > 600);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Réinitialise la page à 1 quand les filtres changent
    useEffect(() => {
        setPage(1);
    }, [query, category]);

    // Gestion du chargement
    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2">Chargement des produits...</p>
            </div>
        );
    }

    // Gestion des erreurs
    if (error) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger">
                    <h5>Erreur lors du chargement des produits</h5>
                    <p>{error}</p>
                    <button
                        onClick={refreshProduits}
                        className="btn btn-primary"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <h2 className="mb-4">Tous les produits</h2>

            {/* Info sur le nombre de produits */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted mb-0">
                    {produitsFiltres.length} produit(s) trouvé(s) sur{' '}
                    {produits.length} au total
                </p>
                <button
                    onClick={refreshProduits}
                    className="btn btn-outline-primary btn-sm"
                >
                    <i className="bi bi-arrow-clockwise me-1"></i> Actualiser
                </button>
            </div>

            {/* Section Filtres */}
            <div className="row mb-4 g-2">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Rechercher un produit..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <select
                        className="form-select"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        disabled={categoriesUniques.length === 0}
                    >
                        <option value="">Toutes les catégories</option>
                        {categoriesUniques.map((cat, idx) => (
                            <option key={cat._id || idx} value={cat._id || cat}>
                                {cat.nom || cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Affichage des produits */}
            {produitsFiltres.length === 0 ? (
                <div className="text-center py-5">
                    <div className="alert alert-info">
                        <h5>Aucun produit trouvé</h5>
                        <p className="mb-3">
                            Essayez de modifier vos critères de recherche.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setQuery('');
                                setCategory('');
                            }}
                        >
                            Réinitialiser les filtres
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                        {produitsPage.map(produit => (
                            <div
                                className="col"
                                key={produit._id || produit.id}
                            >
                                <ProduitCard produit={produit} />
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <nav className="mt-4">
                            <ul className="pagination justify-content-center">
                                <li
                                    className={`page-item ${page === 1 ? 'disabled' : ''}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => {
                                            setPage(1);
                                            window.scrollTo({
                                                top: 0,
                                                behavior: 'smooth',
                                            });
                                        }}
                                        disabled={page === 1}
                                    >
                                        <i className="bi bi-chevron-double-left"></i>
                                    </button>
                                </li>
                                <li
                                    className={`page-item ${page === 1 ? 'disabled' : ''}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => {
                                            setPage(prev => prev - 1);
                                            window.scrollTo({
                                                top: 0,
                                                behavior: 'smooth',
                                            });
                                        }}
                                        disabled={page === 1}
                                    >
                                        <i className="bi bi-chevron-left"></i>
                                    </button>
                                </li>

                                {Array.from(
                                    { length: Math.min(5, totalPages) },
                                    (_, i) => {
                                        let pageNum;
                                        if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }

                                        return pageNum >= 1 &&
                                            pageNum <= totalPages ? (
                                            <li
                                                key={pageNum}
                                                className={`page-item ${pageNum === page ? 'active' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() => {
                                                        setPage(pageNum);
                                                        window.scrollTo({
                                                            top: 0,
                                                            behavior: 'smooth',
                                                        });
                                                    }}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        ) : null;
                                    }
                                )}

                                <li
                                    className={`page-item ${page === totalPages ? 'disabled' : ''}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => {
                                            setPage(prev => prev + 1);
                                            window.scrollTo({
                                                top: 0,
                                                behavior: 'smooth',
                                            });
                                        }}
                                        disabled={page === totalPages}
                                    >
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                </li>
                                <li
                                    className={`page-item ${page === totalPages ? 'disabled' : ''}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => {
                                            setPage(totalPages);
                                            window.scrollTo({
                                                top: 0,
                                                behavior: 'smooth',
                                            });
                                        }}
                                        disabled={page === totalPages}
                                    >
                                        <i className="bi bi-chevron-double-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}

            {/* Bouton "Retour en haut" */}
            {showTop && (
                <button
                    className="btn btn-dark position-fixed bottom-0 end-0 m-4 rounded-circle shadow"
                    style={{ width: '50px', height: '50px', zIndex: 1000 }}
                    onClick={() =>
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                    aria-label="Retour en haut"
                >
                    <i className="fas fa-arrow-up"></i>
                </button>
            )}
        </div>
    );
}
