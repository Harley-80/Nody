import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import { CartProvider } from './contexts/CartContext';
import { ProduitsProvider } from './contexts/ProduitsContext';
import { DeviseProvider } from './contexts/DeviseContext';
import { ConfirmModalProvider } from './contexts/ConfirmModalContext';
import AppRoutes from './routes/index';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/admin.scss';
import './App.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <DeviseProvider>
                    <NotificationProvider>
                        <ConfirmProvider>
                            <ToastProvider>
                                <ConfirmModalProvider>
                                    <CategoriesProvider>
                                        <ProduitsProvider>
                                            <CartProvider>
                                                <div className="App">
                                                    <AppRoutes />
                                                </div>
                                            </CartProvider>
                                        </ProduitsProvider>
                                    </CategoriesProvider>
                                </ConfirmModalProvider>
                            </ToastProvider>
                        </ConfirmProvider>
                    </NotificationProvider>
                </DeviseProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;