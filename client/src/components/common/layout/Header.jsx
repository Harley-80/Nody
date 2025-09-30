// Importation des dépendances nécessaires
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Importation des icônes nécessaires
import {
    faSearch,
    faUser,
    faShoppingCart,
    faTags,
    faSignInAlt,
    faSignOutAlt,
    faUserShield,
    faUserCircle,
    faBox,
    faCheck,
    faChevronDown,
    faBars,
    faList,
    faTimes,
    faGlobe,
    faMoneyBill,
} from '@fortawesome/free-solid-svg-icons';
import logoNody from '@/assets/logo/neos-brands-solid.svg';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProduits } from '@/contexts/ProduitsContext';
import imageSearchIcon from '@/assets/icons/recherche.png';
import ImageSearch from './ImageSearch';
import DeviseSelector from '../DeviseSelector';
import LangueSelector from './LangueSelector';
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
    const { devise, setDevise } = useProduits();
    const { user, logout } = useAuth();

    // Calcul du nombre total d'articles dans le panier
    const cartCount = panier.reduce((total, p) => total + p.quantite, 0);

    // États locaux pour la gestion de l'interface
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [imageSearchOpen, setImageSearchOpen] = useState(false);
    const [configDropdownOpen, setConfigDropdownOpen] = useState(false);

    // Références pour les éléments DOM
    const searchInputRef = useRef(null);
    const configDropdownRef = useRef(null);

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
            if (
                configDropdownRef.current &&
                !configDropdownRef.current.contains(event.target)
            ) {
                setConfigDropdownOpen(false);
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
    const handleImageSearch = imageFile => {
        const formData = new FormData();
        formData.append('image', imageFile);
        console.log("Envoi de l'image pour recherche:", imageFile);
        navigate(`/produits?imageSearch=true&timestamp=${Date.now()}`);
        setImageSearchOpen(false);
        closeMobile();
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
    };

    /**
     * Ouvre/Ferme le dropdown de configuration
     */
    const toggleConfigDropdown = () => {
        setConfigDropdownOpen(!configDropdownOpen);
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

    // Rendu du composant
    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
            {/* Barre supérieure */}
            <div className="top-bar">
                <div className="container">
                    <div className="top-bar-content">
                        <span>{t('header.delivery')}</span>
                        <div className="top-links">
                            <Link to="/contact" onClick={closeMobile}>
                                {t('header.contact')}
                            </Link>
                            <Link to="/faq" onClick={closeMobile}>
                                {t('header.faq')}
                            </Link>
                            <Link to="/blog" onClick={closeMobile}>
                                {t('header.blog')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation principale */}
            <nav className="main-nav">
                <div className="container">
                    <div className="nav-content">
                        {/* Logo et bouton de menu mobile */}
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

                        {/* Barre de recherche */}
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

                        {/* Sélecteur de configuration (devise et langue) pour desktop */}
                        <div className="desktop-config" ref={configDropdownRef}>
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
                                        {i18n.language.toUpperCase()} / {devise}
                                    </span>
                                    <FontAwesomeIcon
                                        icon={faChevronDown}
                                        className="chevron-icon"
                                    />
                                </button>
                                {configDropdownOpen && (
                                    <div className="config-dropdown-menu">
                                        {/* Section pour la langue */}
                                        <div className="config-section">
                                            <h4 className="config-section-title">
                                                <FontAwesomeIcon
                                                    icon={faGlobe}
                                                />
                                                {t('Langue')}
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
                                                                icon={faCheck}
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
                                                {t('Devise')}
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
                                                            currency === 'XAF'
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
                                                                icon={faCheck}
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

                        {/* Menu mobile */}
                        <div
                            className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}
                        >
                            {/* Configuration pour mobile */}
                            <div className="mobile-config">
                                <div className="config-section">
                                    <h4 className="config-section-title">
                                        <FontAwesomeIcon icon={faGlobe} />
                                        {t('header.language')}
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
                                                    handleLangChange(lang.code)
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
                                        {t('header.currency')}
                                    </h4>
                                    <div className="config-options">
                                        {['XOF', 'XAF', 'EUR', 'USD'].map(
                                            currency => (
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
                                                        {currency === 'XOF' ||
                                                        currency === 'XAF'
                                                            ? 'CFA'
                                                            : currency === 'EUR'
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
                                                    {devise === currency && (
                                                        <FontAwesomeIcon
                                                            icon={faCheck}
                                                            className="check-icon"
                                                        />
                                                    )}
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Liens de navigation */}
                            <ul className="nav-links">
                                <li className="nav-item">
                                    <Link
                                        to="/produits"
                                        className="nav-link"
                                        onClick={closeMobile}
                                    >
                                        <FontAwesomeIcon icon={faTags} />
                                        {t('header.products')}
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link
                                        to="/panier"
                                        className="nav-link"
                                        onClick={closeMobile}
                                    >
                                        <FontAwesomeIcon
                                            icon={faShoppingCart}
                                        />
                                        {t('header.cart')}
                                        {cartCount > 0 && (
                                            <span className="cart-badge">
                                                {cartCount}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link
                                        to="/categories"
                                        className="nav-link"
                                        onClick={closeMobile}
                                    >
                                        <FontAwesomeIcon icon={faList} />
                                        {t('header.categories')}
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
                                            <FontAwesomeIcon
                                                icon={faUserShield}
                                            />
                                            {t('header.admin')}
                                        </Link>
                                        <button
                                            className="nav-link"
                                            onClick={handleLogout}
                                        >
                                            <FontAwesomeIcon
                                                icon={faSignOutAlt}
                                            />
                                            {t('header.logout')}
                                        </button>
                                    </>
                                ) : user ? (
                                    <div className="user-dropdown dropdown">
                                        <button className="dropdown-toggle">
                                            <FontAwesomeIcon
                                                icon={faUserCircle}
                                            />
                                            <span className="user-name">
                                                {user.name ||
                                                    t('header.my_account')}
                                            </span>
                                        </button>
                                        <div className="dropdown-menu">
                                            <Link
                                                to="/profil"
                                                className="dropdown-item"
                                                onClick={closeMobile}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faUser}
                                                />
                                                {t('header.profile')}
                                            </Link>
                                            <Link
                                                to="/mes-commandes"
                                                className="dropdown-item"
                                                onClick={closeMobile}
                                            >
                                                <FontAwesomeIcon icon={faBox} />
                                                {t('header.orders')}
                                            </Link>
                                            <div className="dropdown-divider"></div>
                                            <button
                                                className="dropdown-item"
                                                onClick={handleLogout}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faSignOutAlt}
                                                />
                                                {t('header.logout')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        to="/connexion"
                                        className="login-btn"
                                        onClick={closeMobile}
                                    >
                                        <FontAwesomeIcon icon={faSignInAlt} />
                                        {t('header.login')}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}
