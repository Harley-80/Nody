import { useEffect, useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const Toast = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        // Barre de progression
        const interval = setInterval(() => {
            setProgress(prev => Math.max(prev - (100 / toast.duration) * 16.6, 0));
        }, 16.6);

        // Auto-dismiss
        const timer = setTimeout(() => {
            dismiss();
        }, toast.duration);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    const dismiss = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    const iconMap = {
        success: <FaCheckCircle className="text-green-500" />,
        error: <FaTimesCircle className="text-red-500" />,
        warning: <FaExclamationTriangle className="text-yellow-500" />,
        info: <FaInfoCircle className="text-blue-500" />
    };

    return (
        <div className={`
            relative mb-2 p-4 pr-10 rounded shadow-lg min-w-[300px] 
            bg-white border-l-4 ${
                toast.type === 'success' ? 'border-green-500' :
                toast.type === 'error' ? 'border-red-500' :
                toast.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
            }
            transition-all duration-300
            ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        `}>
        <div className="flex items-start gap-3">
            <div className="mt-1">{iconMap[toast.type]}</div>
            <div>
                <p className="font-medium">{toast.title || toast.type.toUpperCase()}</p>
                <p className="text-sm text-gray-600">{toast.message}</p>
            </div>
        </div>
        <button 
            onClick={dismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
            &times;
        </button>
        <div 
            className="absolute bottom-0 left-0 h-1 bg-current opacity-20"
            style={{ width: `${progress}%` }}
        />
        </div>
    );
};

export default function ToastContainer({ toasts, onRemove }) {
    return (
        <div className="fixed bottom-4 right-4 z-[1000]">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}