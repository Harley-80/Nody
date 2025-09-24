import React, { useState, useEffect } from 'react';
import { produitsMock } from '../data/produits.data';
import ProduitCard from '../components/produits/ProduitCard';

export default function PageProduits() {
    // États pour les filtres
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    
    // États pour la pagination
    const [page, setPage] = useState(1);
    const perPage = 8; // Nombre de produits par page
    
    // État pour le bouton "Retour en haut"
    const [showTop, setShowTop] = useState(false);

    // Récupération des catégories uniques
    const categories = [...new Set(produitsMock.map(p => p.categories))];

    // Filtrage des produits basé sur la recherche et la catégorie
    const produitsFiltres = produitsMock.filter(p => {
        const matchTexte = p.nom.toLowerCase().includes(query.toLowerCase());
        const matchCategorie = category ? p.categories === category : true;
        return matchTexte && matchCategorie;
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

    return (
        <div className="container py-5">
            <h2 className="mb-4">Tous les produits</h2>

            {/* Section Filtres */}
            <div className="row mb-4 g-2">
                <div className="col-md-6">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher un produit..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="col-md-6">
                    <select
                        className="form-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">Toutes les catégories</option>
                        {categories.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Affichage des produits */}
            {produitsFiltres.length === 0 ? (
                <p className="text-center py-5">Aucun produit trouvé.</p>
            ) : (
                <>
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                        {produitsPage.map((produit) => (
                            <div className="col" key={produit.id}>
                                <ProduitCard produit={produit} />
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <nav className="mt-4">
                            <ul className="pagination justify-content-center">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                                    <li 
                                        key={num} 
                                        className={`page-item ${num === page ? 'active' : ''}`}
                                    >
                                        <button 
                                            className="page-link" 
                                            onClick={() => {
                                                setPage(num);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                        >
                                            {num}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}
                </>
            )}

            {/* Bouton "Retour en haut" */}
            {showTop && (
                <button
                    className="btn btn-dark position-fixed bottom-0 end-0 m-4 rounded-circle shadow"
                    style={{ width: '50px', height: '50px' }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="Retour en haut"
                >
                    <i className="fas fa-arrow-up"></i>
                </button>
            )}
        </div>
    );
}