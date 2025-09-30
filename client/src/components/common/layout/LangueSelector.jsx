import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import './LangueSelector.scss';

const LangueSelector = ({ selectedLang, onLangChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languages = [
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
    ];

    useEffect(() => {
        const handleClickOutside = event => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLangSelect = langCode => {
        onLangChange(langCode);
        setIsOpen(false);
    };

    const selected =
        languages.find(l => l.code === selectedLang) || languages[0];

    return (
        <div className="langue-selector" ref={dropdownRef}>
            <button
                className="langue-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label="Changer de langue"
            >
                <span className="selected-lang">
                    {selected.flag && (
                        <span className="lang-flag">{selected.flag}</span>
                    )}
                    <span className="lang-code">
                        {selected.code.toUpperCase()}
                    </span>
                </span>
                <FontAwesomeIcon icon={faChevronDown} className="chevron" />
            </button>

            {isOpen && (
                <div className="langue-dropdown">
                    <div className="dropdown-header">
                        <h4>Sélectionnez votre langue</h4>
                    </div>
                    <div className="dropdown-content">
                        {languages.map(lang => (
                            <button
                                key={lang.code}
                                className={`langue-option ${selectedLang === lang.code ? 'selected' : ''}`}
                                onClick={() => handleLangSelect(lang.code)}
                            >
                                <div className="option-content">
                                    <span className="lang-flag">
                                        {lang.flag}
                                    </span>
                                    <span className="lang-name">
                                        {lang.name}
                                    </span>
                                </div>
                                {selectedLang === lang.code && (
                                    <FontAwesomeIcon
                                        icon={faCheck}
                                        className="check-icon"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LangueSelector;
