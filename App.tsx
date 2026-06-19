
import React from 'react';
import '/index.css';
import { AppProvider, useAppContext } from './context/AppContext';
import Login from './components/Login';
import DashboardAdmin from './components/DashboardAdmin';
import OperarioView from './components/OperarioView';
import ChangePassword from './components/ChangePassword';

const AppContent: React.FC = () => {
    const { user, logout, settings } = useAppContext();
    const [viewMode, setViewMode] = React.useState<'admin' | 'operario'>('admin');

    // Mantiene sincronizada la vista por defecto al iniciar sesión
    React.useEffect(() => {
        if (user) {
            setViewMode(user.role === 'operario' ? 'operario' : 'admin');
        }
    }, [user]);

    if (!user) {
        return <Login />;
    }

    if (user.mustChangePassword) {
        return <ChangePassword />;
    }

    const renderDashboard = () => {
        if (viewMode === 'operario') {
            return <OperarioView />;
        }
        return <DashboardAdmin />;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="bg-corporate-yellow shadow-md">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0">
                            <div className="flex items-center gap-3">
                                {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto" />}
                                <h1 className="text-xl font-bold text-corporate-blue hidden sm:block">{settings.companyName}</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4">
                            {/* Botón para alternar vistas (Solo Admin y Encargado) */}
                            {(user.role === 'encargado' || user.role === 'admin') && (
                                <button
                                    onClick={() => setViewMode(viewMode === 'admin' ? 'operario' : 'admin')}
                                    className="px-3 py-1.5 text-xs sm:text-sm font-bold text-white bg-slate-800 rounded-md hover:bg-slate-700 transition-colors shadow-sm"
                                >
                                    {viewMode === 'admin' ? 'Ir a Carga de Datos' : 'Volver al Dashboard'}
                                </button>
                            )}
                            
                            <span className="hidden md:inline font-medium text-corporate-blue">Hola, {user.fullName}</span>
                            <button
                                onClick={logout}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-corporate-blue bg-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </nav>
            </header>
            <main>
                {renderDashboard()}
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;