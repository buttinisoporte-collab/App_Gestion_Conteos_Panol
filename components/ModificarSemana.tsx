import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Item, WeekData } from '../types';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from './ui/Card';

interface ModificarSemanaProps {
  week: WeekData;
  onBack: () => void;
}

const ModificarSemana: React.FC<ModificarSemanaProps> = ({ week, onBack }) => {
  const { updateWeekItems } = useAppContext();
  const [itemsData, setItemsData] = useState('');
  const [error, setError] = useState('');

  const handleUpdateItems = () => {
    setError('');
    const lines = itemsData.trim().split('\n');
    if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
      setError('Por favor, ingrese al menos un material.');
      return;
    }

    const newItems: Item[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split('\t');
      if (parts.length < 6) {
        setError(`Error en la línea ${i + 1}: Se esperan 6 columnas separadas por tabulación. Columnas encontradas: ${parts.length}.`);
        return;
      }
      const [id, description, manufacturerCode, category, location, systemStockStr] = parts;
      const systemStock = parseInt(systemStockStr, 10);
      if (isNaN(systemStock)) {
        setError(`Error en la línea ${i + 1}: El stock de sistema ('${systemStockStr}') no es un número válido.`);
        return;
      }
      newItems.push({
        id,
        description,
        manufacturerCode,
        category,
        location,
        systemStock,
        quantity: null,
      });
    }

    if (!window.confirm(`¿Está seguro? Esta acción reemplazará TODOS los ${week.items.length} artículos actuales de la ${week.name} con los ${newItems.length} nuevos artículos que ha pegado. Esta acción no se puede deshacer.`)) {
        return;
    }

    updateWeekItems(week.id, newItems);
    alert('¡Los artículos de la semana han sido actualizados con éxito!');
    onBack();
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button onClick={onBack} variant="secondary" className="mb-4">
        &larr; Volver al Conteo
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Modificar Items de {week.name}</CardTitle>
          <CardDescription>
            Pegue la nueva lista de materiales para reemplazar los existentes en esta semana.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="itemsData">Nueva Lista de Materiales</label>
            <p className="text-xs text-slate-500">
              Copie y pegue desde una hoja de cálculo. Use tabulación como separador. <br/>
              Formato esperado: ID	Descripción	Cód. Fabricante	Rubro	Ubicación	Stock Sistema
            </p>
            <textarea
              id="itemsData"
              rows={15}
              className="w-full rounded-md border border-slate-300 p-2 text-sm font-mono"
              placeholder="F001\tFiltro de Aceite...\tMANN-W940\tFiltros\tA1-S1-P1\t10"
              value={itemsData}
              onChange={(e) => setItemsData(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdateItems} className="w-full md:w-auto" variant="destructive">
            Reemplazar Items de la Semana
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ModificarSemana;
