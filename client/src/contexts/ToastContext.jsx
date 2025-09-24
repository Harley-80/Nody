import { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/ui/ToastNody';

const ToastContext = createContext();

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ 
        type = 'info', 
        message, 
        title, 
        duration = 5000,
        action 
    }) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message, title, duration, action }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}
