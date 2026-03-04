import React from 'react';
import { WeekData } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface DashboardIndicatorsProps {
  weeksData: WeekData[];
}

const getStatusColor = (percentage: number, thresholds: { red: number; yellow: number; green: number }) => {
  if (percentage <= thresholds.red) return 'text-red-600';
  if (percentage <= thresholds.yellow) return 'text-amber-600';
  return 'text-green-600';
};

const DashboardIndicators: React.FC<DashboardIndicatorsProps> = ({ weeksData }) => {
  const activeWeek = weeksData.find(w => w.status === 'En Progreso' || w.status === 'Pendiente');

  if (!activeWeek) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay conteos activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Por favor, inicie un nuevo conteo para ver los indicadores.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalItems = activeWeek.items.length;
  const countedItems = activeWeek.items.filter(item => item.quantity !== null).length;
  const itemsWithDeviation = activeWeek.items.filter(item => item.quantity !== null && item.systemStock !== item.quantity).length;

  const completionPercentage = totalItems > 0 ? (countedItems / totalItems) * 100 : 0;
  const deviationPercentage = countedItems > 0 ? (itemsWithDeviation / countedItems) * 100 : 0;

  const completionColor = getStatusColor(completionPercentage, { red: 69, yellow: 89, green: 100 });
  const deviationColor = getStatusColor(deviationPercentage, { red: 21, yellow: 20, green: 5 }); // Note: Red is for > 21

  const getDeviationColor = (percentage: number) => {
    if (percentage <= 5) return 'text-green-600';
    if (percentage <= 20) return 'text-amber-600';
    return 'text-red-600';
  };

  const deviationDisplayColor = getDeviationColor(deviationPercentage);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Cumplimiento de Conteo (Semana Actual)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-5xl font-bold ${completionColor}`}>
            {completionPercentage.toFixed(2)}%
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {countedItems} de {totalItems} ítems contados.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Desvíos Detectados (Semana Actual)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-5xl font-bold ${deviationDisplayColor}`}>
            {deviationPercentage.toFixed(2)}%
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {itemsWithDeviation} ítems con diferencias sobre {countedItems} contados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardIndicators;
