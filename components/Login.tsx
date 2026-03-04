
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';


const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const { login, settings, users } = useAppContext();
  const seedAdmin = useMutation(api.users.seedInitialAdmin);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('Credenciales incorrectas. Intente de nuevo.');
    } else {
      setError('');
    }
  };

  const handleSeedAdmin = async () => {
    setIsSeeding(true);
    try {
      await seedAdmin();
      alert('Administrador inicial creado con éxito. Usuario: Admin, Contraseña: Admin');
    } catch (err) {
      console.error('Error seeding admin:', err);
      alert('Error al crear el administrador inicial.');
    } finally {
      setIsSeeding(false);
    }
  };

  const noUsersExist = users && users.length === 0;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          {settings.loginLogoUrl && (
            <img src={settings.loginLogoUrl} alt="Logo" className="mx-auto h-24 w-auto mb-6" />
          )}
          <CardTitle className="text-2xl">GESTION DEPOSITO</CardTitle>
          <CardTitle className="text-2xl">Inicio de sesión</CardTitle>
          <CardDescription>
            Ingrese sus credenciales para acceder al sistema.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username">Usuario</label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password">Contraseña</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
              />
            </div>
             {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-corporate-blue text-white hover:bg-corporate-blue/90">
              Acceder
            </Button>
            {noUsersExist && (
              <Button 
                type="button" 
                onClick={handleSeedAdmin} 
                disabled={isSeeding}
                variant="outline" 
                className="w-full border-corporate-blue text-corporate-blue hover:bg-corporate-blue/10"
              >
                {isSeeding ? 'Creando...' : 'Crear Administrador Inicial'}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
