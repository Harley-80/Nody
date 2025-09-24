import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { produitsMock } from '../data/produits.data';
import { useCart } from '../contexts/CartContext';

export default function PageDetailProduit() {
    // États de base
    const { id } = useParams();
    const [produit, setProduit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedQuantity, setSelectedQuantity] = useState(1);

    // États pour la galerie d'images et les options
    const [activeImage, setActiveImage] = useState(''); // Image principale active
    const [selectedOptions, setSelectedOptions] = useState({}); // Options sélectionnées (taille, couleur, etc.)

    const { ajouterAuPanier } = useCart();

    // Effet pour charger le produit
    useEffect(() => {
        setLoading(true);
        setError(null);
        
        // Simulation d'un appel API
        setTimeout(() => {
            const foundProduit = produitsMock.find(p => p.id === parseInt(id));
            
            if (foundProduit) {
                setProduit(foundProduit);
                // Définit la première image comme image active par défaut
                setActiveImage(foundProduit.images?.[0] || foundProduit.image);
            } else {
                setError('Produit non trouvé.');
            }
            
            setLoading(false);
        }, 500);
    }, [id]);

    // Gestion du changement de quantité
    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setSelectedQuantity(value);
        }
    };

    // Ajout au panier avec les options sélectionnées
    const handleAddToCart = () => {
        ajouterAuPanier(produit, selectedQuantity, selectedOptions);
        alert(`${selectedQuantity} x ${produit.nom} ajouté(s) au panier !`);
    };

    // Affichage pendant le chargement
    if (loading) {
        return <div className="container mt-5 text-center">Chargement du produit...</div>;
    }

    // Gestion des erreurs
    if (error) {
        return <div className="container mt-5 alert alert-danger text-center">{error}</div>;
    }

    // Produit non trouvé
    if (!produit) {
        return <div className="container mt-5 text-center">Produit introuvable.</div>;
    }

    return (
        <div className="container my-5">
            <div className="row">
                {/* Section Galerie d'images */}
                <div className="col-md-6">
                    {/* Image principale */}
                    <img
                        src={activeImage}
                        alt={produit.nom}
                        className="img-fluid rounded shadow-sm"
                    />
                    
                    {/* Miniatures de la galerie (si plusieurs images) */}
                    {produit.images && produit.images.length > 1 && (
                        <div className="d-flex mt-3">
                            {produit.images.map((imgSrc, index) => (
                                <img
                                    key={index}
                                    src={imgSrc}
                                    onClick={() => setActiveImage(imgSrc)} // Change l'image active au clic
                                    alt={`Vue ${index + 1}`}
                                    className={`img-thumbnail me-2 ${imgSrc === activeImage ? 'border border-primary' : ''}`}
                                    style={{ 
                                        width: '80px', 
                                        height: '80px', 
                                        objectFit: 'cover', 
                                        cursor: 'pointer' 
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Section Détails du produit */}
                <div className="col-md-6">
                    <h1 className="mb-3">{produit.nom}</h1>
                    <p className="lead text-primary fw-bold mb-4" style={{ fontSize: '2rem' }}>
                        {produit.prix.toLocaleString()} XOF
                    </p>
                    <p className="text-muted mb-4">{produit.description}</p>

                    {/* Sélecteurs d'options dynamiques */}
                    {produit.variations && produit.variations.map((variation, index) => (
                        <div className="mb-3" key={index}>
                            <label htmlFor={`select-${variation.type}`} className="form-label fw-bold">
                                Sélectionnez {variation.type} :
                            </label>
                            <select 
                                className="form-select" 
                                id={`select-${variation.type}`}
                                onChange={(e) =>
                                    setSelectedOptions((prev) => ({
                                        ...prev,
                                        [variation.type]: e.target.value,
                                    }))
                                }
                            >
                                {variation.options.map((option, idx) => (
                                    <option key={idx} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    ))}

                    {/* Sélecteur de quantité */}
                    <div className="mb-4">
                        <label htmlFor="quantity" className="form-label fw-bold">Quantité :</label>
                        <input
                            type="number"
                            id="quantity"
                            className="form-control"
                            value={selectedQuantity}
                            onChange={handleQuantityChange}
                            min="1"
                            style={{ width: '80px' }}
                        />
                    </div>

                    {/* Bouton d'ajout au panier */}
                    <button className="btn btn-dark btn-lg w-100" onClick={handleAddToCart}>
                        <i className="fas fa-cart-plus me-2"></i> Ajouter au panier
                    </button>

                    {/* Informations supplémentaires */}
                    <hr className="my-4" />
                    <p><strong>Catégorie :</strong> {produit.category || 'Non spécifié'}</p>
                    <p><strong>En stock :</strong> {produit.stock > 0 ? `${produit.stock} unités` : 'Bientôt disponible'}</p>
                </div>
            </div>
        </div>
    );
}