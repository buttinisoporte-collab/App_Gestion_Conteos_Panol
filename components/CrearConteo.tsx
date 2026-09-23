import React, { useState } from 'react';
import * as XLSX from 'xlsx'; // LIBRERÍA DE EXCEL AGREGADA
import { useAppContext } from '../context/AppContext';
import { WeekData, WeekStatus } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export default function CrearConteo({ onBack }: { onBack: () => void }) {
  const { createNewCount, masterStock } = useAppContext();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [weeks, setWeeks] = useState<{ id: string; name: string; start: string; end: string; rawData: string }[]>([
      { id: '1', name: 'Semana 1', start: '', end: '', rawData: '' }
  ]);

  const handleAddWeek = () => {
      const newId = (weeks.length + 1).toString();
      setWeeks([...weeks, { id: newId, name: `Semana ${newId}`, start: '', end: '', rawData: '' }]);
  };

  const handleWeekChange = (id: string, field: string, value: string) => {
      setWeeks(weeks.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const handleRemoveWeek = (id: string) => {
      setWeeks(weeks.filter(w => w.id !== id));
  };

  // Función para descargar la plantilla Excel vacía con solo ID_Material
  const handleDownloadTemplate = () => {
    const templateData = [
        { "ID_Material": "10054" },
        { "ID_Material": "10055" },
        { "ID_Material": "10056" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Carga");
    XLSX.writeFile(wb, "Plantilla_Semana_Conteo.xlsx");
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!name || !startDate || !endDate) {
          alert('Complete los datos generales del ciclo.');
          return;
      }

      const parsedWeeks: WeekData[] = [];

      for (let i = 0; i < weeks.length; i++) {
          const w = weeks[i];
          if (!w.start || !w.end || !w.rawData.trim()) {
              alert(`Complete las fechas y pegue los ID_Material para la ${w.name}`);
              return;
          }

          const lines = w.rawData.trim().split('\n');
          const items = [];
          const missingInMaster: string[] = [];
          
          for (let j = 0; j < lines.length; j++) {
              const line = lines[j].trim();
              if (!line) continue;

              // Tomar la primera columna por si pegaron una tabla o columna con comas/tabs/punto y coma
              const firstCol = line.split(/[\t;,]/)[0].trim().replace(/^["']|["']$/g, '');

              // Saltar cabecera si existe
              if (j === 0 && (firstCol.toLowerCase().includes('id') || firstCol.toLowerCase().includes('material'))) {
                  continue;
              }

              if (!firstCol) continue;

              // Buscar artículo en Stock Maestro
              const masterItem = masterStock
                  ? (masterStock[firstCol] || Object.values(masterStock).find(m => m.id.toLowerCase() === firstCol.toLowerCase()))
                  : undefined;

              if (!masterItem) {
                  missingInMaster.push(firstCol);
              }

              items.push({
                  id: `S${w.id}-${firstCol}`, // Se agrega el prefijo de semana al ID
                  materialId: firstCol,
                  description: masterItem?.description || `Material ${firstCol}`,
                  location: masterItem?.location || 'S/U',
                  systemStock: typeof masterItem?.systemStock === 'number' ? masterItem.systemStock : 0,
                  manufacturerCode: '',
                  category: masterItem?.type || '',
                  quantity: null
              });
          }

          if (items.length === 0) {
              alert(`No se encontraron ID_Material válidos en la ${w.name}. Verifique el formato.`);
              return;
          }

          if (missingInMaster.length > 0) {
              const sample = missingInMaster.slice(0, 5).join(', ');
              const confirmProceed = window.confirm(
                  `En la ${w.name}, hay ${missingInMaster.length} ID_Material que no se encontraron en el Stock Maestro (ej: ${sample}).\n\n¿Desea continuar de todos modos? Los ítems sin coincidencia se registrarán con datos pendientes.`
              );
              if (!confirmProceed) return;
          }

          parsedWeeks.push({
              id: `week-${Date.now()}-${w.id}`,
              name: w.name,
              startDate: w.start,
              endDate: w.end,
              status: i === 0 ? WeekStatus.EnProgreso : WeekStatus.Bloqueado,
              items: items
          });
      }

      await createNewCount(name, startDate, endDate, parsedWeeks);
      onBack();
  };

  return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button onClick={onBack} variant="secondary" className="mb-4">&larr; Cancelar y Volver</Button>
          <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                      <CardTitle>Crear Nuevo Ciclo de Conteo</CardTitle>
                  </div>
                  {/* BOTÓN DESCARGAR PLANTILLA EXCEL */}
                  <Button onClick={handleDownloadTemplate} variant="outline" className="mt-2 sm:mt-0 border-green-600 text-green-700 hover:bg-green-50 font-bold">
                      Descargar Plantilla Excel
                  </Button>
              </CardHeader>
              <CardContent>
                  <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Ciclo</label>
                              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Inventario General 2026" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Inicio General</label>
                              <Input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Fin General</label>
                              <Input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                          </div>
                      </div>

                      <div className="space-y-6">
                          {weeks.map((week, index) => (
                              <div key={week.id} className="p-4 border rounded-md bg-slate-50 relative">
                                  {index > 0 && (
                                      <button type="button" onClick={() => handleRemoveWeek(week.id)} className="absolute top-2 right-2 text-red-500 font-bold text-lg hover:text-red-700">&times;</button>
                                  )}
                                  <h4 className="font-bold text-lg mb-4 text-corporate-blue">{week.name}</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio Semana</label>
                                          <Input required type="date" value={week.start} onChange={e => handleWeekChange(week.id, 'start', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Fin Semana</label>
                                          <Input required type="date" value={week.end} onChange={e => handleWeekChange(week.id, 'end', e.target.value)} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Cargar ID_Material (Desde Excel)</label>
                                      <p className="text-xs text-slate-500 mb-2">Pegue la columna con los ID_Material. La descripción, ubicación, tipo y stock se obtendrán automáticamente del Stock Maestro.</p>
                                      <textarea 
                                          required 
                                          className="w-full h-32 p-2 border rounded-md font-mono text-sm" 
                                          placeholder="Pegue aquí los ID_Material (uno por línea)..."
                                          value={week.rawData}
                                          onChange={e => handleWeekChange(week.id, 'rawData', e.target.value)}
                                      />
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="mt-6 flex gap-4">
                          <Button type="button" onClick={handleAddWeek} variant="secondary" className="flex-1">
                              + Agregar Otra Semana
                          </Button>
                          <Button type="submit" className="flex-1 bg-corporate-blue text-white">
                              Crear Ciclo Completo
                          </Button>
                      </div>
                  </form>
              </CardContent>
          </Card>
      </div>
  );
}