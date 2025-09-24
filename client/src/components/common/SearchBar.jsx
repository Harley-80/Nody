import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import './SearchBar.scss';

export default function SearchBar({ className = '' }) {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim().length >= 2) {
            navigate(`/produits?search=${encodeURIComponent(query.trim())}`);
            setQuery('');
        }
    };

    return (
        <form className={`search-bar ${className}`} onSubmit={handleSubmit}>
            <input
                type="search"
                placeholder="Rechercher des produits..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                minLength="2"
                required
            />
            <button type="submit" aria-label="Rechercher">
                <FontAwesomeIcon icon={faSearch} />
            </button>
        </form>
    );
}