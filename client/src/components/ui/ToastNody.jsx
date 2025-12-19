import { useEffect, useState } from 'react';
import {
    FaCheckCircle,
    FaTimesCircle,
    FaInfoCircle,
    FaExclamationTriangle,
} from 'react-icons/fa';
import './ToastNody.scss';

const Toast = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        // Barre de progression
        const interval = setInterval(() => {
            setProgress(prev =>
                Math.max(prev - (100 / toast.duration) * 16.6, 0)
            );
        }, 16.6);

        // Auto-dismiss
        const timer = setTimeout(() => {
            dismiss();
        }, toast.duration);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [toast.duration]);

    const dismiss = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    const iconMap = {
        success: <FaCheckCircle className="toast-icon toast-icon-success" />,
        error: <FaTimesCircle className="toast-icon toast-icon-error" />,
        warning: (
            <FaExclamationTriangle className="toast-icon toast-icon-warning" />
        ),
        info: <FaInfoCircle className="toast-icon toast-icon-info" />,
    };

    return (
        <div
            className={`toast-nody toast-${toast.type} ${isExiting ? 'toast-exiting' : ''}`}
        >
            <div className="toast-content">
                <div className="toast-icon-wrapper">{iconMap[toast.type]}</div>
                <div className="toast-text">
                    <p className="toast-title">
                        {toast.title || toast.type.toUpperCase()}
                    </p>
                    <p className="toast-message">{toast.message}</p>
                </div>
            </div>
            <button
                onClick={dismiss}
                className="toast-close-btn"
                aria-label="Fermer"
            >
                &times;
            </button>
            <div className="toast-progress" style={{ width: `${progress}%` }} />
        </div>
    );
};

export default function ToastContainer({ toasts, onRemove }) {
    return (
        <div className="toast-container-nody">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}
