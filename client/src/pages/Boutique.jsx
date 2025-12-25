import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProduits } from '../contexts/ProduitsContext';
import ProduitCard from '../components/produits/ProduitCard';
import FiltresBoutique from '../components/produits/FiltresBoutique';
import './Boutique.scss';

const Boutique = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { produits, loading, error, chargerProduits, rechercherProduits } =
        useProduits();

    const [filtresOuverts, setFiltresOuverts] = useState(false);
    const [tri, setTri] = useState('createdAt');
    const [page, setPage] = useState(1);
    const [filtresActifs, setFiltresActifs] = useState({});

    useEffect(() => {
        chargerProduitsAvecFiltres();
    }, [searchParams]);

    const chargerProduitsAvecFiltres = async () => {
        const params = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });

        try {
            await chargerProduits(params);
        } catch (err) {
            console.error('Erreur chargement produits:', err);
        }
    };

    const handleFiltreChange = nouveauxFiltres => {
        const nouveauxParams = new URLSearchParams(searchParams);
        nouveauxParams.set('page', '1');
        setPage(1);

        Object.entries(nouveauxFiltres).forEach(([key, value]) => {
            if (value && value !== '') {
                nouveauxParams.set(key, value);
            } else {
                nouveauxParams.delete(key);
            }
        });

        setSearchParams(nouveauxParams);
        setFiltresActifs(nouveauxFiltres);
    };

    const reinitialiserFiltres = () => {
        setSearchParams(new URLSearchParams());
        setFiltresActifs({});
        setTri('createdAt');
        setPage(1);
    };

    const handleTriChange = nouveauTri => {
        setTri(nouveauTri);
        const nouveauxParams = new URLSearchParams(searchParams);
        nouveauxParams.set('sort', nouveauTri);
        setSearchParams(nouveauxParams);
    };

    const totalProduits = produits.length || 0;

    return (
        <div className="boutique-page">
            <div className="container">
                <div className="page-header">
                    <h1>Boutique</h1>
                    <p className="subtitle">
                        Découvrez notre collection complète
                    </p>
                </div>

                <div className="boutique-content">
                    {/* Filtres mobile */}
                    <button
                        className="btn-filtres-mobile"
                        onClick={() => setFiltresOuverts(true)}
                    >
                        <i className="fas fa-filter"></i> Filtres
                    </button>

                    <div className="boutique-grid">
                        {/* Sidebar filtres */}
                        <div
                            className={`filtres-sidebar ${filtresOuverts ? 'open' : ''}`}
                        >
                            <div className="sidebar-header">
                                <h3>Filtres</h3>
                                <button
                                    className="btn-close-sidebar"
                                    onClick={() => setFiltresOuverts(false)}
                                >
                                    &times;
                                </button>
                            </div>
                            <FiltresBoutique
                                onFiltreChange={handleFiltreChange}
                                filtresActuels={filtresActifs}
                            />
                            <button
                                className="btn-reset-filters"
                                onClick={reinitialiserFiltres}
                            >
                                Réinitialiser les filtres
                            </button>
                        </div>

                        {/* Contenu principal */}
                        <div className="produits-container">
                            {/* Barre de contrôle */}
                            <div className="controle-bar">
                                <div className="results-count">
                                    {totalProduits} produit
                                    {totalProduits !== 1 ? 's' : ''} trouvé
                                    {totalProduits !== 1 ? 's' : ''}
                                </div>
                                <div className="controle-actions">
                                    <select
                                        className="select-tri"
                                        value={tri}
                                        onChange={e =>
                                            handleTriChange(e.target.value)
                                        }
                                    >
                                        <option value="createdAt">
                                            Nouveautés
                                        </option>
                                        <option value="prix-asc">
                                            Prix croissant
                                        </option>
                                        <option value="prix-desc">
                                            Prix décroissant
                                        </option>
                                        <option value="nom">Nom A-Z</option>
                                        <option value="popularite">
                                            Popularité
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Produits */}
                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p>Chargement des produits...</p>
                                </div>
                            ) : error ? (
                                <div className="error-container">
                                    <p>Erreur : {error}</p>
                                    <button
                                        onClick={chargerProduitsAvecFiltres}
                                    >
                                        Réessayer
                                    </button>
                                </div>
                            ) : produits.length === 0 ? (
                                <div className="empty-state">
                                    <i className="fas fa-box-open"></i>
                                    <h3>Aucun produit trouvé</h3>
                                    <p>
                                        Aucun produit ne correspond à vos
                                        critères
                                    </p>
                                    <button
                                        className="btn-primary"
                                        onClick={reinitialiserFiltres}
                                    >
                                        Réinitialiser les filtres
                                    </button>
                                </div>
                            ) : (
                                <div className="produits-grid">
                                    {produits.map(produit => (
                                        <ProduitCard
                                            key={produit._id || produit.id}
                                            produit={produit}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay mobile */}
            {filtresOuverts && (
                <div
                    className="overlay"
                    onClick={() => setFiltresOuverts(false)}
                ></div>
            )}
        </div>
    );
};

export default Boutique;