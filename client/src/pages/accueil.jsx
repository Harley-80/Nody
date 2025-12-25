import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/layout/Layout';
import CarrouselAccueil from '../components/ui/CarrouselAccueil';
import GrilleProduitsAccueil from '../components/ui/GrilleProduitsAccueil';
import { useProduits } from '../contexts/ProduitsContext';
import CarrouselHero from '../components/ui/CarrouselHero';
import { produitsService } from '../services/produitsService'; 
import './Accueil.scss'; 

export default function Accueil() {
    const { produits, loading, error, getNouveauxProduits } = useProduits();
    const [produitsEnVedette, setProduitsEnVedette] = useState([]);
    const [nouveauxProduits, setNouveauxProduits] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        chargerProduits();
    }, []);

    const chargerProduits = async () => {
        try {
            // Charger les produits en vedette depuis le backend
            const [produitsVedette, produitsNouveaux] = await Promise.all([
                produitsService.getFeaturedProduits(),
                getNouveauxProduits(),
            ]);

            setProduitsEnVedette(
                produitsVedette.data || produitsVedette.donnees || []
            );
            setNouveauxProduits(
                produitsNouveaux.data ||
                    produitsNouveaux.donnees ||
                    produitsNouveaux ||
                    []
            );
        } catch (err) {
            console.error('Erreur chargement produits:', err);
        }
    };

    const handleNavigation = path => {
        navigate(path);
    };

    if (loading) {
        return (
            <Layout>
                <div className="accueil-loading">
                    <div className="spinner"></div>
                    <p>Chargement des produits...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="error-container">
                    <p>Erreur lors du chargement des produits</p>
                    <button onClick={chargerProduits}>Réessayer</button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <CarrouselHero onShopNow={() => handleNavigation('/boutique')} />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <h1>Bienvenue sur Nody 👋</h1>
                    <p className="subtitle">
                        Votre destination premium pour la mode 
                    </p>
                    <div className="hero-actions">
                        <button
                            className="btn-primary"
                            onClick={() => handleNavigation('/boutique')}
                        >
                            Découvrir la collection
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => handleNavigation('/nouveautes')}
                        >
                            Nouveautés
                        </button>
                    </div>
                </div>
            </section>

            {/* Produits phares */}
            <section className="featured-products">
                <div className="container">
                    <h2>Nos produits phares</h2>
                    {produitsEnVedette.length > 0 ? (
                        <CarrouselAccueil produits={produitsEnVedette} />
                    ) : (
                        <div className="no-products">
                            <p>Aucun produit en vedette pour le moment</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Nouveautés */}
            <section className="new-products">
                <div className="container">
                    <h2>Découvrez nos collections</h2>
                    {nouveauxProduits.length > 0 ? (
                        <GrilleProduitsAccueil produits={nouveauxProduits} />
                    ) : (
                        <div className="no-products">
                            <p>Aucun produit disponible</p>
                            <button
                                className="btn-primary"
                                onClick={() => handleNavigation('/boutique')}
                            >
                                Voir tous les produits
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <h2>Prêt à révolutionner votre garde-robe ?</h2>
                    <p>Inscrivez-vous</p>
                    <button
                        className="btn-cta"
                        onClick={() => handleNavigation('/inscription')}
                    >
                        Créer un compte
                    </button>
                </div>
            </section>
        </Layout>
    );
}