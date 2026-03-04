import React from 'react';
import { WeekData } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Button } from './ui/Button';

interface ReporteSemanalProps {
  week: WeekData;
  onBack: () => void;
}

const ReporteSemanal: React.FC<ReporteSemanalProps> = ({ week, onBack }) => {
  const countedItems = week.items.filter(item => item.quantity !== null);
  const totalItems = week.items.length;
  const progress = totalItems > 0 ? (countedItems.length / totalItems) * 100 : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button onClick={onBack} variant="secondary" className="mb-4">
        &larr; Volver al Conteo
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Reporte de Conteo - {week.name}</CardTitle>
          <CardDescription>
            Resumen del estado y progreso del conteo para esta semana.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Progreso General</h3>
            <div className="w-full bg-slate-200 rounded-full h-4 mt-2">
              <div 
                className="bg-green-600 h-4 rounded-full"
                style={{ width: `${progress.toFixed(2)}%` }}
              ></div>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {countedItems.length} de {totalItems} items contados ({progress.toFixed(2)}%)
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Material</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-center">Stock Sistema</TableHead>
                <TableHead className="text-center">Cantidad Contada</TableHead>
                <TableHead className="text-center">Diferencia</TableHead>
                <TableHead>Fecha de Conteo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {week.items.map((item) => (
                <TableRow key={item.id} className={item.quantity === null ? 'bg-gray-50' : (item.systemStock !== item.quantity ? 'bg-red-50' : 'bg-green-50')}>
                  <TableCell className="font-mono">{item.id}</TableCell>
                  <TableCell className="font-medium">
                    {item.description}
                    <div className="text-xs text-slate-500 font-normal">{item.manufacturerCode}</div>
                  </TableCell>
                  <TableCell className="font-mono">{item.location}</TableCell>
                  <TableCell className="text-center font-semibold text-slate-600">{item.systemStock}</TableCell>
                  <TableCell className={`text-center font-bold ${item.quantity !== null && item.systemStock !== item.quantity ? 'text-red-600' : 'text-green-700'}`}>
                    {item.quantity ?? 'No contado'}
                  </TableCell>
                  <TableCell className="text-center font-bold text-red-600">
                    {item.quantity !== null && item.systemStock !== item.quantity ? item.quantity - item.systemStock : ''}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {item.countedDate ? new Date(item.countedDate).toLocaleDateString('es-AR') : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReporteSemanal;
