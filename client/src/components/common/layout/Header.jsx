import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Importation des icônes nécessaires
import {
    faSearch,
    faUser,
    faShoppingCart,
    faSignInAlt,
    faSignOutAlt,
    faUserShield,
    faUserCircle,
    faUserPlus,
    faCheck,
    faBars,
    faList,
    faTimes,
    faGlobe,
    faMoneyBill,
    faHome,
    faShoppingBag,
    faStar,
} from '@fortawesome/free-solid-svg-icons';
import logoNody from '@/assets/logo/neos-brands-solid.svg';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDevise } from '@/contexts/DeviseContext';
import imageSearchIcon from '@/assets/icons/recherche.png';
import ImageSearch from './ImageSearch';
import CategoriesMegaMenu from './CategoriesMegaMenu';
import CategoriesSidebar from './CategoriesSidebar';
import './Header.scss';

/**
 * Composant Header : Barre de navigation principale de l'application
 * @returns {JSX.Element} - Élément JSX représentant le header
 */
export default function Header() {
    // Initialisation des hooks
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { panier } = useCart();
    const { devise, setDevise } = useDevise();
    const { user, logout } = useAuth();

    // Calcul du nombre total d'articles dans le panier
    const cartCount = panier.reduce((total, p) => total + p.quantite, 0);

    // États locaux pour la gestion de l'interface
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [imageSearchOpen, setImageSearchOpen] = useState(false);
    const [configDropdownOpen, setConfigDropdownOpen] = useState(false);

    // États pour les catégories
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Références pour les éléments DOM
    const searchInputRef = useRef(null);
    const configDropdownRef = useRef(null);
    const megaMenuRef = useRef(null);

    /**
     * Effet pour définir la devise et la langue par défaut
     */
    useEffect(() => {
        if (!devise) {
            setDevise('XOF');
        }
        if (!localStorage.getItem('i18nextLng')) {
            i18n.changeLanguage('fr');
        }
    }, [devise, setDevise, i18n]);

    /**
     * Effet pour gérer le défilement de la page
     */
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    /**
     * Effet pour fermer les dropdowns en cliquant à l'extérieur
     */
    useEffect(() => {
        const handleClickOutside = event => {
            // Fermer le dropdown de configuration
            if (
                configDropdownRef.current &&
                !configDropdownRef.current.contains(event.target)
            ) {
                setConfigDropdownOpen(false);
            }

            // Fermer le mega menu
            if (
                megaMenuRef.current &&
                !megaMenuRef.current.contains(event.target) &&
                !event.target.closest('.categories-dropdown')
            ) {
                setMegaMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /**
     * Effet pour gérer le collage d'image avec Ctrl+V
     */
    useEffect(() => {
        const handlePaste = e => {
            if (
                searchInputRef.current &&
                document.activeElement === searchInputRef.current
            ) {
                const items = e.clipboardData?.items;
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            const blob = items[i].getAsFile();
                            handleImageSearch(blob);
                            break;
                        }
                    }
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    /**
     * Gère la soumission du formulaire de recherche
     * @param {Event} e - Événement de soumission du formulaire
     */
    const handleSearchSubmit = e => {
        e.preventDefault();
        if (searchQuery.trim().length >= 2) {
            navigate(
                `/produits?search=${encodeURIComponent(searchQuery.trim())}`
            );
            setSearchQuery('');
            closeMobile();
        }
    };

    /**
     * Gère la recherche par image
     * @param {File} imageFile - Fichier image à rechercher
     */
    const handleImageSearch = async imageFile => {
        try {
            // Créer FormData pour l'upload
            const formData = new FormData();
            formData.append('image', imageFile);

            // Afficher un message de chargement
            console.log("Envoi de l'image pour recherche:", imageFile);

            // Envoyer l'image au backend pour analyse
            const response = await fetch(
                'http://localhost:5000/api/produits/recherche-image',
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Erreur lors de la recherche par image');
            }

            const data = await response.json();

            // Naviguer vers la page produits avec les résultats
            if (data.produits && data.produits.length > 0) {
                // Stocker les résultats dans localStorage
                localStorage.setItem(
                    'imageSearchResults',
                    JSON.stringify(data.produits)
                );
                navigate(`/produits?imageSearch=true&timestamp=${Date.now()}`);
            } else {
                alert('Aucun produit similaire trouvé');
            }

            setImageSearchOpen(false);
            closeMobile();
        } catch (error) {
            console.error('Erreur recherche image:', error);
            alert('Erreur lors de la recherche par image. Veuillez réessayer.');
        }
    };

    /**
     * Gère le changement de devise
     * @param {String} newDevise - Nouvelle devise sélectionnée
     */
    const handleDeviseChange = newDevise => {
        setDevise(newDevise);
        setConfigDropdownOpen(false);
        closeMobile();
    };

    /**
     * Gère le changement de langue
     * @param {String} lang - Nouvelle langue sélectionnée
     */
    const handleLangChange = lang => {
        i18n.changeLanguage(lang);
        setConfigDropdownOpen(false);
        closeMobile();
    };

    /**
     * Gère la déconnexion de l'utilisateur
     */
    const handleLogout = () => {
        logout();
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        closeMobile();
        navigate('/');
    };

    /**
     * Ferme le menu mobile
     */
    const closeMobile = () => {
        setMobileMenuOpen(false);
        setConfigDropdownOpen(false);
        setMegaMenuOpen(false);
    };

    /**
     * Ouvre/Ferme le dropdown de configuration
     */
    const toggleConfigDropdown = () => {
        setConfigDropdownOpen(!configDropdownOpen);
    };

    /**
     * Gère l'ouverture/fermeture du mega menu
     */
    const handleMegaMenuToggle = () => {
        setMegaMenuOpen(!megaMenuOpen);
    };

    /**
     * Gère l'ouverture du mega menu au survol
     */
    const handleMegaMenuEnter = () => {
        setMegaMenuOpen(true);
    };

    /**
     * Gère la fermeture du mega menu
     */
    const handleMegaMenuClose = () => {
        setMegaMenuOpen(false);
    };

    /**
     * Ouvre le sidebar des catégories
     */
    const handleOpenSidebar = (categorySlug = null) => {
        setSelectedCategory(categorySlug);
        setSidebarOpen(true);
        setMegaMenuOpen(false);
        setMobileMenuOpen(false);
    };

    /**
     * Ferme le sidebar des catégories
     */
    const handleCloseSidebar = () => {
        setSidebarOpen(false);
        setSelectedCategory(null);
    };

    /**
     * Retourne le nom complet d'une devise
     * @param {String} currency - Code de la devise
     * @returns {String} - Nom complet de la devise
     */
    const getCurrencyName = currency => {
        const currencyNames = {
            XOF: 'Franc CFA (XOF)',
            XAF: 'Franc CFA (XAF)',
            EUR: 'Euro (EUR)',
            USD: 'Dollar US (USD)',
        };
        return currencyNames[currency] || currency;
    };

    /**
     * Retourne le nom complet d'une langue
     * @param {String} lang - Code de la langue
     * @returns {String} - Nom complet de la langue
     */
    const getLanguageName = lang => {
        const languageNames = {
            fr: 'Français',
            en: 'English',
        };
        return languageNames[lang] || lang;
    };

    // Obtenir la langue et devise actuelles pour l'affichage
    const getCurrentLanguage = () => {
        const lang = i18n.language;
        if (lang === 'fr') return 'FR';
        if (lang === 'en') return 'EN';
        return lang.toUpperCase();
    };

    const getCurrentCurrency = () => {
        if (devise === 'XOF' || devise === 'XAF') return 'CFA';
        if (devise === 'EUR') return '€';
        if (devise === 'USD') return '$';
        return devise;
    };

    // Rendu du composant
    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
            {/* Navigation principale - PREMIÈRE LIGNE */}
            <nav className="main-nav">
                <div className="container">
                    <div className="nav-content">
                        {/* Logo - EXTRÊME GAUCHE */}
                        <div className="nav-brand">
                            <button
                                className="mobile-toggle"
                                onClick={() =>
                                    setMobileMenuOpen(!mobileMenuOpen)
                                }
                                aria-label="Toggle navigation"
                            >
                                <FontAwesomeIcon
                                    icon={mobileMenuOpen ? faTimes : faBars}
                                />
                            </button>
                            <Link to="/" className="logo" onClick={closeMobile}>
                                <img
                                    src={logoNody}
                                    alt="Nody Logo"
                                    width="35"
                                    height="35"
                                />
                                <span>Nody</span>
                            </Link>
                        </div>

                        {/* Barre de recherche - CENTRE */}
                        <div className="search-container">
                            <form
                                className="search-form"
                                onSubmit={handleSearchSubmit}
                            >
                                <input
                                    type="text"
                                    placeholder={t('header.search_placeholder')}
                                    value={searchQuery}
                                    onChange={e =>
                                        setSearchQuery(e.target.value)
                                    }
                                    ref={searchInputRef}
                                    onFocus={e => {
                                        e.target.style.background =
                                            'rgba(255, 255, 255, 0.15)';
                                        e.target.style.border =
                                            '2px solid #3498db';
                                    }}
                                    onBlur={e => {
                                        e.target.style.background =
                                            'rgba(255, 255, 255, 0.08)';
                                        e.target.style.border =
                                            '2px solid transparent';
                                    }}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '2px solid transparent',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                                <button type="submit" aria-label="Rechercher">
                                    <FontAwesomeIcon icon={faSearch} />
                                </button>
                                <button
                                    type="button"
                                    className="image-search-toggle"
                                    onClick={() =>
                                        setImageSearchOpen(!imageSearchOpen)
                                    }
                                    aria-label="Recherche par image"
                                >
                                    <img
                                        src={imageSearchIcon}
                                        alt="Recherche par image"
                                        className="image-search-icon"
                                    />
                                </button>
                            </form>
                            {/* Panneau de recherche par image */}
                            {imageSearchOpen && (
                                <ImageSearch
                                    onClose={() => setImageSearchOpen(false)}
                                    onSearch={handleImageSearch}
                                />
                            )}
                        </div>

                        {/* Actions de droite - EXTRÊME DROITE */}
                        <div className="header-actions">
                            {/* Sélecteur de configuration (devise et langue) */}
                            <div
                                className="desktop-config"
                                ref={configDropdownRef}
                            >
                                <div className="config-dropdown">
                                    <button
                                        className="config-toggle"
                                        onClick={toggleConfigDropdown}
                                        aria-label="Paramètres de langue et devise"
                                    >
                                        <FontAwesomeIcon
                                            icon={faGlobe}
                                            className="config-icon"
                                        />
                                        <span className="config-text">
                                            {getCurrentLanguage()} /{' '}
                                            {getCurrentCurrency()}
                                        </span>
                                    </button>
                                    {configDropdownOpen && (
                                        <div className="config-dropdown-menu">
                                            {/* Section pour la langue */}
                                            <div className="config-section">
                                                <h4 className="config-section-title">
                                                    <FontAwesomeIcon
                                                        icon={faGlobe}
                                                    />
                                                    {t('header.language') ||
                                                        'Langue'}
                                                </h4>
                                                <div className="config-options">
                                                    {[
                                                        {
                                                            code: 'fr',
                                                            name: 'Français',
                                                            flag: '🇫🇷',
                                                        },
                                                        {
                                                            code: 'en',
                                                            name: 'English',
                                                            flag: '🇺🇸',
                                                        },
                                                    ].map(lang => (
                                                        <button
                                                            key={lang.code}
                                                            className={`config-option ${i18n.language === lang.code ? 'active' : ''}`}
                                                            onClick={() =>
                                                                handleLangChange(
                                                                    lang.code
                                                                )
                                                            }
                                                        >
                                                            <span className="flag">
                                                                {lang.flag}
                                                            </span>
                                                            <span className="option-text">
                                                                {lang.name}
                                                            </span>
                                                            {i18n.language ===
                                                                lang.code && (
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faCheck
                                                                    }
                                                                    className="check-icon"
                                                                />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Séparateur */}
                                            <div className="config-divider"></div>
                                            {/* Section pour la devise */}
                                            <div className="config-section">
                                                <h4 className="config-section-title">
                                                    <FontAwesomeIcon
                                                        icon={faMoneyBill}
                                                    />
                                                    {t('header.currency') ||
                                                        'Devise'}
                                                </h4>
                                                <div className="config-options">
                                                    {[
                                                        'XOF',
                                                        'XAF',
                                                        'EUR',
                                                        'USD',
                                                    ].map(currency => (
                                                        <button
                                                            key={currency}
                                                            className={`config-option ${devise === currency ? 'active' : ''}`}
                                                            onClick={() =>
                                                                handleDeviseChange(
                                                                    currency
                                                                )
                                                            }
                                                        >
                                                            <span className="currency-symbol">
                                                                {currency ===
                                                                    'XOF' ||
                                                                currency ===
                                                                    'XAF'
                                                                    ? 'CFA'
                                                                    : currency ===
                                                                        'EUR'
                                                                      ? '€'
                                                                      : currency ===
                                                                          'USD'
                                                                        ? '$'
                                                                        : currency}
                                                            </span>
                                                            <span className="option-text">
                                                                {getCurrencyName(
                                                                    currency
                                                                )}
                                                            </span>
                                                            {devise ===
                                                                currency && (
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faCheck
                                                                    }
                                                                    className="check-icon"
                                                                />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Lien Connexion/Profil OU Inscription */}
                            <div className="user-actions-desktop">
                                {user?.isAdmin ? (
                                    <>
                                        <Link
                                            to="/admin"
                                            className="header-action-link"
                                            onClick={closeMobile}
                                        >
                                            <FontAwesomeIcon
                                                icon={faUserShield}
                                            />
                                            {t('header.admin') || 'Admin'}
                                        </Link>
                                        <button
                                            className="header-action-link"
                                            onClick={handleLogout}
                                        >
                                            <FontAwesomeIcon
                                                icon={faSignOutAlt}
                                            />
                                            {t('header.logout') ||
                                                'Déconnexion'}
                                        </button>
                                    </>
                                ) : user ? (
                                    <Link
                                        to="/profil"
                                        className="header-action-link user-profile-link"
                                        onClick={closeMobile}
                                    >
                                        <FontAwesomeIcon icon={faUserCircle} />
                                        <span className="user-name">
                                            {user.nomComplet ||
                                                user.prenom ||
                                                user.nom ||
                                                t('header.my_account') ||
                                                'Mon compte'}
                                        </span>
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            to="/connexion"
                                            className="header-action-link"
                                            onClick={closeMobile}
                                        >
                                            <FontAwesomeIcon
                                                icon={faSignInAlt}
                                            />
                                            Connexion
                                        </Link>
                                        <Link
                                            to="/inscription"
                                            className="header-action-link"
                                            onClick={closeMobile}
                                        >
                                            <FontAwesomeIcon
                                                icon={faUserPlus}
                                            />
                                            Inscription
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Lien Panier */}
                            <Link
                                to="/panier"
                                className="header-action-link cart-link"
                                onClick={closeMobile}
                            >
                                <FontAwesomeIcon icon={faShoppingCart} />
                                Panier
                                {cartCount > 0 && (
                                    <span className="cart-badge">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Navigation secondaire - DEUXIÈME LIGNE */}
            <nav className="secondary-nav">
                <div className="container">
                    <div className="secondary-nav-content">
                        {/* Bouton Toutes les catégories - EXTRÊME GAUCHE */}
                        <div className="categories-dropdown" ref={megaMenuRef}>
                            <button
                                className="categories-button"
                                onClick={handleMegaMenuToggle}
                                onMouseEnter={handleMegaMenuEnter}
                            >
                                <FontAwesomeIcon icon={faBars} />
                                Toutes les catégories
                            </button>

                            {/* Mega Menu */}
                            <CategoriesMegaMenu
                                isOpen={megaMenuOpen}
                                onClose={handleMegaMenuClose}
                            />
                        </div>

                        {/* Liens de navigation principaux - EXTRÊME DROITE */}
                        <ul className="main-links">
                            <li>
                                <Link
                                    to="/"
                                    className="main-link"
                                    onClick={closeMobile}
                                >
                                    <FontAwesomeIcon icon={faHome} />
                                    Accueil
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/boutique"
                                    className="main-link"
                                    onClick={closeMobile}
                                >
                                    <FontAwesomeIcon icon={faShoppingBag} />
                                    Boutique
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/nouveautes"
                                    className="main-link"
                                    onClick={closeMobile}
                                >
                                    <FontAwesomeIcon icon={faStar} />
                                    Nouveautés
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Menu mobile */}
            <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
                {/* Configuration pour mobile */}
                <div className="mobile-config">
                    <div className="config-section">
                        <h4 className="config-section-title">
                            <FontAwesomeIcon icon={faGlobe} />
                            {t('header.language') || 'Langue'}
                        </h4>
                        <div className="config-options">
                            {[
                                {
                                    code: 'fr',
                                    name: 'Français',
                                    flag: '🇫🇷',
                                },
                                {
                                    code: 'en',
                                    name: 'English',
                                    flag: '🇺🇸',
                                },
                            ].map(lang => (
                                <button
                                    key={lang.code}
                                    className={`config-option ${i18n.language === lang.code ? 'active' : ''}`}
                                    onClick={() => handleLangChange(lang.code)}
                                >
                                    <span className="flag">{lang.flag}</span>
                                    <span className="option-text">
                                        {lang.name}
                                    </span>
                                    {i18n.language === lang.code && (
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            className="check-icon"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="config-divider"></div>
                    <div className="config-section">
                        <h4 className="config-section-title">
                            <FontAwesomeIcon icon={faMoneyBill} />
                            {t('header.currency') || 'Devise'}
                        </h4>
                        <div className="config-options">
                            {['XOF', 'XAF', 'EUR', 'USD'].map(currency => (
                                <button
                                    key={currency}
                                    className={`config-option ${devise === currency ? 'active' : ''}`}
                                    onClick={() => handleDeviseChange(currency)}
                                >
                                    <span className="currency-symbol">
                                        {currency === 'XOF' ||
                                        currency === 'XAF'
                                            ? 'CFA'
                                            : currency === 'EUR'
                                              ? '€'
                                              : currency === 'USD'
                                                ? '$'
                                                : currency}
                                    </span>
                                    <span className="option-text">
                                        {getCurrencyName(currency)}
                                    </span>
                                    {devise === currency && (
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            className="check-icon"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Liens de navigation pour mobile */}
                <ul className="mobile-nav-links">
                    <li>
                        <button
                            className="mobile-nav-link"
                            onClick={() => handleOpenSidebar()}
                        >
                            <FontAwesomeIcon icon={faList} />
                            Catégories
                        </button>
                    </li>
                    <li>
                        <Link
                            to="/"
                            className="mobile-nav-link"
                            onClick={closeMobile}
                        >
                            <FontAwesomeIcon icon={faHome} />
                            Accueil
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/boutique"
                            className="mobile-nav-link"
                            onClick={closeMobile}
                        >
                            <FontAwesomeIcon icon={faShoppingBag} />
                            Boutique
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/nouveautes"
                            className="mobile-nav-link"
                            onClick={closeMobile}
                        >
                            <FontAwesomeIcon icon={faStar} />
                            Nouveautés
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/panier"
                            className="mobile-nav-link"
                            onClick={closeMobile}
                        >
                            <FontAwesomeIcon icon={faShoppingCart} />
                            Panier
                            {cartCount > 0 && (
                                <span className="cart-badge">{cartCount}</span>
                            )}
                        </Link>
                    </li>
                </ul>

                {/* Actions utilisateur */}
                <div className="user-actions">
                    {user?.isAdmin ? (
                        <>
                            <Link
                                to="/admin"
                                className="nav-link"
                                onClick={closeMobile}
                            >
                                <FontAwesomeIcon icon={faUserShield} />
                                {t('header.admin') || 'Admin'}
                            </Link>
                            <button className="nav-link" onClick={handleLogout}>
                                <FontAwesomeIcon icon={faSignOutAlt} />
                                {t('header.logout') || 'Déconnexion'}
                            </button>
                        </>
                    ) : user ? (
                        <Link
                            to="/profil"
                            className="nav-link user-profile-link"
                            onClick={closeMobile}
                        >
                            <FontAwesomeIcon icon={faUserCircle} />
                            <span className="user-name">
                                {user.nomComplet ||
                                    user.prenom ||
                                    user.nom ||
                                    t('header.my_account') ||
                                    'Mon compte'}
                            </span>
                        </Link>
                    ) : (
                        <Link
                            to="/connexion"
                            className="login-btn"
                            onClick={closeMobile}
                        >
                            <FontAwesomeIcon icon={faSignInAlt} />
                            {t('header.login') || 'Connexion'}
                        </Link>
                    )}
                </div>
            </div>

            {/* Sidebar des catégories */}
            <CategoriesSidebar
                isOpen={sidebarOpen}
                onClose={handleCloseSidebar}
                categorySlug={selectedCategory}
            />
        </header>
    );
}
