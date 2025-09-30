import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import './DeviseSelector.scss';

const ALL_CURRENCIES = [
    { code: 'XOF', name: 'Franc CFA (UEMOA)', flag: '🇸🇳', symbol: 'XOF' },
    { code: 'XAF', name: 'Franc CFA (CEMAC)', flag: '🇨🇲', symbol: 'XAF' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
    { code: 'USD', name: 'Dollar américain', flag: '🇺🇸', symbol: '$' },
];

const DeviseSelector = ({
    selectedCurrency,
    onCurrencyChange,
    currenciesList = ['XOF', 'XAF', 'EUR', 'USD'],
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currencies = ALL_CURRENCIES.filter(c =>
        currenciesList.includes(c.code)
    );

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

    const handleCurrencySelect = currency => {
        onCurrencyChange(currency);
        setIsOpen(false);
    };

    const selected =
        currencies.find(c => c.code === selectedCurrency) || currencies[0];

    return (
        <div className="devise-selector" ref={dropdownRef}>
            <button
                className="devise-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label="Changer de devise"
            >
                <span className="selected-currency">
                    {selected.flag && (
                        <span className="currency-flag">{selected.flag}</span>
                    )}
                    <span className="currency-code">{selected.code}</span>
                </span>
                <FontAwesomeIcon icon={faChevronDown} className="chevron" />
            </button>

            {isOpen && (
                <div className="devise-dropdown">
                    <div className="dropdown-header">
                        <h4>Sélectionnez votre devise</h4>
                    </div>
                    <div className="dropdown-content">
                        {currencies.map(currency => (
                            <button
                                key={currency.code}
                                className={`devise-option ${selectedCurrency === currency.code ? 'selected' : ''}`}
                                onClick={() =>
                                    handleCurrencySelect(currency.code)
                                }
                            >
                                <div className="option-content">
                                    <span className="currency-flag">
                                        {currency.flag}
                                    </span>
                                    <div className="currency-info">
                                        <span className="currency-name">
                                            {currency.name} ({currency.code})
                                        </span>
                                    </div>
                                </div>
                                {selectedCurrency === currency.code && (
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

export default DeviseSelector;
