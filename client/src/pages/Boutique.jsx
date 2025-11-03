import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProduits } from '../contexts/ProduitsContext.jsx';
import ProduitCard from '../components/produits/ProduitCard.jsx';
import FiltresBoutique from '../components/produits/FiltresBoutique.jsx';
import './Boutique.scss';

// Composant Boutique
const Boutique = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        produits,
        estCharge,
        chargerProduits,
        pagination,
        filtres = {}, // Valeur par défaut pour éviter les erreurs si `filtres` est `undefined`
        mettreAJourFiltre,
        reinitialiserFiltres,
    } = useProduits();
    
    const [filtresOuverts, setFiltresOuverts] = useState(false);
    const [tri, setTri] = useState(searchParams.get('sort') || 'createdAt');
    
    useEffect(() => {
        chargerProduitsAvecFiltres();
    }, [searchParams]);

    // Fonction pour charger les produits avec les filtres
    const chargerProduitsAvecFiltres = async () => {
        const parametres = {};
        searchParams.forEach((value, key) => {
            parametres[key] = value;
        });
        await chargerProduits(parametres);
    };

    // Fonction pour mettre à jour les filtres
    const handleTriChange = nouveauTri => {
        setTri(nouveauTri);
        const nouveauxParams = new URLSearchParams(searchParams);
        nouveauxParams.set('sort', nouveauTri);
        setSearchParams(nouveauxParams);
    };

    // Fonction pour mettre à jour la pagination
    const handlePageChange = nouvellePage => {
        const nouveauxParams = new URLSearchParams(searchParams);
        nouveauxParams.set('page', nouvellePage);
        setSearchParams(nouveauxParams);
    };

    // Fonction pour mettre à jour les filtres
    const handleFiltreChange = nouveauxFiltres => {
        const nouveauxParams = new URLSearchParams(searchParams);
        nouveauxParams.set('page', '1');

        // Mettre à jour les filtres
        Object.entries(nouveauxFiltres).forEach(([key, value]) => {
            const urlValue = Array.isArray(value) ? value.join(',') : value;
            if (!urlValue || (typeof urlValue === 'boolean' && !urlValue)) {
                nouveauxParams.delete(key);
            } else {
                nouveauxParams.set(key, urlValue);
            }
        });

        setSearchParams(nouveauxParams);
    };
    
    const totalProduits = pagination?.total || 0;
    const pageActuelle = parseInt(searchParams.get('page')) || 1;
    const totalPages = pagination?.pages || 1;
    
    return (
        <div className="page-boutique">
            <div className="container-fluid">
                <div className="row">
                    {/* Sidebar des filtres */}
                    <div
                        className={`col-lg-3 col-xl-2 filtres-sidebar ${filtresOuverts ? 'ouvert' : ''}`}
                    >
                        <div className="filtres-header d-flex justify-content-between align-items-center d-lg-none p-3 border-bottom">
                            <h5 className="mb-0">Filtres</h5>
                            <button
                                className="btn-close"
                                onClick={() => setFiltresOuverts(false)}
                            ></button>
                        </div>
                        <FiltresBoutique
                            onFiltreChange={handleFiltreChange}
                            filtresActuels={filtres}
                        />
                    </div>

                    {/* Contenu principal */}
                    <div className="col-lg-9 col-xl-10">
                        <div className="boutique-header p-3 bg-light rounded mb-4">
                            <div className="row align-items-center">
                                <div className="col-md-6">
                                    <h1 className="h3 mb-0">Boutique</h1>
                                    <p className="text-muted mb-0 mt-1">
                                        {totalProduits} produit
                                        {totalProduits > 1 ? 's' : ''} trouvé
                                        {totalProduits > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex justify-content-md-end align-items-center gap-3">
                                        <button
                                            className="btn btn-outline-primary d-lg-none"
                                            onClick={() =>
                                                setFiltresOuverts(true)
                                            }
                                        >
                                            <i className="bi bi-funnel me-2"></i>
                                            Filtres
                                        </button>
                                        <select
                                            className="form-select"
                                            value={tri}
                                            onChange={e =>
                                                handleTriChange(e.target.value)
                                            }
                                            style={{ width: 'auto' }}
                                        >
                                            <option value="createdAt">
                                                Nouveautés
                                            </option>
                                            <option value="prix-croissant">
                                                Prix croissant
                                            </option>
                                            <option value="prix-decroissant">
                                                Prix décroissant
                                            </option>
                                            <option value="populaires">
                                                Les plus populaires
                                            </option>
                                            <option value="notes">
                                                Meilleures notes
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Affichage des produits */}
                        {estCharge ? (
                            <div className="row">
                                {[...Array(8)].map((_, index) => (
                                    <div
                                        key={index}
                                        className="col-sm-6 col-md-4 col-lg-3 mb-4"
                                    >
                                        <div className="card">
                                            <div className="placeholder-glow">
                                                <div
                                                    className="card-img-top placeholder"
                                                    style={{ height: '200px' }}
                                                ></div>
                                                <div className="card-body">
                                                    <h5 className="card-title placeholder-glow">
                                                        <span className="placeholder col-8"></span>
                                                    </h5>
                                                    <p className="card-text placeholder-glow">
                                                        <span className="placeholder col-6"></span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : produits.length > 0 ? (
                            <>
                                <div className="row g-4">
                                    {produits.map(produit => (
                                        <div
                                            key={produit._id}
                                            className="col-sm-6 col-md-4 col-lg-3"
                                        >
                                            <ProduitCard produit={produit} />
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <nav className="mt-5">
                                        <ul className="pagination justify-content-center">
                                            <li
                                                className={`page-item ${pageActuelle === 1 ? 'disabled' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() =>
                                                        handlePageChange(
                                                            pageActuelle - 1
                                                        )
                                                    }
                                                    disabled={
                                                        pageActuelle === 1
                                                    }
                                                >
                                                    Précédent
                                                </button>
                                            </li>
                                            {[...Array(totalPages)].map(
                                                (_, index) => {
                                                    const page = index + 1;
                                                    if (
                                                        page === 1 ||
                                                        page === totalPages ||
                                                        (page >=
                                                            pageActuelle - 1 &&
                                                            page <=
                                                                pageActuelle +
                                                                    1)
                                                    ) {
                                                        return (
                                                            <li
                                                                key={page}
                                                                className={`page-item ${page === pageActuelle ? 'active' : ''}`}
                                                            >
                                                                <button
                                                                    className="page-link"
                                                                    onClick={() =>
                                                                        handlePageChange(
                                                                            page
                                                                        )
                                                                    }
                                                                >
                                                                    {page}
                                                                </button>
                                                            </li>
                                                        );
                                                    } else if (
                                                        (page ===
                                                            pageActuelle - 2 ||
                                                            page ===
                                                                pageActuelle +
                                                                    2) &&
                                                        totalPages > 5
                                                    ) {
                                                        return (
                                                            <li
                                                                key={page}
                                                                className="page-item disabled"
                                                            >
                                                                <span className="page-link">
                                                                    ...
                                                                </span>
                                                            </li>
                                                        );
                                                    }
                                                    return null;
                                                }
                                            )}
                                            <li
                                                className={`page-item ${pageActuelle === totalPages ? 'disabled' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() =>
                                                        handlePageChange(
                                                            pageActuelle + 1
                                                        )
                                                    }
                                                    disabled={
                                                        pageActuelle ===
                                                        totalPages
                                                    }
                                                >
                                                    Suivant
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-5">
                                <div className="empty-state">
                                    <i className="bi bi-search display-1 text-muted mb-4"></i>
                                    <h3 className="mb-3">
                                        Aucun produit trouvé
                                    </h3>
                                    <p className="text-muted mb-4">
                                        Aucun produit ne correspond à vos
                                        critères de recherche.
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={reinitialiserFiltres}
                                    >
                                        Réinitialiser les filtres
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Overlay pour mobile */}
            {filtresOuverts && (
                <div
                    className="filtres-overlay d-lg-none"
                    onClick={() => setFiltresOuverts(false)}
                ></div>
            )}
        </div>
    );
};

export default Boutique;
