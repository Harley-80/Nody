import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

export default function Confirmation() {
    const navigate = useNavigate();
    const { state } = useLocation();

    const {
        type = 'success',       
        title = 'Action terminée',
        message = 'Votre opération a été réalisée avec succès.',
        buttonLabel = 'Retour à l’accueil',
        redirectTo = '/',
        delay = null                  // en ms, optionnel
    } = state || {};

    // Icône dynamique en fonction du type
    const icons = {
        success: <FaCheckCircle size={80} className="text-success mb-4" />,
        error: <FaExclamationCircle size={80} className="text-danger mb-4" />,
        info: <FaInfoCircle size={80} className="text-primary mb-4" />,
    };

    // Redirection automatique si delay est fourni
    useEffect(() => {
        if (delay) {
            const timer = setTimeout(() => {
                navigate(redirectTo);
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [delay, navigate, redirectTo]);

    return (
        <div className="container py-5 text-center">
            <div className="card shadow-sm p-5 mx-auto" style={{ maxWidth: '600px' }}>
                {icons[type] || icons.success}
                <h2 className="mb-3">{title}</h2>
                <p className="text-muted mb-4">{message}</p>

                <button className="btn btn-dark btn-lg" onClick={() => navigate(redirectTo)}>
                    {buttonLabel}
                </button>
            </div>
        </div>
    );
}