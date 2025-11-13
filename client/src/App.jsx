import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import { CartProvider } from './contexts/CartContext';
import { ProduitsProvider } from './contexts/ProduitsContext';
import AppRoutes from './routes/index';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <ToastProvider>
                    <CategoriesProvider>
                        <ProduitsProvider>
                            <CartProvider>
                                <div className="App">
                                    <AppRoutes />
                                </div>
                            </CartProvider>
                        </ProduitsProvider>
                    </CategoriesProvider>
                </ToastProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
