import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSearch, faUser, faShoppingCart, faTags, faSignInAlt, faSignOutAlt, faUserShield, faUserCircle, faBox,
    faCheck, faChevronDown, faBars, faList, faTimes, faImage, faUpload, faCamera, faPaste,
} from '@fortawesome/free-solid-svg-icons'
import logoNody from '../../../assets/logo/neos-brands-solid.svg'
import { useCart } from '../../../contexts/CartContext'
import { useAuth } from '../../../contexts/AuthContext'
import './Header.scss'

export default function Header() {
    const navigate = useNavigate()
    const { panier } = useCart()
    const { user, logout } = useAuth()
    const cartCount = panier.reduce((total, p) => total + p.quantite, 0)
    const [selectedCurrency, setSelectedCurrency] = useState(() => {
        return localStorage.getItem('nodyCurrency') || 'XOF'
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [imageSearchOpen, setImageSearchOpen] = useState(false)
    const [imagePreview, setImagePreview] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef(null)
    const searchInputRef = useRef(null)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        localStorage.setItem('nodyCurrency', selectedCurrency)
    }, [selectedCurrency])

    // Gérer le collage d'image avec Ctrl+V
    useEffect(() => {
        const handlePaste = e => {
            if (
                searchInputRef.current &&
                document.activeElement === searchInputRef.current
            ) {
                const items = e.clipboardData?.items
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            const blob = items[i].getAsFile()
                            const url = URL.createObjectURL(blob)
                            setImagePreview(url)
                            setImageSearchOpen(true)
                            break
                        }
                    }
                }
            }
        }

        document.addEventListener('paste', handlePaste)
        return () => document.removeEventListener('paste', handlePaste)
    }, [])

    const handleSearchSubmit = e => {
        e.preventDefault()
        if (searchQuery.trim().length >= 2) {
            navigate(
                `/produits?search=${encodeURIComponent(searchQuery.trim())}`
            )
            setSearchQuery('')
            closeMobile()
        }
    }

    const handleImageSearchSubmit = e => {
        e.preventDefault()
        if (imagePreview) {
            // Ici, vous enverriez normalement l'image à votre API de recherche
            // Pour l'exemple, nous allons simplement naviguer vers une page de résultats
            navigate(`/produits?imageSearch=true`)
            setImageSearchOpen(false)
            setImagePreview(null)
            closeMobile()
        }
    }

    const handleFileSelect = e => {
        const file = e.target.files[0]
        if (file && file.type.match('image.*')) {
            const url = URL.createObjectURL(file)
            setImagePreview(url)
            setImageSearchOpen(true)
        }
    }

    const handleDragOver = e => {
        e.preventDefault()
        setDragOver(true)
    }

    const handleDragLeave = e => {
        e.preventDefault()
        setDragOver(false)
    }

    const handleDrop = e => {
        e.preventDefault()
        setDragOver(false)

        const files = e.dataTransfer.files
        if (files.length > 0 && files[0].type.match('image.*')) {
            const url = URL.createObjectURL(files[0])
            setImagePreview(url)
            setImageSearchOpen(true)
        }
    }

    const openFileDialog = () => {
        fileInputRef.current?.click()
    }

    const handleLogout = () => {
        logout()
        localStorage.removeItem('userToken')
        localStorage.removeItem('userData')
        closeMobile()
        navigate('/')
    }

    const closeMobile = () => setMobileMenuOpen(false)

    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
            {/* Top Bar */}
            <div className="top-bar">
                <div className="container">
                    <div className="top-bar-content">
                        <span>Livraison partout dans Dakar.</span>
                        <div className="top-links">
                            <Link to="/contact" onClick={closeMobile}>
                                Contact
                            </Link>
                            <Link to="/faq" onClick={closeMobile}>
                                FAQ
                            </Link>
                            <Link to="/blog" onClick={closeMobile}>
                                Blog
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="main-nav">
                <div className="container">
                    <div className="nav-content">
                        {/* Logo and Mobile Toggle */}
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

                        {/* Search Form with Image Search */}
                        <div className="search-container">
                            <form
                                className="search-form"
                                onSubmit={handleSearchSubmit}
                            >
                                <input
                                    type="text"
                                    placeholder="Rechercher un produit..."
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
                                    <FontAwesomeIcon icon={faImage} />
                                </button>
                            </form>

                            {/* Image Search Panel */}
                            {imageSearchOpen && (
                                <div className="image-search-panel">
                                    <div className="panel-header">
                                        <h3>Recherche par image</h3>
                                        <button
                                            onClick={() => {
                                                setImageSearchOpen(false)
                                                setImagePreview(null)
                                            }}
                                            aria-label="Fermer"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>

                                    <div className="panel-content">
                                        {imagePreview ? (
                                            <div className="image-preview">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                />
                                                <div className="preview-actions">
                                                    <button
                                                        onClick={openFileDialog}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faImage}
                                                        />{' '}
                                                        Changer l'image
                                                    </button>
                                                    <button
                                                        onClick={
                                                            handleImageSearchSubmit
                                                        }
                                                        className="search-btn"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faSearch}
                                                        />{' '}
                                                        Lancer la recherche
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={`upload-area ${dragOver ? 'drag-over' : ''}`}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                onClick={openFileDialog}
                                            >
                                                <div className="upload-content">
                                                    <FontAwesomeIcon
                                                        icon={faUpload}
                                                        size="3x"
                                                    />
                                                    <p>
                                                        Glissez-déposez une
                                                        image ici ou cliquez
                                                        pour parcourir
                                                    </p>
                                                    <p className="hint">
                                                        <FontAwesomeIcon
                                                            icon={faPaste}
                                                        />
                                                        Vous pouvez aussi coller
                                                        une image (Ctrl+V) dans
                                                        la barre de recherche
                                                    </p>
                                                    <button className="camera-btn">
                                                        <FontAwesomeIcon
                                                            icon={faCamera}
                                                        />{' '}
                                                        Prendre une photo
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Content */}
                        <div
                            className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}
                        >
                            {/* Navigation Links */}
                            <ul className="nav-links">
                                <li className="nav-item dropdown">
                                    <button className="nav-link">
                                        {selectedCurrency}
                                        <FontAwesomeIcon icon={faChevronDown} />
                                    </button>
                                    <div className="dropdown-menu">
                                        {['XOF', 'XAF', 'EUR'].map(devise => (
                                            <button
                                                key={devise}
                                                className={`dropdown-item ${selectedCurrency === devise ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSelectedCurrency(devise)
                                                    closeMobile()
                                                }}
                                            >
                                                {devise}
                                                {selectedCurrency ===
                                                    devise && (
                                                    <FontAwesomeIcon
                                                        icon={faCheck}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </li>

                                <li className="nav-item">
                                    <Link
                                        to="/produits"
                                        className="nav-link"
                                        onClick={closeMobile}
                                    >
                                        <FontAwesomeIcon icon={faTags} />{' '}
                                        Produits
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
                                        />{' '}
                                        Panier
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
                                        <FontAwesomeIcon icon={faList} />{' '}
                                        Catégories
                                    </Link>
                                </li>
                            </ul>

                            {/* User Actions */}
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
                                            />{' '}
                                            Admin
                                        </Link>
                                        <button
                                            className="nav-link"
                                            onClick={handleLogout}
                                        >
                                            <FontAwesomeIcon
                                                icon={faSignOutAlt}
                                            />{' '}
                                            Déconnexion
                                        </button>
                                    </>
                                ) : user ? (
                                    <div className="user-dropdown dropdown">
                                        <button className="dropdown-toggle">
                                            <FontAwesomeIcon
                                                icon={faUserCircle}
                                            />
                                            <span className="user-name">
                                                {user.name || 'Mon compte'}
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
                                                />{' '}
                                                Profil
                                            </Link>
                                            <Link
                                                to="/commandes"
                                                className="dropdown-item"
                                                onClick={closeMobile}
                                            >
                                                <FontAwesomeIcon icon={faBox} />{' '}
                                                Commandes
                                            </Link>
                                            <div className="dropdown-divider"></div>
                                            <button
                                                className="dropdown-item"
                                                onClick={handleLogout}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faSignOutAlt}
                                                />{' '}
                                                Déconnexion
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        to="/connexion"
                                        className="login-btn"
                                        onClick={closeMobile}
                                    >
                                        <FontAwesomeIcon icon={faSignInAlt} />{' '}
                                        Connexion
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
