import React, { useState, useEffect } from 'react';
import AlertDialog from './ui/AlertDialog';
import { useAppContext } from '../context/AppContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from './ui/Card';

const Settings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { settings, updateSettings, resetApplicationData, user } = useAppContext();
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loginLogoUrl, setLoginLogoUrl] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || 'Gestión de Pañol');
      setLogoUrl(settings.logoUrl || '');
      setLoginLogoUrl(settings.loginLogoUrl || '');
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings({ companyName, logoUrl, loginLogoUrl });
    alert('Configuración guardada con éxito.');
    onBack();
  };

  if (isResetModalOpen) {
    return (
      <AlertDialog
        isOpen={true}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          resetApplicationData();
          setIsResetModalOpen(false);
        }}
        title="¿Está absolutamente seguro?"
        description="Esta acción es irreversible. Se borrarán todos los conteos y usuarios, excepto el usuario 'Admin'. La aplicación volverá a su estado inicial."
        confirmText="Sí, entiendo las consecuencias, reiniciar todo"
      />
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button onClick={onBack} variant="secondary" className="mb-4">
        &larr; Volver al Dashboard
      </Button>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>Personalice la apariencia de la aplicación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="companyName" className="font-medium">Nombre de la Empresa</label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ingrese el nombre de su empresa"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="logoUrl" className="font-medium">URL del Logo</label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
            />
            {logoUrl && <img src={logoUrl} alt="Vista previa del logo" className="mt-4 max-h-20 rounded-md border p-2" />}
          </div>

          <div className="space-y-2">
            <label htmlFor="loginLogoUrl" className="font-medium">URL del Logo para Inicio de Sesión</label>
            <Input
              id="loginLogoUrl"
              value={loginLogoUrl}
              onChange={(e) => setLoginLogoUrl(e.target.value)}
              placeholder="https://ejemplo.com/logo-login.png"
            />
            {loginLogoUrl && <img src={loginLogoUrl} alt="Vista previa del logo de inicio de sesión" className="mt-4 max-h-40 rounded-md border p-2" />}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </CardFooter>
      </Card>

      <Card className="max-w-2xl mx-auto mt-8 border-red-500">
        <CardHeader>
          <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
          <CardDescription>Estas acciones son irreversibles. Por favor, proceda con precaución.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center p-4 bg-red-50 rounded-md">
            <div>
              <h4 className="font-semibold">Reiniciar Base de Datos</h4>
              <p className="text-sm text-slate-600">Esto borrará todos los conteos y usuarios, restaurando la aplicación a su estado inicial. El usuario 'Admin' no será eliminado.</p>
            </div>
            {user?.username === 'Admin' && (
              <Button variant="destructive" onClick={() => setIsResetModalOpen(true)}>
                Reiniciar Datos
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
