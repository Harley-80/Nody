import AppRoutes from './routes/index';
import { ToastProvider } from './contexts/ToastContext';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
    return (
        <ToastProvider>
            <div className="App">
                <AppRoutes />
            </div>
        </ToastProvider>
    );
}