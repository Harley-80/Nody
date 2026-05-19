import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import produitsService from '../services/produitsService';

// Import des nouveaux composants
import GalerieImagesZoom from '../components/produits/GalerieImagesZoom';
import SelecteurVariantes from '../components/produits/SelecteurVariantes';
import OngletsInfosProduit from '../components/produits/OngletsInfosProduit';
import SectionAvisClients from '../components/produits/SectionAvisClients';
import ProduitsSimilaires from '../components/produits/ProduitsSimilaires';
import BoutonsFavorisPartage from '../components/produits/BoutonsFavorisPartage';
import StickyCartButton from '../components/produits/StickyCartButton';

import './PageDetailProduit.scss';

export default function PageDetailProduit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { ajouterAuPanier } = useCart();
    const { utilisateur } = useAuth();

    // États de base
    const [produit, setProduit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [activeImage, setActiveImage] = useState('');

    // États pour les nouvelles fonctionnalités
    const [avis, setAvis] = useState([]);
    const [produitsSimilaires, setProduitsSimilaires] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [isSticky, setIsSticky] = useState(false);

    // Charger le produit
    useEffect(() => {
        const fetchProduit = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await produitsService.getProduitById(id);

                if (data && data.donnees) {
                    setProduit(data.donnees);

                    // Définir l'image active
                    if (data.donnees.images && data.donnees.images.length > 0) {
                        setActiveImage(data.donnees.images[0]);
                    }

                    // Charger les avis
                    fetchAvis(id);

                    // Charger les produits similaires
                    fetchProduitsSimilaires(id, data.donnees.categorie?._id);
                } else {
                    setError('Produit non trouvé.');
                }
            } catch (err) {
                console.error('Erreur lors du chargement du produit:', err);
                setError(
                    err.response?.data?.message ||
                        'Erreur lors du chargement du produit'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProduit();
    }, [id]);

    // Charger les avis
    const fetchAvis = async produitId => {
        try {
            const response = await produitsService.getAvis(produitId);
            if (response?.donnees) {
                setAvis(response.donnees);
            }
        } catch (err) {
            console.error('Erreur chargement avis:', err);
        }
    };

    // Charger les produits similaires
    const fetchProduitsSimilaires = async (produitId, categorieId) => {
        try {
            const response = await produitsService.getProduitsSimilaires(
                produitId,
                categorieId
            );
            if (response?.donnees) {
                setProduitsSimilaires(response.donnees);
            }
        } catch (err) {
            console.error('Erreur chargement produits similaires:', err);
        }
    };

    // Gestion du scroll pour sticky button
    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 600);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Ajout au panier avec animation
    const handleAddToCart = () => {
        if (!produit) return;

        if (produit.stock < selectedQuantity) {
            alert(
                `Stock insuffisant. Il ne reste que ${produit.stock} unité(s) disponible(s).`
            );
            return;
        }

        ajouterAuPanier(
            {
                ...produit,
                id: produit._id || produit.id,
            },
            selectedQuantity,
            selectedOptions
        );

        // Animation de succès
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    // Toggle favoris
    const handleToggleFavorite = async () => {
        if (!utilisateur) {
            alert('Connectez-vous pour ajouter aux favoris');
            navigate('/connexion');
            return;
        }

        try {
            if (isFavorite) {
                await produitsService.retirerDesFavoris(id);
                setIsFavorite(false);
            } else {
                await produitsService.ajouterAuxFavoris(id);
                setIsFavorite(true);
            }
        } catch (err) {
            console.error('Erreur favoris:', err);
        }
    };

    // Calcul de la note moyenne
    const noteMoyenne =
        avis.length > 0
            ? (avis.reduce((acc, a) => acc + a.note, 0) / avis.length).toFixed(
                    1
                )
            : 0;

    // Affichage pendant le chargement
    if (loading) {
        return (
            <div className="container mt-5 py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2">Chargement du produit...</p>
            </div>
        );
    }

    // Gestion des erreurs
    if (error || !produit || produit.estActif === false) {
        return (
            <div className="container mt-5 py-5">
                <div className="alert alert-danger text-center">
                    <h5>Produit introuvable</h5>
                    <p>{error || "Ce produit n'est pas disponible"}</p>
                    <button
                        onClick={() => navigate('/boutique')}
                        className="btn btn-primary"
                    >
                        Retour à la boutique
                    </button>
                </div>
            </div>
        );
    }

    const images = [
        ...(produit.images || []),
        ...(produit.image ? [produit.image] : []),
    ].filter(Boolean);

    return (
        <div className="page-detail-produit">
            {/* Toast de succès */}
            {showSuccessToast && (
                <div className="toast-success-custom">
                    <i className="fas fa-check-circle"></i>
                    <span>Produit ajouté au panier !</span>
                </div>
            )}

            <div className="container my-5">
                {/* Breadcrumb amélioré */}
                <nav aria-label="breadcrumb" className="breadcrumb-custom mb-4">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <a
                                href="/"
                                onClick={e => {
                                    e.preventDefault();
                                    navigate('/');
                                }}
                            >
                                <i className="fas fa-home"></i> Accueil
                            </a>
                        </li>
                        <li className="breadcrumb-item">
                            <a
                                href="/boutique"
                                onClick={e => {
                                    e.preventDefault();
                                    navigate('/boutique');
                                }}
                            >
                                Boutique
                            </a>
                        </li>
                        <li className="breadcrumb-item">
                            <a
                                href={`/categories/${produit.categorie?.slug || produit.categorie}`}
                                onClick={e => {
                                    e.preventDefault();
                                    navigate(
                                        `/categories/${produit.categorie?.slug || produit.categorie}`
                                    );
                                }}
                            >
                                {produit.categorie?.nom || produit.categorie}
                            </a>
                        </li>
                        <li
                            className="breadcrumb-item active"
                            aria-current="page"
                        >
                            {produit.nom}
                        </li>
                    </ol>
                </nav>

                <div className="row">
                    {/* Section Galerie d'images avec zoom */}
                    <div className="col-lg-6 col-md-12 mb-4">
                        <GalerieImagesZoom
                            images={images}
                            activeImage={activeImage}
                            setActiveImage={setActiveImage}
                            nomProduit={produit.nom}
                        />
                    </div>

                    {/* Section Détails du produit */}
                    <div className="col-lg-6 col-md-12">
                        <div className="product-details-header">
                            {/* Badges */}
                            <div className="product-badges mb-3">
                                {produit.estNouveau && (
                                    <span className="badge badge-nouveau">
                                        <i className="fas fa-star"></i> Nouveau
                                    </span>
                                )}
                                {produit.estEnVedette && (
                                    <span className="badge badge-vedette">
                                        <i className="fas fa-fire"></i>{' '}
                                        Populaire
                                    </span>
                                )}
                                {produit.prixPromo && (
                                    <span className="badge badge-promo">
                                        <i className="fas fa-tag"></i> Promo
                                    </span>
                                )}
                            </div>

                            {/* Titre */}
                            <h1 className="product-title mb-3">
                                {produit.nom}
                            </h1>

                            {/* Note et avis */}
                            <div className="product-rating mb-3">
                                <div className="stars">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <i
                                            key={star}
                                            className={`fas fa-star ${star <= Math.round(noteMoyenne) ? 'filled' : ''}`}
                                        ></i>
                                    ))}
                                </div>
                                <span className="rating-text">
                                    {noteMoyenne} ({avis.length} avis)
                                </span>
                            </div>

                            {/* Prix */}
                            <div className="product-price mb-4">
                                {produit.prixPromo ? (
                                    <>
                                        <span className="price-promo">
                                            {parseFloat(
                                                produit.prixPromo
                                            ).toLocaleString()}{' '}
                                            XOF
                                        </span>
                                        <span className="price-original">
                                            {parseFloat(
                                                produit.prix
                                            ).toLocaleString()}{' '}
                                            XOF
                                        </span>
                                        <span className="price-reduction">
                                            -
                                            {Math.round(
                                                ((produit.prix -
                                                    produit.prixPromo) /
                                                    produit.prix) *
                                                    100
                                            )}
                                            %
                                        </span>
                                    </>
                                ) : (
                                    <span className="price-current">
                                        {parseFloat(
                                            produit.prix
                                        ).toLocaleString()}{' '}
                                        XOF
                                    </span>
                                )}
                            </div>

                            {/* Stock */}
                            <div className="product-stock mb-4">
                                {produit.stock > 0 ? (
                                    <div className="stock-available">
                                        <i className="fas fa-check-circle"></i>
                                        <span className="stock-text">
                                            En stock ({produit.stock} disponible
                                            {produit.stock > 1 ? 's' : ''})
                                        </span>
                                    </div>
                                ) : (
                                    <div className="stock-unavailable">
                                        <i className="fas fa-times-circle"></i>
                                        <span className="stock-text">
                                            Rupture de stock
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Description courte */}
                            <div className="product-description-short mb-4">
                                <p className="text-muted">
                                    {produit.description?.substring(0, 150) ||
                                        'Aucune description disponible.'}
                                    {produit.description?.length > 150 && '...'}
                                </p>
                            </div>

                            {/* Sélecteur de variantes */}
                            {produit.variations &&
                                produit.variations.length > 0 && (
                                    <SelecteurVariantes
                                        variations={produit.variations}
                                        selectedOptions={selectedOptions}
                                        setSelectedOptions={setSelectedOptions}
                                    />
                                )}

                            {/* Sélecteur de quantité */}
                            <div className="quantity-selector mb-4">
                                <label className="form-label fw-bold">
                                    Quantité :
                                </label>
                                <div className="quantity-controls">
                                    <button
                                        className="btn-quantity btn-minus"
                                        onClick={() =>
                                            setSelectedQuantity(prev =>
                                                Math.max(1, prev - 1)
                                            )
                                        }
                                        disabled={selectedQuantity <= 1}
                                    >
                                        <i className="fas fa-minus"></i>
                                    </button>
                                    <input
                                        type="number"
                                        className="quantity-input"
                                        value={selectedQuantity}
                                        onChange={e => {
                                            const value = parseInt(
                                                e.target.value
                                            );
                                            if (
                                                !isNaN(value) &&
                                                value > 0 &&
                                                value <= (produit.stock || 99)
                                            ) {
                                                setSelectedQuantity(value);
                                            }
                                        }}
                                        min="1"
                                        max={produit.stock || 99}
                                    />
                                    <button
                                        className="btn-quantity btn-plus"
                                        onClick={() =>
                                            setSelectedQuantity(prev =>
                                                Math.min(
                                                    produit.stock || 99,
                                                    prev + 1
                                                )
                                            )
                                        }
                                        disabled={
                                            selectedQuantity >=
                                            (produit.stock || 99)
                                        }
                                    >
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Boutons d'action */}
                            <div className="product-actions mb-4">
                                <button
                                    className="btn-add-cart btn-primary"
                                    onClick={handleAddToCart}
                                    disabled={produit.stock === 0}
                                >
                                    <i className="fas fa-shopping-cart me-2"></i>
                                    {produit.stock === 0
                                        ? 'Rupture de stock'
                                        : 'Ajouter au panier'}
                                </button>

                                <BoutonsFavorisPartage
                                    isFavorite={isFavorite}
                                    onToggleFavorite={handleToggleFavorite}
                                    produit={produit}
                                />
                            </div>

                            {/* Informations complémentaires */}
                            <div className="product-meta">
                                <div className="meta-item">
                                    <span className="meta-label">
                                        <i className="fas fa-tag"></i> Catégorie
                                        :
                                    </span>
                                    <span className="meta-value">
                                        {produit.categorie?.nom ||
                                            produit.categorie ||
                                            'Non spécifié'}
                                    </span>
                                </div>
                                {produit.marque && (
                                    <div className="meta-item">
                                        <span className="meta-label">
                                            <i className="fas fa-trademark"></i>{' '}
                                            Marque :
                                        </span>
                                        <span className="meta-value">
                                            {produit.marque}
                                        </span>
                                    </div>
                                )}
                                {produit.reference && (
                                    <div className="meta-item">
                                        <span className="meta-label">
                                            <i className="fas fa-barcode"></i>{' '}
                                            Référence :
                                        </span>
                                        <span className="meta-value">
                                            {produit.reference}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Garanties et sécurité */}
                            <div className="product-guarantees mt-4">
                                <div className="guarantee-item">
                                    <i className="fas fa-shield-alt"></i>
                                    <span>Paiement sécurisé</span>
                                </div>
                                <div className="guarantee-item">
                                    <i className="fas fa-truck"></i>
                                    <span>Livraison rapide</span>
                                </div>
                                <div className="guarantee-item">
                                    <i className="fas fa-undo"></i>
                                    <span>Retour sous 14 jours</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Onglets d'informations */}
                <OngletsInfosProduit produit={produit} />

                {/* Section Avis clients */}
                <SectionAvisClients
                    avis={avis}
                    produitId={id}
                    noteMoyenne={noteMoyenne}
                    onAvisAjoute={() => fetchAvis(id)}
                />

                {/* Produits similaires */}
                {produitsSimilaires.length > 0 && (
                    <ProduitsSimilaires produits={produitsSimilaires} />
                )}
            </div>

            {/* Sticky button mobile */}
            {isSticky && (
                <StickyCartButton
                    produit={produit}
                    selectedQuantity={selectedQuantity}
                    onAddToCart={handleAddToCart}
                />
            )}
        </div>
    );
}