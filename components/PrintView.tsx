
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { WeekData } from '../types';
import { Button } from './ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';

interface PrintViewProps {
  week: WeekData;
  onBack: () => void;
}

import { Check } from './ui/Icons';

const PrintView: React.FC<PrintViewProps> = ({ week, onBack }) => {
  const { user } = useAppContext();
  const today = new Date().toLocaleDateString('es-AR');
  const companyName = "Antonio Buttini e Hijos S.R.L";

  // Find all unique users who made changes
  const countedUsers = Array.from(new Set(week.items.flatMap(item => item.auditLog?.map(log => log.user) || [])));

  return (
    <div className="bg-white text-black">
        <header className="no-print p-4 bg-slate-100 border-b flex justify-between items-center">
            <h1 className="text-lg font-bold">Vista de Impresión</h1>
            <div>
                <Button onClick={onBack} variant="secondary" className="mr-2">Volver</Button>
                <Button onClick={() => window.print()}>Imprimir Planilla</Button>
            </div>
        </header>

        <main className="p-8 font-sans">
            <div className="print-area">
                <header className="flex justify-between items-end border-b-2 border-black pb-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold">{companyName}</h2>
                        <p className="text-xl">Planilla de Conteo de Inventario</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg"><span className="font-bold">Semana:</span> {week.name}</p>
                        <p><span className="font-bold">Fecha de Impresión:</span> {today}</p>
                    </div>
                </header>

                <Table className="border-collapse border border-slate-500">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="border border-slate-400 p-2">Descripción</TableHead>
                            <TableHead className="border border-slate-400 p-2">Posición</TableHead>
                            <TableHead className="border border-slate-400 p-2 text-center">Stock</TableHead>
                            <TableHead className="border border-slate-400 p-2 text-center">Contado</TableHead>
                            <TableHead className="border border-slate-400 p-2 text-center">Ajuste</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {week.items.map(item => {
                            const hasDifference = item.quantity !== null && item.systemStock !== item.quantity;
                            const lastLog = item.auditLog?.[item.auditLog.length - 1];
                            return (
                                <TableRow key={item.id}>
                                    <TableCell className="border border-slate-400 p-2">
                                        {item.description}
                                        <div className="text-xs text-slate-500 font-mono">{item.manufacturerCode || item.id}</div>
                                    </TableCell>
                                    <TableCell className="border border-slate-400 p-2 font-mono">{item.location}</TableCell>
                                    <TableCell className="border border-slate-400 p-2 text-center font-bold">{item.systemStock}</TableCell>
                                    <TableCell className="border border-slate-400 p-2 text-center font-bold">
                                        {item.quantity ?? '---'}
                                        {lastLog && (
                                            <div className="text-xs font-normal text-slate-600">
                                                {lastLog.user} ({new Date(lastLog.date).toLocaleDateString('es-AR')})
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="border border-slate-400 p-2 text-center">
                                        {hasDifference && <Check className="h-6 w-6 text-red-600 mx-auto" />}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                <footer className="mt-20 pt-8 text-sm">
                    <div className="flex justify-around items-start gap-8">
                        {countedUsers.map(user => (
                            <div key={user} className="w-1/4 text-center">
                                <p className="mt-12 border-t border-black pt-2">{user}</p>
                            </div>
                        ))}
                        <div key="supervisor" className="w-1/4 text-center">
                            <p className="mt-12 border-t border-black pt-2">{user?.role === 'admin' ? user.fullName : 'Supervisor de Conteo'}</p>
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    </div>
  );
};

export default PrintView;
