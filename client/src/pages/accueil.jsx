import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/common/layout/Layout'
import CarrouselAccueil from '../components/ui/CarrouselAccueil'
import GrilleProduitsAccueil from '../components/ui/GrilleProduitsAccueil'
import { useProduits } from '../contexts/ProduitsContext'
import CarrouselHero from '../components/ui/CarrouselHero'

export default function Accueil() {
    const { produits, chargerProduits, loading, error } = useProduits()
    const navigate = useNavigate()

    useEffect(() => {
        chargerProduits()
    }, [chargerProduits])

    const handleNavigation = path => {
        navigate(path)
    }

    if (loading) {
        return (
            <Layout>
                <div className="container py-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            </Layout>
        )
    }

    if (error) {
        return (
            <Layout>
                <div className="container py-5">
                    <div className="alert alert-danger text-center">
                        Erreur lors du chargement des produits : {error.message}
                        <button
                            className="btn btn-outline-danger mt-2"
                            onClick={() => window.location.reload()}
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <CarrouselHero onShopNow={() => handleNavigation('/boutique')} />

            {/* Hero Section */}
            <section className="hero-section bg-light py-5">
                <div className="container text-center">
                    <h1 className="display-4 fw-bold mb-3">
                        Bienvenue sur Nody
                    </h1>
                    <p className="lead text-muted mb-4">
                        Votre destination premium pour la mode moderne et
                        africaine, disponible 24/7
                    </p>
                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => handleNavigation('/boutique')}
                        >
                            Découvrir la collection
                        </button>
                        <button
                            className="btn btn-outline-secondary btn-lg"
                            onClick={() => handleNavigation('/nouveautes')}
                        >
                            Nouveautés
                        </button>
                    </div>
                </div>
            </section>

            {/* Carrousel des produits phares */}
            <section className="py-5 bg-white">
                <div className="container">
                    <h2 className="text-center mb-5">Nos produits phares</h2>
                    <CarrouselAccueil
                        produits={produits.slice(0, 8)}
                        onProductClick={id =>
                            handleNavigation(`/produit/${id}`)
                        }
                    />
                </div>
            </section>

            {/* Grille des produits */}
            <section className="py-5 bg-light">
                <div className="container">
                    <h2 className="text-center mb-5">
                        Découvrez nos collections
                    </h2>
                    <GrilleProduitsAccueil
                        produits={produits}
                        onProductClick={id =>
                            handleNavigation(`/produit/${id}`)
                        }
                    />
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-5 bg-dark text-white">
                <div className="container text-center">
                    <h2 className="mb-4">
                        Prêt à révolutionner votre garde-robe ?
                    </h2>
                    <p className="lead mb-4">
                        Inscrivez-vous pour recevoir 10% de réduction sur votre
                        première commande
                    </p>
                    <button
                        className="btn btn-light btn-lg px-4"
                        onClick={() => handleNavigation('/inscription')}
                    >
                        Créer un compte
                    </button>
                </div>
            </section>
        </Layout>
    )
}
