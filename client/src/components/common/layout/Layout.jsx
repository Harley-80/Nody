import React, { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';
import './Layout.scss';

export default function Layout({ children }) {
    const location = useLocation();
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isPageLoaded, setIsPageLoaded] = useState(false);

    // Scroll to top on route change
    useEffect(() => {
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        
        return () => clearTimeout(timer);
    }, [location.pathname]);

    // Back to top button visibility
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Page load detection
    useEffect(() => {
        setIsPageLoaded(true);
        return () => setIsPageLoaded(false);
    }, []);

    return (
        <div className={`layout-container ${isPageLoaded ? 'loaded' : ''}`}>
            <Header />
            
            <main className="main-content" id="main-content">
                {children}
            </main>
            
            <Footer />
            
            {/* Back to top button with improved accessibility */}
            <button 
                className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
                onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    document.getElementById('main-content')?.focus();
                }}
                aria-label="Retour en haut de la page"
                aria-hidden={!showBackToTop}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 20V4M5 11L12 4L19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
        </div>
    );
}