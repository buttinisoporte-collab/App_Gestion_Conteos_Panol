import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { MasterStockItem } from '../types';

export default function MasterStockManager({ onBack }: { onBack: () => void }) {
  const { updateMasterStock } = useAppContext();
  const [pasteData, setPasteData] = useState('');

  const handleProcess = async () => {
     const lines = pasteData.trim().split('\n');
     const newStock: Record<string, MasterStockItem> = {};
     let count = 0;
     
     lines.forEach((line, i) => {
        const cols = line.split('\t').map(c => c.trim());
        if (i === 0 && cols[0].toLowerCase().includes('id')) return; // Saltar encabezados
        if (cols.length >= 4) {
           const id = cols[0];
           newStock[id] = {
             id,
             description: cols[1],
             location: cols[2],
             type: cols[3].toUpperCase() || 'S/T'
           };
           count++;
        }
     });

     if (count > 0) {
        await updateMasterStock(newStock);
        alert(`Stock maestro actualizado exitosamente.\nSe cargaron ${count} artículos con sus respectivos TIPOS.`);
        setPasteData('');
     } else {
        alert('No se encontraron datos válidos. Asegúrese de copiar de Excel las 4 columnas: ID_Material, Descripción, Ubicación, TIPO.');
     }
  };

  return (
     <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button onClick={onBack} variant="secondary" className="mb-4">&larr; Volver al Dashboard</Button>
        <Card>
           <CardHeader>
               <CardTitle>Cargar Stock Maestro General</CardTitle>
           </CardHeader>
           <CardContent>
              <p className="mb-4 text-sm text-slate-600">
                  Pegue aquí los datos desde su archivo Excel. El sistema espera exactamente 4 columnas en este orden:<br/>
                  <b>1. ID_Material | 2. Descripción | 3. Ubicacion | 4. TIPO</b>
              </p>
              <textarea
                 className="w-full h-64 p-3 border rounded-md font-mono text-sm bg-slate-50"
                 placeholder="Pegue los datos aquí..."
                 value={pasteData}
                 onChange={e => setPasteData(e.target.value)}
              />
              <div className="mt-4 flex gap-2">
                 <Button onClick={handleProcess} className="bg-corporate-blue text-white hover:bg-corporate-blue/90">
                     Procesar y Guardar Base de Datos
                 </Button>
              </div>
           </CardContent>
        </Card>
     </div>
  );
}