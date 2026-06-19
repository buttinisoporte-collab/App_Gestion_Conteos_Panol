
import React from 'react';
import '/index.css';
import { AppProvider, useAppContext } from './context/AppContext';
import Login from './components/Login';
import DashboardAdmin from './components/DashboardAdmin';
import OperarioView from './components/OperarioView';
import ChangePassword from './components/ChangePassword';

const AppContent: React.FC = () => {
    const { user, logout, settings } = useAppContext();

    if (!user) {
        return <Login />;
    }

    if (user.mustChangePassword) {
        return <ChangePassword />;
    }

    const renderDashboard = () => {
        switch (user.role) {
            case 'admin':
                return <DashboardAdmin />;
            case 'encargado':
                return <DashboardAdmin />;    
            case 'operario':
                return <OperarioView />;
            default:
                return <Login />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="bg-corporate-yellow shadow-md">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0">
                            <div className="flex items-center gap-3">
                                {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto" />}
                                <h1 className="text-xl font-bold text-corporate-blue">{settings.companyName}</h1>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="mr-4 font-medium text-corporate-blue">Hola, {user.fullName}</span>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm font-medium text-corporate-blue bg-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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