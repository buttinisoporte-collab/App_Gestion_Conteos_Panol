import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export default function Settings({ onBack }: { onBack: () => void }) {
  const { settings, updateSettings } = useAppContext();
  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [loginLogoUrl, setLoginLogoUrl] = useState(settings.loginLogoUrl || '');
  
  // Lista de observaciones
  const [obsList, setObsList] = useState<string[]>(settings.predefinedObservations || []);
  const [newObs, setNewObs] = useState('');

  const handleSave = async () => {
    await updateSettings({ companyName, logoUrl, loginLogoUrl, predefinedObservations: obsList });
    alert('Configuración guardada exitosamente.');
    onBack();
  };

  const handleAddObs = () => {
    if (newObs.trim() && !obsList.includes(newObs.trim())) {
      setObsList([...obsList, newObs.trim()]);
      setNewObs('');
    }
  };

  const handleRemoveObs = (obsToRemove: string) => {
    setObsList(obsList.filter(obs => obs !== obsToRemove));
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button onClick={onBack} variant="secondary" className="mb-4">&larr; Volver al Dashboard</Button>
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Empresa</label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL del Logo (Menu superior)</label>
              <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://ejemplo.com/logo.png" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">URL del Logo (Pantalla Login)</label>
              <Input value={loginLogoUrl} onChange={e => setLoginLogoUrl(e.target.value)} placeholder="https://ejemplo.com/login-logo.png" />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-corporate-blue mb-4">Listado de Observaciones Predefinidas</h3>
            <p className="text-sm text-slate-600 mb-4">
              Agregue aquí las observaciones estándar. Los operarios verán una lista desplegable con estas opciones al realizar el conteo.
            </p>
            
            <div className="flex gap-2 mb-4">
              <Input 
                value={newObs} 
                onChange={e => setNewObs(e.target.value)} 
                placeholder="Ej: Material Dañado, Falta Etiqueta..." 
                onKeyDown={e => e.key === 'Enter' && handleAddObs()}
              />
              <Button onClick={handleAddObs} className="bg-slate-800 text-white whitespace-nowrap">Añadir a la lista</Button>
            </div>

            {obsList.length > 0 ? (
              <ul className="bg-slate-50 border rounded-md divide-y">
                {obsList.map((obs, idx) => (
                  <li key={idx} className="flex justify-between items-center p-3 text-sm">
                    <span className="font-medium">{obs}</span>
                    <button onClick={() => handleRemoveObs(obs)} className="text-red-500 font-bold hover:text-red-700 px-2">&times; Quitar</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 italic">No hay observaciones predefinidas. Los operarios escribirán texto libre.</p>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave} className="bg-corporate-blue text-white">Guardar Toda la Configuración</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}