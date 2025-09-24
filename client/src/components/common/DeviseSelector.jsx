import React, { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons'
import './DeviseSelector.scss'

const DeviseSelector = ({ selectedCurrency, onCurrencyChange }) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    const currencies = [
        { code: 'XOF', country: 'Sénégal', flag: '🇸🇳', symbol: 'XOF' },
        { code: 'XAF', country: 'Cameroun', flag: '', symbol: 'XAF' },
        { code: 'XAF', country: 'Congo', flag: '', symbol: 'XAF' },
        { code: 'XOF', country: "Côte d'Ivoire", flag: '', symbol: 'XOF' },
        { code: 'USD', country: 'États-Unis', flag: '🇺🇸', symbol: '$' },
        { code: 'EUR', country: 'France', flag: '🇫🇷', symbol: '€' },
        { code: 'XAF', country: 'Gabon', flag: '🇬🇦', symbol: 'XAF' },
    ]

    useEffect(() => {
        const handleClickOutside = event => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleCurrencySelect = currency => {
        onCurrencyChange(currency)
        setIsOpen(false)
    }

    const selected =
        currencies.find(c => c.code === selectedCurrency) || currencies[0]

    return (
        <div className="devise-selector" ref={dropdownRef}>
            <button
                className="devise-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
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
                                key={`${currency.country}-${currency.code}`}
                                className={`devise-option ${selectedCurrency === currency.code ? 'selected' : ''}`}
                                onClick={() =>
                                    handleCurrencySelect(currency.code)
                                }
                            >
                                <div className="option-content">
                                    <span className="country-flag">
                                        {currency.flag}
                                    </span>
                                    <div className="country-info">
                                        <span className="country-name">
                                            {currency.country}
                                        </span>
                                        <span className="currency-symbol">
                                            {currency.symbol}
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
    )
}

export default DeviseSelector
