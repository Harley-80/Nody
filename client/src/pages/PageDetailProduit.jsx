import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import produitsService from '../services/produitsService';

export default function PageDetailProduit() {
    const { id } = useParams();
    const navigate = useNavigate();

    // États de base
    const [produit, setProduit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedQuantity, setSelectedQuantity] = useState(1);

    // États pour la galerie d'images et les options
    const [activeImage, setActiveImage] = useState('');
    const [selectedOptions, setSelectedOptions] = useState({});

    const { ajouterAuPanier } = useCart();

    // Effet pour charger le produit depuis l'API
    useEffect(() => {
        const fetchProduit = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await produitsService.getProduitById(id);

                if (data && data.donnees) {
                    setProduit(data.donnees);
                    // Définit la première image comme image active par défaut
                    if (data.donnees.images && data.donnees.images.length > 0) {
                        setActiveImage(data.donnees.images[0]);
                    } else if (data.donnees.image) {
                        setActiveImage(data.donnees.image);
                    }
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

    // Gestion du changement de quantité
    const handleQuantityChange = e => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0 && value <= (produit?.stock || 99)) {
            setSelectedQuantity(value);
        }
    };

    // Ajout au panier avec les options sélectionnées
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

        alert(`${selectedQuantity} x ${produit.nom} ajouté(s) au panier !`);
    };

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
    if (error) {
        return (
            <div className="container mt-5 py-5">
                <div className="alert alert-danger text-center">
                    <h5>Produit introuvable</h5>
                    <p>{error}</p>
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

    // Produit non trouvé
    if (!produit) {
        return (
            <div className="container mt-5 py-5 text-center">
                <div className="alert alert-warning">
                    <h5>Produit introuvable</h5>
                    <p>Le produit demandé n'existe pas ou a été supprimé.</p>
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

    // Vérifier si le produit est actif
    if (produit.estActif === false) {
        return (
            <div className="container mt-5 py-5 text-center">
                <div className="alert alert-warning">
                    <h5>Produit indisponible</h5>
                    <p>
                        Ce produit n'est actuellement pas disponible à la vente.
                    </p>
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

    // Récupérer toutes les images disponibles
    const images = [
        ...(produit.images || []),
        ...(produit.image ? [produit.image] : []),
    ].filter(Boolean);

    return (
        <div className="container my-5">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <a
                            href="/"
                            onClick={e => {
                                e.preventDefault();
                                navigate('/');
                            }}
                        >
                            Accueil
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
                    <li className="breadcrumb-item active" aria-current="page">
                        {produit.nom}
                    </li>
                </ol>
            </nav>

            <div className="row">
                {/* Section Galerie d'images */}
                <div className="col-md-6">
                    {/* Image principale */}
                    {activeImage ? (
                        <img
                            src={activeImage}
                            alt={produit.nom}
                            className="img-fluid rounded shadow-sm mb-3"
                            style={{ maxHeight: '500px', objectFit: 'contain' }}
                        />
                    ) : (
                        <div
                            className="bg-light rounded d-flex align-items-center justify-content-center"
                            style={{ height: '400px' }}
                        >
                            <span className="text-muted">
                                Image non disponible
                            </span>
                        </div>
                    )}

                    {/* Miniatures de la galerie (si plusieurs images) */}
                    {images.length > 1 && (
                        <div className="d-flex flex-wrap gap-2 mt-3">
                            {images.map((imgSrc, index) => (
                                <img
                                    key={index}
                                    src={imgSrc}
                                    onClick={() => setActiveImage(imgSrc)}
                                    alt={`Vue ${index + 1} de ${produit.nom}`}
                                    className={`img-thumbnail ${imgSrc === activeImage ? 'border border-primary' : ''}`}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        objectFit: 'cover',
                                        cursor: 'pointer',
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Section Vidéo (si disponible) */}
                    {produit.video && (
                        <div className="mt-4">
                            <h5 className="mb-3">Vidéo du produit</h5>
                            <div className="ratio ratio-16x9">
                                <video
                                    src={produit.video}
                                    controls
                                    className="rounded"
                                ></video>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section Détails du produit */}
                <div className="col-md-6">
                    <h1 className="mb-3">{produit.nom}</h1>

                    {/* Prix */}
                    <div className="d-flex align-items-center mb-4">
                        <span
                            className="lead text-primary fw-bold me-3"
                            style={{ fontSize: '2rem' }}
                        >
                            {parseFloat(produit.prix).toLocaleString()} XOF
                        </span>
                        {produit.prixPromo && (
                            <span className="text-decoration-line-through text-muted me-2">
                                {parseFloat(produit.prixPromo).toLocaleString()}{' '}
                                XOF
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <h5 className="mb-2">Description</h5>
                        <p className="text-muted">
                            {produit.description ||
                                'Aucune description disponible.'}
                        </p>
                    </div>

                    {/* Sélecteurs d'options dynamiques */}
                    {produit.variations && produit.variations.length > 0
                        ? produit.variations.map((variation, index) => (
                              <div className="mb-3" key={index}>
                                  <label
                                      htmlFor={`select-${variation.type}`}
                                      className="form-label fw-bold"
                                  >
                                      Sélectionnez {variation.type} :
                                  </label>
                                  <select
                                      className="form-select"
                                      id={`select-${variation.type}`}
                                      onChange={e =>
                                          setSelectedOptions(prev => ({
                                              ...prev,
                                              [variation.type]: e.target.value,
                                          }))
                                      }
                                      defaultValue={variation.options[0]}
                                  >
                                      {variation.options.map((option, idx) => (
                                          <option key={idx} value={option}>
                                              {option}
                                          </option>
                                      ))}
                                  </select>
                              </div>
                          ))
                        : null}

                    {/* Sélecteur de quantité */}
                    <div className="mb-4">
                        <label
                            htmlFor="quantity"
                            className="form-label fw-bold"
                        >
                            Quantité :
                        </label>
                        <div className="d-flex align-items-center">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() =>
                                    setSelectedQuantity(prev =>
                                        Math.max(1, prev - 1)
                                    )
                                }
                                disabled={selectedQuantity <= 1}
                            >
                                -
                            </button>
                            <input
                                type="number"
                                id="quantity"
                                className="form-control mx-2 text-center"
                                value={selectedQuantity}
                                onChange={handleQuantityChange}
                                min="1"
                                max={produit.stock || 99}
                                style={{ width: '80px' }}
                            />
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() =>
                                    setSelectedQuantity(prev =>
                                        Math.min(produit.stock || 99, prev + 1)
                                    )
                                }
                                disabled={
                                    selectedQuantity >= (produit.stock || 99)
                                }
                            >
                                +
                            </button>
                        </div>
                        {produit.stock !== undefined && (
                            <small className="text-muted mt-1 d-block">
                                {produit.stock > 0
                                    ? `${produit.stock} unité(s) disponible(s)`
                                    : 'Rupture de stock'}
                            </small>
                        )}
                    </div>

                    {/* Bouton d'ajout au panier */}
                    <button
                        className="btn btn-dark btn-lg w-100 mb-4"
                        onClick={handleAddToCart}
                        disabled={produit.stock === 0}
                    >
                        <i className="fas fa-cart-plus me-2"></i>
                        {produit.stock === 0
                            ? 'Rupture de stock'
                            : 'Ajouter au panier'}
                    </button>

                    {/* Informations supplémentaires */}
                    <div className="border rounded p-3">
                        <h6 className="mb-3">Informations complémentaires</h6>
                        <div className="row">
                            <div className="col-6">
                                <p className="mb-2">
                                    <strong>Catégorie :</strong>
                                    <br />
                                    <span className="text-muted">
                                        {produit.categorie?.nom ||
                                            produit.categorie ||
                                            'Non spécifié'}
                                    </span>
                                </p>
                            </div>
                            <div className="col-6">
                                <p className="mb-2">
                                    <strong>Statut :</strong>
                                    <br />
                                    <span
                                        className={`badge ${produit.stock > 0 ? 'bg-success' : 'bg-danger'}`}
                                    >
                                        {produit.stock > 0
                                            ? 'En stock'
                                            : 'Rupture'}
                                    </span>
                                </p>
                            </div>
                            {produit.marque && (
                                <div className="col-6">
                                    <p className="mb-2">
                                        <strong>Marque :</strong>
                                        <br />
                                        <span className="text-muted">
                                            {produit.marque}
                                        </span>
                                    </p>
                                </div>
                            )}
                            {produit.reference && (
                                <div className="col-6">
                                    <p className="mb-2">
                                        <strong>Référence :</strong>
                                        <br />
                                        <span className="text-muted">
                                            {produit.reference}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
