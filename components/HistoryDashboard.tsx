
import React, { useState } from 'react';
import HistoryMetrics from './HistoryMetrics';
import { useAppContext } from '../context/AppContext';
import { CountCycle, WeekData } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { AdminWeekDetailView, getStatusBadge } from './DashboardAdmin';
import AlertDialog from './ui/AlertDialog';

interface HistoryDashboardProps {
  onBack: () => void;
}

const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ onBack }) => {
  const { historicalCounts, deleteCurrentCount, user } = useAppContext();
  const [selectedCycle, setSelectedCycle] = useState<CountCycle | null>(null);
  const [dialog, setDialog] = useState<{ isOpen: boolean; title: string; description: string; onConfirm: () => void } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);

  if (selectedWeek) {
    return <AdminWeekDetailView week={selectedWeek} onBack={() => setSelectedWeek(null)} />;
  }
  
  if (selectedCycle) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button onClick={() => setSelectedCycle(null)} variant="secondary" className="mb-4">
          &larr; Volver al Historial
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Detalle Histórico: {selectedCycle.name}</CardTitle>
            <CardDescription>Creado el {new Date(selectedCycle.creationDate).toLocaleDateString('es-AR')}.</CardDescription>
            <HistoryMetrics historicalCounts={[selectedCycle]} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semana</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Modificado por</TableHead>
                  <TableHead>Fecha de Modificación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCycle.weeks.map((week) => (
                  <TableRow key={week.id} onClick={() => setSelectedWeek(week)} className="cursor-pointer hover:bg-slate-100">
                    <TableCell className="font-medium">{week.name}</TableCell>
                    <TableCell>{getStatusBadge(week.status)}</TableCell>
                    <TableCell>{week.lastModifiedBy || 'N/A'}</TableCell>
                    <TableCell>{week.lastModifiedDate ? new Date(week.lastModifiedDate).toLocaleString('es-AR') : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button onClick={onBack} variant="secondary" className="mb-4">
        &larr; Volver al Dashboard Principal
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Historial de Conteos</CardTitle>
          <CardDescription>Aquí puede consultar los resultados de ciclos de conteo anteriores.</CardDescription>
          <HistoryMetrics historicalCounts={historicalCounts} />
        </CardHeader>
        <CardContent>
          {historicalCounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Conteo</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Semanas Completadas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicalCounts.map((cycle) => {
                  const totalWeeks = cycle.weeks.length;
                  const completedWeeks = cycle.weeks.filter(w => w.status === 'Finalizado').length;
                  const isEliminado = cycle.name.includes('(ELIMINADO)');
                  return (
                    <TableRow key={cycle.id} onClick={() => setSelectedCycle(cycle)} className="cursor-pointer hover:bg-slate-100">
                      <TableCell className="font-medium">{cycle.name}</TableCell>
                      <TableCell>{new Date(cycle.creationDate).toLocaleDateString('es-AR')}</TableCell>
                      <TableCell>{completedWeeks} de {totalWeeks}</TableCell>
                      <TableCell className="text-right">
                        {user?.username === 'Admin' && (
                          <Button 
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDialog({
                                isOpen: true,
                                title: '¿Eliminar Conteo Histórico?',
                                description: `Está a punto de eliminar permanentemente el conteo "${cycle.name}". Esta acción no se puede deshacer.`,
                                onConfirm: () => {
                                  deleteCurrentCount(cycle.id);
                                  setDialog(null);
                                }
                              });
                            }}
                          >
                            Eliminar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-slate-500 py-8">No hay conteos históricos para mostrar.</p>
          )}
        </CardContent>
      </Card>
      {dialog && (
        <AlertDialog
          isOpen={dialog.isOpen}
          onClose={() => setDialog(null)}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
          description={dialog.description}
          confirmText="Sí, Eliminar"
        />
      )}
    </div>
  );
};

export default HistoryDashboard;
