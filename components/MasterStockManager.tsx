// filepath: components/MasterStockManager.tsx
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { MasterStockItem } from '../types';
import Modal from './ui/Modal'; // Asegúrate de que esta ruta sea correcta

export default function MasterStockManager({ onBack }: { onBack: () => void }) {
  const { updateMasterStock, masterStockDate, countCycle } = useAppContext();
  
  // --- ESTADOS DECLARADOS (Evitan el error de ReferenceError) ---
  const [pasteData, setPasteData] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processedData, setProcessedData] = useState<Record<string, any>>({});
  const [options, setOptions] = useState({ updateLoc: false, updateStock: false });

  // Función para procesar el pegado de Excel
  const handleProcess = () => {
     const lines = pasteData.trim().split('\n');
     const newStock: Record<string, any> = {};
     let count = 0;
     
     lines.forEach((line, i) => {
        const cols = line.split('\t').map(c => c.trim());
        // Saltar cabecera si existe
        if (i === 0 && (cols[0].toLowerCase().includes('id') || cols[0].toLowerCase().includes('material'))) return;
        
        if (cols.length >= 4) {
           const id = cols[0];
           newStock[id] = { 
              id, 
              description: cols[1], 
              location: cols[2], 
              type: cols[3].toUpperCase() || 'S/T',
              systemStock: cols[4] ? Number(cols[4].replace(',', '.')) : undefined 
           };
           count++;
        }
     });

     if (count > 0) {
        setProcessedData(newStock);
        // Si hay un ciclo de conteo activo, preguntamos qué actualizar
        if (countCycle) {
          setShowConfirmModal(true);
        } else {
          // Si no hay ciclo activo, guardamos directo el stock maestro
          executeUpdate(newStock, false, false);
        }
     } else {
        alert('Datos inválidos. Copie al menos 4 columnas: ID, Descripción, Ubicación, TIPO (opcional 5ta: Stock).');
     }
  };

  // Función que llama al servicio en AppContext
  const executeUpdate = async (data: any, upLoc: boolean, upStock: boolean) => {
    try {
      const success = await updateMasterStock(data, upLoc, upStock);
      if (success) {
         alert(`¡Actualización Exitosa!\nSe procesaron ${Object.keys(data).length} artículos.\nLas descripciones se actualizaron en todo el ciclo.`);
         setPasteData('');
         setShowConfirmModal(false);
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Ocurrió un error al guardar los datos.");
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
                  Pegue aquí los datos desde su archivo Excel. El sistema espera:<br/>
                  <b>1. ID_Material | 2. Descripción | 3. Ubicacion | 4. TIPO | 5. Stock (Opcional)</b>
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

        {/* MODAL DE CONFIRMACIÓN */}
        {showConfirmModal && (
          <Modal 
            isOpen={true} 
            onClose={() => setShowConfirmModal(false)} 
            onConfirm={() => executeUpdate(processedData, options.updateLoc, options.updateStock)}
            title="Confirmar Actualización"
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Se detectó un <b>Conteo Actual</b>. Las descripciones se actualizarán en todas las semanas.
              </p>
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <p className="text-sm font-bold text-amber-800 mb-3">¿Actualizar también en semanas activas?</p>
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
            </div>
          </Modal>
        )}
     </div>
  );
}