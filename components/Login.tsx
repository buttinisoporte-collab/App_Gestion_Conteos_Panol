
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';


const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const { login, settings, users, refreshData } = useAppContext();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const success = await login(username.trim(), password);
      if (!success) {
        setError('Credenciales incorrectas. Verifique usuario y contraseña.');
      }
    } catch {
      setError('Error al procesar el inicio de sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedAdmin = async () => {
    setIsSeeding(true);
    try {
      await dataService.seedInitialData();
      await refreshData();
      alert('Base de datos inicializada y administrador inicial creado con éxito.\nUsuario: Admin\nContraseña: Admin');
    } catch (err) {
      console.error('Error seeding admin:', err);
      alert('Error al inicializar la base de datos.');
    } finally {
      setIsSeeding(false);
    }
  };

  const noUsersExist = users && users.length === 0;

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-slate-50">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          {settings.loginLogoUrl ? (
            <img src={settings.loginLogoUrl} alt="Logo" className="mx-auto h-20 w-auto mb-4 object-contain" />
          ) : null}
          <CardTitle className="text-2xl font-bold text-corporate-blue">
            {settings.companyName || 'GESTIÓN DEPÓSITO'}
          </CardTitle>
          <CardDescription>
            Ingrese sus credenciales para acceder al sistema.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-slate-700">Usuario</label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                disabled={isSubmitting}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">Contraseña</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                disabled={isSubmitting}
                required
                autoComplete="current-password"
              />
            </div>
             {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-corporate-blue text-white hover:bg-corporate-blue/90"
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Acceder'}
            </Button>
            {noUsersExist && !isSubmitting && (
              <Button 
                type="button" 
                onClick={handleSeedAdmin} 
                disabled={isSeeding}
                variant="outline" 
                className="w-full border-corporate-blue text-corporate-blue hover:bg-corporate-blue/10"
              >
                {isSeeding ? 'Configurando...' : 'Configurar Base de Datos'}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
