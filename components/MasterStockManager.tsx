import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { MasterStockItem } from '../types';

export default function MasterStockManager({ onBack }: { onBack: () => void }) {
  const { updateMasterStock, masterStockDate } = useAppContext();
  const[pasteData, setPasteData] = useState('');

  const handleProcess = async () => {
     const lines = pasteData.trim().split('\n');
     const newStock: Record<string, MasterStockItem> = {};
     let count = 0;
     
     lines.forEach((line, i) => {
        const cols = line.split('\t').map(c => c.trim());
        if (i === 0 && cols[0].toLowerCase().includes('id')) return;
        if (cols.length >= 4) {
           const id = cols[0];
           newStock[id] = { id, description: cols[1], location: cols[2], type: cols[3].toUpperCase() || 'S/T' };
           count++;
        }
     });

     if (count > 0) {
        await updateMasterStock(newStock);
        alert(`Stock maestro actualizado exitosamente.\nSe cargaron ${count} artículos.`);
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
               <CardDescription className="text-corporate-blue font-bold">
                   Última actualización en base de datos: {masterStockDate ? new Date(masterStockDate).toLocaleString('es-AR') : 'Nunca'}
               </CardDescription>
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
                 <Button onClick={handleProcess} className="bg-corporate-blue text-white hover:bg-corporate-blue/90 font-bold">
                     Procesar y Actualizar
                 </Button>
              </div>
           </CardContent>
        </Card>

        {showConfirmModal && (
          <Modal 
            isOpen={true} 
            onClose={() => setShowConfirmModal(false)} 
            onConfirm={() => executeUpdate(processedData, options.updateLoc, options.updateStock)}
            title="Confirmar Actualización de Conteo Activo"
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Se detectó un <b>Conteo Actual</b> en curso. Las descripciones se actualizarán automáticamente en todas las semanas.
              </p>
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <p className="text-sm font-bold text-amber-800 mb-3">¿Desea actualizar también los siguientes datos en las semanas activas?</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2 hover:bg-amber-100 rounded cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-amber-400 text-amber-600"
                      checked={options.updateLoc}
                      onChange={e => setOptions({...options, updateLoc: e.target.checked})}
                    />
                    <span className="text-sm font-medium">Actualizar Ubicaciones</span>
                  </label>
                  <label className="flex items-center gap-3 p-2 hover:bg-amber-100 rounded cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-amber-400 text-amber-600"
                      checked={options.updateStock}
                      onChange={e => setOptions({...options, updateStock: e.target.checked})}
                    />
                    <span className="text-sm font-medium">Actualizar Stock de Sistema (Columna 5)</span>
                  </label>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * Nota: Ubicación y Stock solo se actualizarán en semanas con estado "En Progreso" o "Pendiente".
              </p>
            </div>
          </Modal>
        )}
     </div>
  );
}