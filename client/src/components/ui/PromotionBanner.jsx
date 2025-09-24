import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faTag } from '@fortawesome/free-solid-svg-icons'
import './PromotionBanner.scss'

/**
 * Bannière promotionnelle avec temporisateur et option de fermeture
 * @param {String} message - Message promotionnel à afficher
 * @param {String} offerCode - Code de promotion optionnel
 * @param {Date} expirationDate - Date d'expiration de la promotion
 * @param {String} theme - Thème visuel (primary, secondary, success, danger)
 */
export default function PromotionBanner({
    message = 'Économisez 20% sur votre première commande !',
    offerCode = 'BIENVENUE20',
    expirationDate,
    theme = 'primary',
}) {
    const [isVisible, setIsVisible] = useState(true)
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

    /**
     * Calcule le temps restant avant expiration
     * @returns {Object} Temps restant formaté
     */
    function calculateTimeLeft() {
        if (!expirationDate) return null

        const difference = new Date(expirationDate) - new Date()
        if (difference <= 0) return null

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        }
    }

    // Met à jour le compteur toutes les secondes
    useEffect(() => {
        if (expirationDate) {
            const timer = setTimeout(() => {
                setTimeLeft(calculateTimeLeft())
            }, 1000)

            return () => clearTimeout(timer)
        }
    }, [timeLeft, expirationDate])

    /**
     * Ferme la bannière promotionnelle
     */
    const closeBanner = () => {
        setIsVisible(false)
        // Optionnel: stocker en localStorage pour ne pas réafficher
        localStorage.setItem('promoBannerClosed', 'true')
    }

    // Si la bannière est masquée, ne rien afficher
    if (!isVisible) return null

    return (
        <div className={`promotion-banner theme-${theme}`}>
            <div className="promotion-content">
                <div className="promotion-icon">
                    <FontAwesomeIcon icon={faTag} />
                </div>

                <div className="promotion-message">
                    <span className="message-text">{message}</span>
                    {offerCode && (
                        <span className="offer-code">
                            Code: <strong>{offerCode}</strong>
                        </span>
                    )}
                </div>

                {timeLeft && (
                    <div className="promotion-timer">
                        <span className="timer-text">Expire dans: </span>
                        <span className="timer-value">
                            {timeLeft.days > 0 && `${timeLeft.days}j `}
                            {timeLeft.hours}h {timeLeft.minutes}m{' '}
                            {timeLeft.seconds}s
                        </span>
                    </div>
                )}
            </div>

            <button
                className="close-button"
                onClick={closeBanner}
                aria-label="Fermer la bannière promotionnelle"
            >
                <FontAwesomeIcon icon={faTimes} />
            </button>
        </div>
    )
}
