import AppRoutes from './routes/index';
import { ToastProvider } from './contexts/ToastContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
    return (
        <ToastProvider>
            <CategoriesProvider>
                <div className="App">
                    <AppRoutes />
                </div>
            </CategoriesProvider>
        </ToastProvider>
    );
}
