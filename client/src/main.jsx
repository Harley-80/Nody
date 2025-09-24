import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ProduitsProvider } from './contexts/ProduitsContext';

ReactDOM.createRoot(document.getElementById('root')).render(
    <AuthProvider>
        <BrowserRouter>
            <ProduitsProvider>
                <CartProvider>
                    <App />
                </CartProvider>
            </ProduitsProvider>
        </BrowserRouter>
    </AuthProvider>
);
