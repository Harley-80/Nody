import React, { useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const MotDePasseOublie = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const { addToast } = useToast();

    const handleSubmit = async e => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        try {
            await api.post('/auth/mot-de-passe-oublie', { email });
            setMessage('Un email de réinitialisation a été envoyé.');
            addToast({
                type: 'success',
                title: 'Email envoyé',
                message: 'Vérifiez votre boîte mail.',
            });
        } catch {
            setMessage(
                "Erreur lors de l'envoi de l'email. Veuillez réessayer."
            );
            addToast({
                type: 'error',
                title: 'Erreur',
                message: "Impossible d'envoyer l'email.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div
                className="card p-4 shadow"
                style={{ maxWidth: 400, width: '100%', borderRadius: 20 }}
            >
                <h3 className="text-center mb-3">Mot de passe oublié</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Adresse e-mail</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    {message && (
                        <div className="alert alert-info">{message}</div>
                    )}
                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Envoi en cours...' : 'Envoyer'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MotDePasseOublie;
