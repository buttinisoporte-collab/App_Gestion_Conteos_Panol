
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Item, WeekData, WeekStatus } from '../types';
import { Button } from './ui/Button';
import AlertDialog from './ui/AlertDialog';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from './ui/Card';

interface CrearConteoProps {
  onBack: () => void;
}

const CrearConteo: React.FC<CrearConteoProps> = ({ onBack }) => {
  const { createNewCount } = useAppContext();
  const [countName, setCountName] = useState(`Conteo ${new Date().getFullYear()}`);
  const [numWeeks, setNumWeeks] = useState(8);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekItemsData, setWeekItemsData] = useState<string[]>(Array(numWeeks).fill(''));
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [generatedWeeks, setGeneratedWeeks] = useState<WeekData[]>([]);

  const handleNumWeeksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumWeeks = parseInt(e.target.value, 10) || 1;
    setNumWeeks(newNumWeeks);
    setWeekItemsData(prevData => {
      const newData = Array(newNumWeeks).fill('');
      prevData.slice(0, newNumWeeks).forEach((d, i) => newData[i] = d);
      return newData;
    });
  };

  const handleWeekItemsChange = (index: number, data: string) => {
    setWeekItemsData(prevData => {
      const newData = [...prevData];
      newData[index] = data;
      return newData;
    });
  };

  const handleCreateCount = () => {
    setError('');
    if (!countName.trim()) {
      setError('El nombre del conteo no puede estar vacío.');
      return;
    }
    if (numWeeks <= 0) {
      setError('El número de semanas debe ser mayor a cero.');
      return;
    }
    if (!startDate) {
      setError('Por favor, seleccione una fecha de inicio.');
      return;
    }
    if (weekItemsData.every(data => data.trim() === '')) {
        setError('Debe ingresar materiales en al menos una semana.');
        return;
    }

    const newWeeks: WeekData[] = [];
    const initialDate = new Date(startDate + 'T00:00:00');
    const dayOfWeek = initialDate.getDay();
    const daysToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
    const cycleStartDate = new Date(initialDate);
    cycleStartDate.setDate(cycleStartDate.getDate() + daysToMonday);

    for (let i = 0; i < numWeeks; i++) {
      const weekStartDate = new Date(cycleStartDate);
      weekStartDate.setDate(weekStartDate.getDate() + i * 7);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      const lines = weekItemsData[i].trim().split('\n');
      const weekItems: Item[] = [];
      
      if (lines.length > 0 && lines[0] !== '') {
        for (let j = 0; j < lines.length; j++) {
          const line = lines[j];
          const parts = line.split('\t');
          if (parts.length < 6) {
            setError(`Error en Semana ${i + 1}, Línea ${j + 1}: Se esperan 6 columnas.`);
            return;
          }
          const [id, description, manufacturerCode, category, location, systemStockStr] = parts;
          const systemStock = parseInt(systemStockStr, 10);
          if (isNaN(systemStock)) {
            setError(`Error en Semana ${i + 1}, Línea ${j + 1}: Stock de sistema no válido.`);
            return;
          }
          const weekId = `S${i + 1}`;
          weekItems.push({ 
            id: `${weekId}-${id}`, 
            description, 
            manufacturerCode, 
            category, 
            location, 
            systemStock, 
            quantity: null,
            materialId: id
          });
        }
      }

      newWeeks.push({
        id: `S${i + 1}`,
        name: `Semana ${i + 1}`,
        startDate: weekStartDate.toISOString().split('T')[0],
        endDate: weekEndDate.toISOString().split('T')[0],
        status: i === 0 ? WeekStatus.Pendiente : WeekStatus.Bloqueado,
        items: weekItems,
      });
    }

    setGeneratedWeeks(newWeeks);
    setShowConfirmModal(true);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button onClick={onBack} variant="secondary" className="mb-4">
        &larr; Volver al Dashboard
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Ciclo de Conteo</CardTitle>
          <CardDescription>
            Defina los parámetros y cargue la lista de materiales. Esto archivará el conteo actual y comenzará uno nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="countName">Nombre del Conteo</label>
              <Input
                id="countName"
                value={countName}
                onChange={(e) => setCountName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="startDate">Fecha de Inicio del Conteo</label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="numWeeks">Número de Semanas</label>
              <Input
                id="numWeeks"
                type="number"
                value={numWeeks}
                onChange={handleNumWeeksChange}
                min="1"
              />
            </div>
          </div>
          
          <p className="text-sm text-slate-600 font-medium">Carga de Materiales por Semana</p>
          <p className="text-xs text-slate-500">
              Copie y pegue desde una hoja de cálculo. Use tabulación como separador. <br/>
              Formato: ID	Descripción	Cód. Fabricante	Rubro	Ubicación	Stock Sistema
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: numWeeks }, (_, i) => (
              <div key={i} className="space-y-2">
                <label htmlFor={`week-items-${i}`} className="font-semibold">Semana {i + 1}</label>
                <textarea
                  id={`week-items-${i}`}
                  rows={8}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm font-mono"
                  placeholder={`Pegue aquí los artículos para la Semana ${i + 1}...`}
                  value={weekItemsData[i] || ''}
                  onChange={(e) => handleWeekItemsChange(i, e.target.value)}
                />
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateCount} className="w-full md:w-auto">
            Procesar y Crear Conteo
          </Button>
        </CardFooter>
      </Card>
      {showConfirmModal && (
        <AlertDialog 
          isOpen={true}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => {
            const cycleEndDate = new Date(generatedWeeks[generatedWeeks.length - 1].endDate!);
            createNewCount(countName, startDate, cycleEndDate.toISOString().split('T')[0], generatedWeeks);
            setShowConfirmModal(false);
            onBack();
          }}
          title="Confirmar Nuevo Conteo"
          description="¿Está seguro? Esta acción archivará el conteo actual (si existe) y comenzará uno nuevo con la configuración que ha definido."
          confirmText="Sí, Crear"
        />
      )}
    </div>
  );
};

export default CrearConteo;
